import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('mails')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/emails/[id]]', err)
    return NextResponse.json({ data: null, error: 'Email not found' }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const supabase = await createServerSupabaseClient()

    const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }

    const allowedFields = [
      'subject_draft', 'body_draft', 'subject_final', 'body_final',
      'status', 'angle', 'tone', 'delay_days', 'sequence_step',
      'generated_at', 'approved_at', 'approved_by', 'scheduled_at',
      'sent_at', 'provider_message_id', 'ai_model', 'ai_prompt_context',
    ]

    for (const field of allowedFields) {
      if (field in body) updatePayload[field] = body[field]
    }

    const { data, error } = await supabase
      .from('mails')
      .update(updatePayload)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[PATCH /api/emails/[id]]', err)
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
