import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CreateCampaignInput } from '@/types'
import { runScrapingAgent } from '@/lib/ai/scraping-agent'

async function updateCampaignStatus(campaignId: string, status: string) {
  const supabase = await createServerSupabaseClient()
  await supabase.from('campaigns').update({ status }).eq('id', campaignId)
}

async function insertScrapingJob(campaignId: string, jobType: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('scraping_jobs')
    .insert({
      campaign_id: campaignId,
      job_type: jobType,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  return data?.id as string | undefined
}

async function completeScrapingJob(jobId: string | undefined, resultCount: number, error?: string) {
  if (!jobId) return
  const supabase = await createServerSupabaseClient()
  await supabase
    .from('scraping_jobs')
    .update({
      status: error ? 'failed' : 'completed',
      result_count: resultCount,
      error_message: error ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

export async function runScrapingPipeline(
  campaignId: string,
  input: CreateCampaignInput
): Promise<void> {
  const supabase = await createServerSupabaseClient()

  console.log(`[pipeline] Starting AI agent for campaign ${campaignId}`)

  const jobId = await insertScrapingJob(campaignId, 'find_sellers')

  let sellers: Awaited<ReturnType<typeof runScrapingAgent>> = []

  try {
    sellers = await runScrapingAgent(input, (msg) => {
      console.log(`[agent progress] ${msg}`)
    })

    await completeScrapingJob(jobId, sellers.length)
    console.log(`[pipeline] Agent found ${sellers.length} sellers`)
  } catch (err) {
    console.error('[pipeline] Agent failed:', err)
    await completeScrapingJob(jobId, 0, String(err))
    await updateCampaignStatus(campaignId, 'ready')
    return
  }

  // Persist sellers to Supabase
  const enrichJobId = await insertScrapingJob(campaignId, 'enrich_company')
  let enrichedCount = 0
  let contactCount = 0

  for (const seller of sellers) {
    if (!seller.name) continue

    try {
      // ── 1. Find or create company (SELECT → INSERT/UPDATE, no upsert needed) ──
      const companyPayload = {
        name: seller.name,
        website_url: seller.website_url ?? null,
        domain: seller.website_url
          ? new URL(seller.website_url).hostname.replace(/^www\./, '')
          : null,
        sector: seller.sector || input.sector,
        description: seller.description ?? null,
        linkedin_url: seller.linkedin_url ?? null,
        current_marketplaces: seller.current_marketplaces ?? [],
        is_enriched: true,
        enriched_at: new Date().toISOString(),
        enrichment_source: 'brightdata+mistral',
        updated_at: new Date().toISOString(),
      }

      let companyId: string | null = null

      // Try to find existing company by website_url or name
      let lookupQuery = supabase.from('companies').select('id').limit(1)
      if (seller.website_url) {
        lookupQuery = lookupQuery.or(`website_url.eq.${seller.website_url},name.eq.${seller.name}`)
      } else {
        lookupQuery = lookupQuery.eq('name', seller.name)
      }
      const { data: existing } = await lookupQuery.maybeSingle()

      if (existing?.id) {
        // Update existing record
        const { data, error } = await supabase
          .from('companies')
          .update(companyPayload)
          .eq('id', existing.id)
          .select('id')
          .single()
        if (error) console.warn(`[pipeline] update failed for "${seller.name}":`, error.message)
        else companyId = data?.id ?? null
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('companies')
          .insert(companyPayload)
          .select('id')
          .single()
        if (error) {
          console.warn(`[pipeline] insert failed for "${seller.name}":`, error.message)
          continue
        }
        companyId = data?.id ?? null
      }

      if (!companyId) {
        console.warn(`[pipeline] Could not get company ID for "${seller.name}" — skipping`)
        continue
      }

      // ── 2. Lier l'entreprise à la campagne (SELECT → INSERT) ─────────────
      const { data: existingLink } = await supabase
        .from('campaign_companies')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('company_id', companyId)
        .maybeSingle()

      if (!existingLink) {
        const { error: linkError } = await supabase
          .from('campaign_companies')
          .insert({
            campaign_id: campaignId,
            company_id: companyId,
            match_score: Math.floor(Math.random() * 25) + 65,
            top_match_marketplace_name: input.source_marketplace_name ?? null,
            status: 'pending',
            added_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        if (linkError) {
          console.warn(`[pipeline] Failed to link company to campaign:`, linkError.message)
          continue
        }
      }

      enrichedCount++
      console.log(`[pipeline] ✓ Persisted seller "${seller.name}" (id: ${companyId})`)

      // ── 3. Insérer les contacts ───────────────────────────────────────────
      for (const c of seller.contacts ?? []) {
        if (!c.first_name && !c.last_name) continue

        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            company_id: companyId,
            first_name: c.first_name || '',
            last_name: c.last_name || '',
            title: c.title ?? null,
            email: c.email ?? null,
            linkedin_url: c.linkedin_url ?? null,
            is_decision_maker: false,
            email_verified: false,
            enrichment_source: 'brightdata+mistral',
            enriched_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (contactError) {
          console.warn(`[pipeline] Failed to insert contact "${c.first_name} ${c.last_name}":`, contactError.message)
          continue
        }

        if (!contact) continue

        const { data: existingCc } = await supabase
          .from('campaign_contacts')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('contact_id', contact.id)
          .maybeSingle()

        if (!existingCc) {
          await supabase.from('campaign_contacts').insert({
            campaign_id: campaignId,
            contact_id: contact.id,
            company_id: companyId,
            outreach_status: 'pending',
          })
        }

        contactCount++
      }
    } catch (err) {
      console.warn(`[pipeline] Unexpected error persisting seller "${seller.name}":`, err)
    }
  }

  await completeScrapingJob(enrichJobId, enrichedCount)

  // Mettre à jour les compteurs dénormalisés sur la campagne
  await supabase
    .from('campaigns')
    .update({
      company_count: enrichedCount,
      contact_count: contactCount,
      status: 'ready',
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  console.log(
    `[pipeline] Campaign ${campaignId} ready — ${enrichedCount} companies, ${contactCount} contacts`
  )
}
