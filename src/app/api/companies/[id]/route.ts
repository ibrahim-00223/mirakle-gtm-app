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

    const { data, error } = await supabase
      .from('companies')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[PATCH /api/companies/[id]]', err)
    return NextResponse.json({ data: null, error: 'Failed to update company' }, { status: 500 })
  }
}
