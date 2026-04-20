import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaign_id = searchParams.get('campaign_id')
    const company_id = searchParams.get('company_id')
    const mail_status = searchParams.get('mail_status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('contacts')
      .select('*')
      .order('last_name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (campaign_id) query = query.eq('campaign_id', campaign_id)
    if (company_id) query = query.eq('company_id', company_id)
    if (mail_status) query = query.eq('mail_status', mail_status)

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/contacts]', err)
    return NextResponse.json({ data: null, error: 'Failed to fetch contacts' }, { status: 500 })
  }
}
