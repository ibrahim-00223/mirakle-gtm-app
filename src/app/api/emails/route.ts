import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaign_id')
    const contactId = searchParams.get('contact_id')
    const status = searchParams.get('status')

    const supabase = await createServerSupabaseClient()
    let query = supabase.from('mails').select('*').order('sequence_step', { ascending: true })

    if (campaignId) query = query.eq('campaign_id', campaignId)
    if (contactId) query = query.eq('contact_id', contactId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/emails]', err)
    return NextResponse.json({ data: null, error: 'Failed to fetch emails' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.campaign_id) {
      return NextResponse.json(
        { data: null, error: 'campaign_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('mails')
      .insert({
        campaign_id: body.campaign_id,
        contact_id: body.contact_id ?? null,
        company_id: body.company_id ?? null,
        sequence_step: body.sequence_step ?? 1,
        delay_days: body.delay_days ?? 0,
        angle: body.angle ?? null,
        tone: body.tone ?? null,
        subject_draft: body.subject_draft ?? null,
        body_draft: body.body_draft ?? null,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/emails]', err)
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
