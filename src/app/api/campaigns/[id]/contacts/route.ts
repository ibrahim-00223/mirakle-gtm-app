import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLinkedInUrlFromCargo } from '@/lib/cargo/client'
import { extractContactsFromLinkedIn } from '@/lib/apify/client'

/**
 * POST /api/campaigns/[id]/contacts
 * Pour chaque entreprise de la campagne, déclenche Cargo → Apify pour trouver les contacts.
 * Tourne en arrière-plan (fire & forget).
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
      { data: null, error: 'Aucune entreprise trouvée pour cette campagne' },
      { status: 404 }
    )
  }

  // Lancer le pipeline en arrière-plan
  runContactPipeline(campaignId, rows, supabase).catch((err) =>
    console.error('[ContactPipeline] Fatal error:', err)
  )

  return NextResponse.json({
    data: {
      campaign_id: campaignId,
      companies_count: rows.length,
      message: `Recherche de contacts lancée pour ${rows.length} entreprise(s).`,
    },
  })
}

// ── Pipeline arrière-plan ────────────────────────────────────────────────────

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

async function runContactPipeline(
  campaignId: string,
  rows: Array<{ company_id: string; companies: unknown }>,
  supabase: SupabaseClient
) {
  let totalContacts = 0

  for (const row of rows) {
    const company = row.companies as {
      id: string
      name: string
      domain: string | null
      website_url: string | null
      linkedin_url: string | null
    } | null

    if (!company) continue

    console.log(`[ContactPipeline] Processing "${company.name}"`)

    // Vérifier si des contacts existent déjà
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('company_id', company.id)
      .limit(1)
      .maybeSingle()

    if (existing) {
      console.log(`[ContactPipeline] "${company.name}" already has contacts — skipping`)
      continue
    }

    try {
      // Étape 1 : obtenir le LinkedIn de l'entreprise (Cargo ou déjà connu)
      let linkedinUrl = company.linkedin_url

      if (!linkedinUrl && company.domain) {
        const cargoResult = await getLinkedInUrlFromCargo(company.domain)
        if (cargoResult.linkedin_company_url) {
          linkedinUrl = cargoResult.linkedin_company_url
          // Mettre à jour la company avec le LinkedIn trouvé
          await supabase
            .from('companies')
            .update({ linkedin_url: linkedinUrl })
            .eq('id', company.id)
        }
      }

      // Étape 2 : extraire les contacts via Apify
      if (linkedinUrl) {
        const contacts = await extractContactsFromLinkedIn(linkedinUrl)

        for (const c of contacts) {
          if (!c.first_name && !c.last_name) continue

          // Chercher si le contact existe déjà (par email ou par nom + company)
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('company_id', company.id)
            .eq('first_name', c.first_name || '')
            .eq('last_name', c.last_name || '')
            .maybeSingle()

          let contactId: string | null = existingContact?.id ?? null

          if (!contactId) {
            const { data: newContact, error: insertError } = await supabase
              .from('contacts')
              .insert({
                company_id: company.id,
                first_name: c.first_name || '',
                last_name: c.last_name || '',
                title: c.title ?? null,
                email: c.email ?? null,
                linkedin_url: c.linkedin_url ?? null,
                is_decision_maker: false,
                email_verified: false,
                enrichment_source: 'cargo+apify',
                enriched_at: new Date().toISOString(),
              })
              .select('id')
              .single()

            if (insertError) {
              console.warn(`[ContactPipeline] Insert contact failed:`, insertError.message)
              continue
            }
            contactId = newContact?.id ?? null
          }

          if (!contactId) continue

          // Lier à la campagne
          const { data: existingCc } = await supabase
            .from('campaign_contacts')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('contact_id', contactId)
            .maybeSingle()

          if (!existingCc) {
            await supabase.from('campaign_contacts').insert({
              campaign_id: campaignId,
              contact_id: contactId,
              company_id: company.id,
              outreach_status: 'pending',
            })
          }

          totalContacts++
        }
      } else {
        console.log(`[ContactPipeline] No LinkedIn URL for "${company.name}" — skipping Apify`)
      }
    } catch (err) {
      console.warn(`[ContactPipeline] Error for "${company.name}":`, err)
    }
  }

  // Mettre à jour le compteur contact_count sur la campagne
  const { data: ccRows } = await supabase
    .from('campaign_contacts')
    .select('id')
    .eq('campaign_id', campaignId)

  await supabase
    .from('campaigns')
    .update({
      contact_count: ccRows?.length ?? totalContacts,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  console.log(`[ContactPipeline] Done — ${totalContacts} new contacts for campaign ${campaignId}`)
}
