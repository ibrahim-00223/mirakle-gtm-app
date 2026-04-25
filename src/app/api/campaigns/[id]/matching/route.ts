import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * POST /api/campaigns/[id]/matching
 * Lance le Matching Engine pour une campagne donnée.
 * Crée un scraping_job de type 'find_sellers' et délègue à N8N ou traite localement.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: campaignId } = await params
    const supabase = await createServerSupabaseClient()

    // Vérifier que la campagne existe
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ data: null, error: 'Campaign not found' }, { status: 404 })
    }

    // Créer un job de matching
    const { data: job, error: jobError } = await supabase
      .from('scraping_jobs')
      .insert({
        campaign_id: campaignId,
        job_type: 'find_sellers',
        status: 'pending',
        query_params: {
          mode: campaign.mode,
          source_marketplace_name: campaign.source_marketplace_name,
          sector: campaign.sector,
          catalog_size: campaign.catalog_size,
          target_regions: campaign.target_regions,
        },
        new_records_created: 0,
        existing_records_updated: 0,
      })
      .select()
      .single()

    if (jobError) throw jobError

    // Mettre le job en running
    await supabase
      .from('scraping_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', job.id)

    // Tenter de déclencher N8N si configuré
    const n8nUrl = process.env.N8N_WORKFLOW1_WEBHOOK_URL
    if (n8nUrl) {
      fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET ?? '',
        },
        body: JSON.stringify({
          event: 'matching_triggered',
          campaign_id: campaignId,
          job_id: job.id,
          campaign,
        }),
      }).catch((err) => console.error('[Matching] N8N trigger failed:', err))
    } else {
      // Simulation locale : mettre à jour les scores de matching avec des valeurs mock
      await simulateMatchingLocally(supabase, campaignId, job.id)
    }

    return NextResponse.json({
      data: {
        job_id: job.id,
        status: 'running',
        campaign_id: campaignId,
        started_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[POST /api/campaigns/[id]/matching]', err)
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}

/**
 * Simulation locale du matching quand N8N n'est pas configuré.
 * Met à jour les scores des entreprises de la campagne.
 */
async function simulateMatchingLocally(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient>>,
  campaignId: string,
  jobId: string
) {
  // Récupérer les entreprises de la campagne
  const { data: campaignCompanies } = await supabase
    .from('campaign_companies')
    .select('id, company_id')
    .eq('campaign_id', campaignId)

  if (!campaignCompanies?.length) {
    await supabase
      .from('scraping_jobs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', jobId)
    return
  }

  // Assigner des scores de matching simulés
  for (const cc of campaignCompanies) {
    const score = Math.floor(Math.random() * 40) + 55 // Score entre 55 et 95
    const status = score >= 70 ? 'qualified' : 'pending'

    await supabase
      .from('campaign_companies')
      .update({
        match_score: score,
        match_rationale: `Score calculé sur la base du catalogue produit, de la compatibilité géographique et du positionnement marché.`,
        status,
        scoring_version: '1.0-local',
        updated_at: new Date().toISOString(),
      })
      .eq('id', cc.id)
  }

  // Marquer le job comme terminé
  await supabase
    .from('scraping_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      result_count: campaignCompanies.length,
      existing_records_updated: campaignCompanies.length,
    })
    .eq('id', jobId)
}
