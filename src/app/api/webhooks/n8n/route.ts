import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Validate webhook secret
  const secret = req.headers.get('x-webhook-secret')
  if (process.env.N8N_WEBHOOK_SECRET && secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, id, status, data } = body

    const supabase = await createServerSupabaseClient()

    if (type === 'campaign_update') {
      await supabase.from('campaigns').update({ status }).eq('id', id)
    } else if (type === 'company_update') {
      await supabase.from('companies').update({ status, ...data }).eq('id', id)
    } else if (type === 'contact_update') {
      await supabase.from('contacts').update({ mail_status: status, ...data }).eq('id', id)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[POST /api/webhooks/n8n]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
