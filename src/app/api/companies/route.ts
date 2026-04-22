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

    if (campaign_id) {
      // Return companies with their campaign-specific context
      let query = supabase
        .from('campaign_companies')
        .select(`
          id,
          campaign_id,
          match_score,
          match_rationale,
          top_match_marketplace_name,
          status,
          qualified_at,
          disqualified_at,
          disqualification_reason,
          sdr_notes,
          added_at,
          companies (*)
        `)
        .eq('campaign_id', campaign_id)
        .order('match_score', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (status) query = query.eq('status', status)

      const { data, error } = await query
      if (error) throw error

      // Flatten into CompanyWithCampaignContext shape
      const companies = (data ?? []).map((row) => ({
        ...(row.companies as unknown as Record<string, unknown>),
        campaign_company_id: row.id,
        campaign_id: row.campaign_id,
        match_score: row.match_score,
        match_rationale: row.match_rationale,
        top_match_marketplace_name: row.top_match_marketplace_name,
        status: row.status,
        ...(sector ? {} : {}),
      })).filter((c) => !sector || (c as Record<string, unknown>).sector === sector)

      return NextResponse.json({ data: companies })
    }

    // Global companies list (no campaign filter)
    let query = supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (sector) query = query.eq('sector', sector)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/companies]', err)
    return NextResponse.json({ data: null, error: 'Failed to fetch companies' }, { status: 500 })
  }
}
