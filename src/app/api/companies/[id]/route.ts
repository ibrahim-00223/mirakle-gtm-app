import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = await createServerSupabaseClient()

    // id here is a campaign_companies.id (junction row), not a global company id
    const updatePayload: Record<string, unknown> = { status: body.status }
    if (body.disqualification_reason) updatePayload.disqualification_reason = body.disqualification_reason
    if (body.status === 'qualified') updatePayload.qualified_at = new Date().toISOString()
    if (body.status === 'disqualified') updatePayload.disqualified_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('campaign_companies')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        id,
        campaign_id,
        match_score,
        match_rationale,
        top_match_marketplace_name,
        status,
        qualified_at,
        disqualified_at,
        companies (*)
      `)
      .single()

    if (error) throw error

    const company = {
      ...(data.companies as unknown as Record<string, unknown>),
      campaign_company_id: data.id,
      campaign_id: data.campaign_id,
      match_score: data.match_score,
      match_rationale: data.match_rationale,
      top_match_marketplace_name: data.top_match_marketplace_name,
      status: data.status,
    }

    return NextResponse.json({ data: company })
  } catch (err) {
    console.error('[PATCH /api/companies/[id]]', err)
    return NextResponse.json({ data: null, error: 'Failed to update company' }, { status: 500 })
  }
}
