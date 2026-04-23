import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaign_id = searchParams.get('campaign_id')

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('scraping_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/scraping-jobs]', err)
    return NextResponse.json({ data: null, error: 'Failed to fetch scraping jobs' }, { status: 500 })
  }
}
