import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'mirakl' | 'external'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('marketplaces')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (type) query = query.eq('marketplace_type', type)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/marketplaces]', err)
    return NextResponse.json({ data: null, error: 'Failed to fetch marketplaces' }, { status: 500 })
  }
}
