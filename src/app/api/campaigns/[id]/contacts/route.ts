import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLinkedInUrlFromCargo, getEmailFromCargo } from '@/lib/cargo/client'
import { extractContactsFromLinkedIn } from '@/lib/apify/client'

/**
 * POST /api/campaigns/[id]/contacts
 *
 * Pipeline d'enrichissement contacts pour toutes les entreprises de la campagne :
 *   1. Récupérer l'id seller + son domaine depuis la DB
 *   2. Cargo : domain → URL LinkedIn entreprise
 *   3. Apify actor : company LinkedIn URL → key personas (nom, prénom, titre, linkedin_profile_url)
 *   4. Apify email finder : prénom + nom + company_linkedin_url + contact_linkedin_url → email
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  const supabase = await createServerSupabaseClient()

  // Récupérer toutes les entreprises liées à cette campagne
  const { data: rows, error } = await supabase
    .from('campaign_companies')
    .select('company_id, companies(id, name, domain, website_url, linkedin_url)')
    .eq('campaign_id', campaignId)

  if (error || !rows?.length) {
    return NextResponse.json(
      { data: null, error: 'Aucune entreprise trouvée — lancez d\'abord le scraping.' },
      { status: 404 }
    )
  }

  // Fire & forget — le pipeline tourne en arrière-plan
  runContactPipeline(campaignId, rows, supabase).catch((err) =>
    console.error('[ContactPipeline] Fatal error:', err)
  )

  return NextResponse.json({
    data: {
      campaign_id: campaignId,
      companies_count: rows.length,
      message: `Pipeline contacts lancé pour ${rows.length} entreprise(s) — Cargo → Apify → Email.`,
    },
  })
}

// ── Types ────────────────────────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

interface CompanyRow {
  id: string
  name: string
  domain: string | null
  website_url: string | null
  linkedin_url: string | null
}

// ── Pipeline ─────────────────────────────────────────────────────────────────

async function runContactPipeline(
  campaignId: string,
  rows: Array<{ company_id: string; companies: unknown }>,
  supabase: SupabaseClient
) {
  let totalContacts = 0

  for (const row of rows) {
    const company = row.companies as CompanyRow | null
    if (!company) continue

    console.log(`[ContactPipeline] ── Processing "${company.name}" (${company.id}) ──`)

    // Vérifier si des contacts existent déjà pour cette entreprise dans cette campagne
    const { data: existingContacts } = await supabase
      .from('campaign_contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('company_id', company.id)
      .limit(1)
      .maybeSingle()

    if (existingContacts) {
      console.log(`[ContactPipeline] "${company.name}" already has contacts — skipping`)
      continue
    }

    try {
      // ── Étape 1 : domaine disponible ? ───────────────────────────────────
      const domain = company.domain ?? extractDomain(company.website_url)
      if (!domain) {
        console.warn(`[ContactPipeline] No domain for "${company.name}" — skipping`)
        continue
      }

      // ── Étape 2 : Cargo → URL LinkedIn entreprise ────────────────────────
      let companyLinkedinUrl = company.linkedin_url

      if (!companyLinkedinUrl) {
        console.log(`[ContactPipeline] Cargo: enriching domain "${domain}"`)
        const cargoResult = await getLinkedInUrlFromCargo(domain)
        companyLinkedinUrl = cargoResult.linkedin_company_url

        if (companyLinkedinUrl) {
          // Persister le LinkedIn trouvé sur la company
          await supabase
            .from('companies')
            .update({ linkedin_url: companyLinkedinUrl })
            .eq('id', company.id)
          console.log(`[ContactPipeline] Cargo ✓ LinkedIn: ${companyLinkedinUrl}`)
        } else {
          console.warn(`[ContactPipeline] Cargo found no LinkedIn for "${domain}"`)
          continue
        }
      }

      // ── Étape 3 : Apify → key personas depuis LinkedIn entreprise ────────
      console.log(`[ContactPipeline] Apify: extracting contacts from ${companyLinkedinUrl}`)
      const personas = await extractContactsFromLinkedIn(companyLinkedinUrl, 10)
      console.log(`[ContactPipeline] Apify found ${personas.length} personas for "${company.name}"`)

      // ── Étape 4 : Pour chaque persona → email via Apify email finder ─────
      for (const persona of personas) {
        if (!persona.first_name && !persona.last_name) continue
        if (!persona.linkedin_profile_url) continue

        console.log(`[ContactPipeline] Cargo email finder: ${persona.first_name} ${persona.last_name}`)

        const enriched = await getEmailFromCargo({
          first_name: persona.first_name,
          last_name: persona.last_name,
          company_linkedin_url: companyLinkedinUrl,
          contact_linkedin_url: persona.linkedin_profile_url,
        })

        // Chercher si le contact existe déjà (par LinkedIn ou par nom + company)
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('company_id', company.id)
          .eq('first_name', persona.first_name)
          .eq('last_name', persona.last_name)
          .maybeSingle()

        let contactId: string | null = existing?.id ?? null

        if (!contactId) {
          const { data: newContact, error: insertErr } = await supabase
            .from('contacts')
            .insert({
              company_id: company.id,
              first_name: persona.first_name,
              last_name: persona.last_name,
              title: persona.title ?? null,
              email: enriched.email ?? null,
              linkedin_url: persona.linkedin_profile_url,
              is_decision_maker: isDecisionMaker(persona.title),
              email_verified: enriched.email_verified,
              enrichment_source: 'cargo+apify',
              enriched_at: new Date().toISOString(),
            })
            .select('id')
            .single()

          if (insertErr) {
            console.warn(`[ContactPipeline] Insert failed:`, insertErr.message)
            continue
          }
          contactId = newContact?.id ?? null
          console.log(`[ContactPipeline] ✓ ${persona.first_name} ${persona.last_name} — email: ${enriched.email ?? 'not found'}`)
        }

        if (!contactId) continue

        // Lier à la campagne
        const { data: existingLink } = await supabase
          .from('campaign_contacts')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('contact_id', contactId)
          .maybeSingle()

        if (!existingLink) {
          await supabase.from('campaign_contacts').insert({
            campaign_id: campaignId,
            contact_id: contactId,
            company_id: company.id,
            outreach_status: 'pending',
          })
        }

        totalContacts++
      }
    } catch (err) {
      console.warn(`[ContactPipeline] Error for "${company.name}":`, err)
    }
  }

  // Mettre à jour contact_count sur la campagne
  const { data: ccRows } = await supabase
    .from('campaign_contacts')
    .select('id', { count: 'exact' })
    .eq('campaign_id', campaignId)

  await supabase
    .from('campaigns')
    .update({ contact_count: ccRows?.length ?? totalContacts, updated_at: new Date().toISOString() })
    .eq('id', campaignId)

  console.log(`[ContactPipeline] Done — ${totalContacts} new contacts for campaign ${campaignId}`)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractDomain(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null
  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function isDecisionMaker(title: string | null): boolean {
  if (!title) return false
  const t = title.toLowerCase()
  return ['ceo', 'coo', 'cto', 'cmo', 'cfo', 'founder', 'co-founder', 'vp', 'vice president', 'director', 'head of'].some((k) => t.includes(k))
}
