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

    if (!body.name || !body.sector || !body.source_marketplace) {
      return NextResponse.json(
        { data: null, error: 'name, sector and source_marketplace are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Insert campaign as draft
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        name: body.name,
        sector: body.sector,
        source_marketplace: body.source_marketplace,
        catalog_size: body.catalog_size,
        tone: body.tone,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    // Update status to generating
    await supabase
      .from('campaigns')
      .update({ status: 'generating' })
      .eq('id', campaign.id)

    // Trigger n8n Workflow 1 (fire and forget)
    triggerWorkflow1(campaign.id, body).catch((err) =>
      console.error('[Workflow1 trigger failed]', err)
    )

    return NextResponse.json({ data: { ...campaign, status: 'generating' } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/campaigns]', err)
    return NextResponse.json({ data: null, error: 'Failed to create campaign' }, { status: 500 })
  }
}
