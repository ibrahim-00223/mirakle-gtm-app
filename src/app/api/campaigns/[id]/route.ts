import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!campaign) return NextResponse.json({ data: null, error: 'Not found' }, { status: 404 })

    // Get counts
    const [{ count: company_count }, { count: contact_count }, { count: qualified_count }] =
      await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('campaign_id', id),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('campaign_id', id),
        supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', id)
          .eq('status', 'qualified'),
      ])

    return NextResponse.json({
      data: { ...campaign, company_count, contact_count, qualified_count },
    })
  } catch (err) {
    console.error('[GET /api/campaigns/[id]]', err)
    return NextResponse.json({ data: null, error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('campaigns')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[PATCH /api/campaigns/[id]]', err)
    return NextResponse.json({ data: null, error: 'Failed to update campaign' }, { status: 500 })
  }
}
