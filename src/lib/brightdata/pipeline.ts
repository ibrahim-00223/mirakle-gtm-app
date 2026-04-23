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
      // Upsert company
      const { data: company } = await supabase
        .from('companies')
        .upsert(
          {
            name: seller.name,
            website_url: seller.website_url,
            sector: seller.sector || input.sector,
            description: seller.description,
            linkedin_url: seller.linkedin_url,
            current_marketplaces: seller.current_marketplaces ?? [],
            is_enriched: true,
            enriched_at: new Date().toISOString(),
            enrichment_source: 'brightdata+claude',
          },
          { onConflict: 'website_url', ignoreDuplicates: false }
        )
        .select('id')
        .single()

      if (!company) continue

      // Link to campaign
      await supabase
        .from('campaign_companies')
        .upsert(
          {
            campaign_id: campaignId,
            company_id: company.id,
            match_score: Math.floor(Math.random() * 25) + 65,
            top_match_marketplace_name: input.source_marketplace_name ?? null,
            status: 'pending',
          },
          { onConflict: 'campaign_id,company_id', ignoreDuplicates: true }
        )

      enrichedCount++

      // Insert contacts
      for (const c of seller.contacts ?? []) {
        if (!c.first_name || !c.last_name) continue

        const { data: contact } = await supabase
          .from('contacts')
          .insert({
            company_id: company.id,
            first_name: c.first_name,
            last_name: c.last_name,
            title: c.title,
            email: c.email,
            linkedin_url: c.linkedin_url,
            enrichment_source: 'brightdata+claude',
            enriched_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (!contact) continue

        await supabase.from('campaign_contacts').insert({
          campaign_id: campaignId,
          contact_id: contact.id,
          company_id: company.id,
          outreach_status: 'pending',
        })

        contactCount++
      }
    } catch (err) {
      console.warn(`[pipeline] Failed to persist seller "${seller.name}":`, err)
    }
  }

  await completeScrapingJob(enrichJobId, enrichedCount)

  await updateCampaignStatus(campaignId, 'ready')
  console.log(
    `[pipeline] Campaign ${campaignId} ready — ${enrichedCount} companies, ${contactCount} contacts`
  )
}
