import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLinkedInUrlFromCargo } from '@/lib/cargo/client'
import { extractContactsFromLinkedIn, enrichContactFromLinkedIn } from '@/lib/apify/client'

/**
 * POST /api/enrichment/trigger
 * Lance le pipeline d'enrichissement en cascade :
 *   1. Cargo → LinkedIn URL de l'entreprise
 *   2. Apify → Extraction des contacts depuis LinkedIn
 *   3. Apify → Enrichissement email/téléphone par profil LinkedIn
 *
 * GET /api/enrichment/trigger?job_id=...
 * Retourne le statut d'un job d'enrichissement
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json({ data: null, error: 'job_id is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: job, error } = await supabase
      .from('scraping_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) throw error

    return NextResponse.json({
      data: {
        job_id: job.id,
        status: job.status,
        company_id: job.query_params?.company_id,
        steps_completed: job.query_params?.steps_completed ?? [],
        contacts_found: job.result_count ?? 0,
        contacts_enriched: job.existing_records_updated ?? 0,
      },
    })
  } catch (err) {
    console.error('[GET /api/enrichment/trigger]', err)
    return NextResponse.json({ data: null, error: 'Job not found' }, { status: 404 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company_id, contact_ids, domain } = body

    if (!company_id) {
      return NextResponse.json({ data: null, error: 'company_id is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Récupérer l'entreprise
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ data: null, error: 'Company not found' }, { status: 404 })
    }

    // Créer un job de tracking
    const { data: job } = await supabase
      .from('scraping_jobs')
      .insert({
        campaign_id: null,
        job_type: 'find_contacts',
        status: 'running',
        query_params: {
          company_id,
          domain: domain ?? company.domain,
          steps_completed: [],
        },
        new_records_created: 0,
        existing_records_updated: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Lancer le pipeline asynchrone (sans attendre)
    runEnrichmentPipeline(supabase, job!.id, company, contact_ids).catch((err) =>
      console.error('[Enrichment] Pipeline error:', err)
    )

    return NextResponse.json({
      data: {
        job_id: job!.id,
        status: 'running',
        company_id,
        steps_completed: [],
        contacts_found: 0,
        contacts_enriched: 0,
      },
    })
  } catch (err) {
    console.error('[POST /api/enrichment/trigger]', err)
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

type SupabaseClient = Awaited<ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient>>

async function runEnrichmentPipeline(
  supabase: SupabaseClient,
  jobId: string,
  company: Record<string, unknown>,
  contactIds?: string[]
) {
  const steps: string[] = []
  let contactsFound = 0
  let contactsEnriched = 0

  try {
    // ── Étape 1 : Cargo → LinkedIn URL ──────────────────────────────────────
    const domain = (company.domain as string) ?? (company.website_url as string)?.replace(/^https?:\/\//, '').split('/')[0]

    let linkedinUrl = company.linkedin_url as string | null

    if (!linkedinUrl && domain) {
      const cargoResult = await getLinkedInUrlFromCargo(domain)
      if (cargoResult.enriched && cargoResult.linkedin_company_url) {
        linkedinUrl = cargoResult.linkedin_company_url

        // Mettre à jour l'entreprise avec l'URL LinkedIn
        await supabase
          .from('companies')
          .update({ linkedin_url: linkedinUrl, enrichment_source: 'cargo' })
          .eq('id', company.id as string)
      }
    }

    steps.push('linkedin_url')
    await updateJobSteps(supabase, jobId, steps)

    // ── Étape 2 : Apify → Extraction des contacts ────────────────────────────
    if (linkedinUrl) {
      const apifyContacts = await extractContactsFromLinkedIn(linkedinUrl, 15)
      contactsFound = apifyContacts.length

      // Insérer les contacts extraits
      for (const ac of apifyContacts) {
        const { data: newContact } = await supabase
          .from('contacts')
          .upsert({
            company_id: company.id as string,
            first_name: ac.first_name,
            last_name: ac.last_name,
            title: ac.title,
            department: ac.department,
            seniority: ac.seniority,
            linkedin_url: ac.linkedin_profile_url,
            is_decision_maker: isDecisionMaker(ac.title),
            enrichment_source: 'apify',
            enriched_at: new Date().toISOString(),
          }, { onConflict: 'linkedin_url' })
          .select()
          .single()

        // ── Étape 3 : Enrichir email/téléphone ──────────────────────────────
        if (newContact && ac.linkedin_profile_url) {
          const enriched = await enrichContactFromLinkedIn(ac.linkedin_profile_url)

          if (enriched.email || enriched.phone) {
            await supabase
              .from('contacts')
              .update({
                email: enriched.email ?? newContact.email,
                phone: enriched.phone ?? newContact.phone,
                email_verified: enriched.email_verified,
                enrichment_source: enriched.source,
                enriched_at: new Date().toISOString(),
              })
              .eq('id', newContact.id)

            contactsEnriched++
          }
        }
      }

      steps.push('contacts', 'email_phone')
    } else {
      // Si pas de LinkedIn, tenter l'enrichissement des contacts existants
      if (contactIds?.length) {
        const { data: existingContacts } = await supabase
          .from('contacts')
          .select('*')
          .in('id', contactIds)

        for (const contact of existingContacts ?? []) {
          if (contact.linkedin_url) {
            const enriched = await enrichContactFromLinkedIn(contact.linkedin_url)
            if (enriched.email || enriched.phone) {
              await supabase
                .from('contacts')
                .update({ email: enriched.email, phone: enriched.phone })
                .eq('id', contact.id)
              contactsEnriched++
            }
          }
        }
        contactsFound = contactIds.length
      }
      steps.push('email_phone')
    }

    // Mettre à jour le statut du job
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_count: contactsFound,
        new_records_created: contactsFound,
        existing_records_updated: contactsEnriched,
        query_params: { company_id: company.id, steps_completed: steps },
      })
      .eq('id', jobId)

    // Marquer l'entreprise comme enrichie
    await supabase
      .from('companies')
      .update({ is_enriched: true, enriched_at: new Date().toISOString() })
      .eq('id', company.id as string)
  } catch (err) {
    console.error('[EnrichmentPipeline] Error:', err)
    await supabase
      .from('scraping_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: err instanceof Error ? err.message : String(err),
        query_params: { company_id: company.id, steps_completed: steps },
      })
      .eq('id', jobId)
  }
}

async function updateJobSteps(supabase: SupabaseClient, jobId: string, steps: string[]) {
  await supabase
    .from('scraping_jobs')
    .update({ query_params: { steps_completed: steps } })
    .eq('id', jobId)
}

function isDecisionMaker(title: string | null): boolean {
  if (!title) return false
  const dmTitles = ['ceo', 'coo', 'cmo', 'cto', 'founder', 'co-founder', 'president', 'vp', 'vice president', 'director', 'head of', 'chief']
  const lower = title.toLowerCase()
  return dmTitles.some((t) => lower.includes(t))
}
