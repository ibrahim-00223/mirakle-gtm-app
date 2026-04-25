import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mailId = searchParams.get('mail_id')
    const campaignId = searchParams.get('campaign_id')
    const contactId = searchParams.get('contact_id')
    const responseType = searchParams.get('response_type')

    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('mail_responses')
      .select('*')
      .order('received_at', { ascending: false })

    if (mailId) query = query.eq('mail_id', mailId)
    if (campaignId) query = query.eq('campaign_id', campaignId)
    if (contactId) query = query.eq('contact_id', contactId)
    if (responseType) query = query.eq('response_type', responseType)

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/mail-responses]', err)
    return NextResponse.json({ data: null, error: 'Failed to fetch mail responses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.mail_id || !body.response_type) {
      return NextResponse.json(
        { data: null, error: 'mail_id and response_type are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('mail_responses')
      .insert({
        mail_id: body.mail_id,
        campaign_id: body.campaign_id ?? null,
        contact_id: body.contact_id ?? null,
        response_type: body.response_type,
        raw_body: body.raw_body ?? null,
        provider_event_id: body.provider_event_id ?? null,
        metadata: body.metadata ?? null,
        received_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Mettre à jour le statut du mail en conséquence
    if (body.response_type === 'replied') {
      await supabase
        .from('mails')
        .update({ status: 'sent' })
        .eq('id', body.mail_id)
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/mail-responses]', err)
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
