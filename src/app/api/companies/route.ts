import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaign_id = searchParams.get('campaign_id')
    const status = searchParams.get('status')
    const sector = searchParams.get('sector')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('companies')
      .select('*')
      .order('match_score', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (campaign_id) query = query.eq('campaign_id', campaign_id)
    if (status) query = query.eq('status', status)
    if (sector) query = query.eq('sector', sector)

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/companies]', err)
    return NextResponse.json({ data: null, error: 'Failed to fetch companies' }, { status: 500 })
  }
}
