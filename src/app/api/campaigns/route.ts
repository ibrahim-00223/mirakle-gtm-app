import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { triggerWorkflow1 } from '@/lib/n8n/webhooks'
import type { CreateCampaignInput } from '@/types'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/campaigns]', err)
    return NextResponse.json({ data: null, error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateCampaignInput = await req.json()

    if (!body.name || !body.sector) {
      return NextResponse.json(
        { data: null, error: 'name and sector are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        name: body.name,
        sector: body.sector,
        mode: body.mode ?? 'marketplace',
        source_marketplace_id: body.source_marketplace_id ?? null,
        source_marketplace_name: body.source_marketplace_name ?? null,
        catalog_size: body.catalog_size,
        tone: body.tone,
        target_regions: body.target_regions ?? [],
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    // If ICP mode, insert ICP parameters
    if (body.mode === 'icp' && body.icp) {
      await supabase.from('campaign_icp').insert({ campaign_id: campaign.id, ...body.icp })
    }

    // Move to generating and fire n8n
    await supabase.from('campaigns').update({ status: 'generating' }).eq('id', campaign.id)

    triggerWorkflow1(campaign.id, body).catch((err) =>
      console.error('[Workflow1 trigger failed]', err)
    )

    return NextResponse.json({ data: { ...campaign, status: 'generating' } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/campaigns]', err)
    return NextResponse.json({ data: null, error: 'Failed to create campaign' }, { status: 500 })
  }
}
