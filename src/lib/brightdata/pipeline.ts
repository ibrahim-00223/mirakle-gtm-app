import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { CreateCampaignInput } from '@/types'
import { scrapeMarketplaceSellers } from './extractors/marketplace-sellers'
import { enrichCompanyFromWebsite, findContactsOnWebsite } from './extractors/company-profile'

async function updateCampaignStatus(campaignId: string, status: string) {
  const supabase = await createServerSupabaseClient()
  await supabase.from('campaigns').update({ status }).eq('id', campaignId)
}

async function insertScrapingJob(campaignId: string, jobType: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('scraping_jobs')
    .insert({ campaign_id: campaignId, job_type: jobType, status: 'running', started_at: new Date().toISOString() })
    .select('id')
    .single()
  return data?.id as string | undefined
}

async function completeScrapingJob(jobId: string, resultCount: number, error?: string) {
  if (!jobId) return
  const supabase = await createServerSupabaseClient()
  await supabase.from('scraping_jobs').update({
    status: error ? 'failed' : 'completed',
    result_count: resultCount,
    error_message: error ?? null,
    completed_at: new Date().toISOString(),
  }).eq('id', jobId)
}

export async function runScrapingPipeline(
  campaignId: string,
  input: CreateCampaignInput
): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const marketplaceName = input.source_marketplace_name ?? input.name

  console.log(`[pipeline] Starting for campaign ${campaignId} — marketplace: ${marketplaceName}`)

  // Step 1: Scrape sellers
  const jobId1 = await insertScrapingJob(campaignId, 'find_sellers')
  let sellers: Awaited<ReturnType<typeof scrapeMarketplaceSellers>> = []

  try {
    sellers = await scrapeMarketplaceSellers(marketplaceName)
    await completeScrapingJob(jobId1 ?? '', sellers.length)
  } catch (err) {
    console.error('[pipeline] Step 1 (find_sellers) failed:', err)
    await completeScrapingJob(jobId1 ?? '', 0, String(err))
    await updateCampaignStatus(campaignId, 'ready')
    return
  }

  // Filter to first 20 sellers to avoid rate limits
  const batch = sellers.slice(0, 20)

  // Step 2: Enrich companies and insert into DB
  const jobId2 = await insertScrapingJob(campaignId, 'enrich_company')
  let enrichedCount = 0

  for (const seller of batch) {
    try {
      let profile = { name: seller.name, description: seller.description, linkedin_url: null as string | null, country_code: seller.country_code, tech_stack: [] as string[], employee_count_approx: null as number | null }

      if (seller.website_url || seller.boutique_url) {
        const url = seller.website_url ?? seller.boutique_url!
        const enriched = await enrichCompanyFromWebsite(url)
        profile = {
          name: enriched.name ?? seller.name,
          description: enriched.description ?? seller.description,
          linkedin_url: enriched.linkedin_url,
          country_code: enriched.country_code ?? seller.country_code,
          tech_stack: enriched.tech_stack,
          employee_count_approx: enriched.employee_count_approx,
        }
      }

      // Upsert company (global registry)
      const { data: company } = await supabase
        .from('companies')
        .upsert({
          name: profile.name ?? seller.name,
          website_url: seller.website_url ?? seller.boutique_url,
          sector: input.sector,
          description: profile.description,
          linkedin_url: profile.linkedin_url,
          country_code: profile.country_code,
          tech_stack: profile.tech_stack,
          employee_count_approx: profile.employee_count_approx,
          current_marketplaces: [marketplaceName],
          is_enriched: !!(seller.website_url || seller.boutique_url),
          enriched_at: new Date().toISOString(),
          enrichment_source: 'brightdata',
        }, { onConflict: 'website_url', ignoreDuplicates: false })
        .select('id')
        .single()

      if (!company) continue

      // Link to campaign
      await supabase
        .from('campaign_companies')
        .upsert({
          campaign_id: campaignId,
          company_id: company.id,
          match_score: Math.floor(Math.random() * 30) + 60, // placeholder until AI scoring
          top_match_marketplace_name: marketplaceName,
          status: 'pending',
        }, { onConflict: 'campaign_id,company_id', ignoreDuplicates: true })

      enrichedCount++
    } catch (err) {
      console.warn(`[pipeline] Failed to enrich seller "${seller.name}":`, err)
    }
  }

  await completeScrapingJob(jobId2 ?? '', enrichedCount)

  // Step 3: Find contacts
  const jobId3 = await insertScrapingJob(campaignId, 'find_contacts')
  let contactCount = 0

  // Fetch company IDs we just inserted for this campaign
  const { data: campaignCompanies } = await supabase
    .from('campaign_companies')
    .select('company_id, companies(id, website_url)')
    .eq('campaign_id', campaignId)
    .limit(10)

  for (const row of campaignCompanies ?? []) {
    const company = row.companies as unknown as { id: string; website_url: string | null } | null
    if (!company?.website_url) continue

    try {
      const contacts = await findContactsOnWebsite(company.website_url)

      for (const c of contacts) {
        const { data: contact } = await supabase
          .from('contacts')
          .insert({
            company_id: company.id,
            first_name: c.first_name,
            last_name: c.last_name,
            title: c.title,
            email: c.email,
            linkedin_url: c.linkedin_url,
            enrichment_source: 'brightdata',
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
        }).select().single()

        contactCount++
      }
    } catch (err) {
      console.warn(`[pipeline] Contact scraping failed for company ${company.id}:`, err)
    }
  }

  await completeScrapingJob(jobId3 ?? '', contactCount)

  // Step 4: Mark campaign as ready
  await updateCampaignStatus(campaignId, 'ready')
  console.log(`[pipeline] Campaign ${campaignId} ready — ${enrichedCount} companies, ${contactCount} contacts`)
}
