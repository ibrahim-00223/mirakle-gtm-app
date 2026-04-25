import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isBrightDataConfigured, runScrapingPipeline } from '@/lib/brightdata'
import { triggerWorkflow1 } from '@/lib/n8n/webhooks'

/**
 * POST /api/campaigns/[id]/scraping
 * Re-déclenche le pipeline de scraping (recherche de sellers) pour une campagne existante.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    // Récupérer la campagne
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !campaign) {
      return NextResponse.json({ data: null, error: 'Campaign not found' }, { status: 404 })
    }

    // Créer un scraping job de traçabilité
    const { data: job } = await supabase
      .from('scraping_jobs')
      .insert({
        campaign_id: id,
        job_type: 'find_sellers',
        status: 'pending',
        query_params: {
          mode: campaign.mode,
          source_marketplace_name: campaign.source_marketplace_name,
          sector: campaign.sector,
          catalog_size: campaign.catalog_size,
          target_regions: campaign.target_regions,
          triggered_manually: true,
        },
        new_records_created: 0,
        existing_records_updated: 0,
      })
      .select()
      .single()

    // Passer la campagne en "generating"
    await supabase
      .from('campaigns')
      .update({ status: 'generating' })
      .eq('id', id)

    // Déclencher le pipeline (BrightData ou N8N)
    if (isBrightDataConfigured()) {
      runScrapingPipeline(id, campaign).catch((err) =>
        console.error('[ManualScraping] BrightData pipeline failed:', err)
      )
    } else {
      triggerWorkflow1(id, campaign).catch((err) =>
        console.error('[ManualScraping] N8N Workflow1 trigger failed:', err)
      )
    }

    return NextResponse.json({
      data: {
        job_id: job?.id ?? null,
        status: 'generating',
        campaign_id: id,
        message: 'Scraping lancé — les sellers apparaîtront dans quelques instants.',
      },
    })
  } catch (err) {
    console.error('[POST /api/campaigns/[id]/scraping]', err)
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
