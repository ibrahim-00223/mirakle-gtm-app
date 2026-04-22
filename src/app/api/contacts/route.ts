import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaign_id = searchParams.get('campaign_id')
    const company_id = searchParams.get('company_id')
    const outreach_status = searchParams.get('outreach_status') ?? searchParams.get('mail_status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = await createServerSupabaseClient()

    if (campaign_id || company_id) {
      let query = supabase
        .from('campaign_contacts')
        .select(`
          id,
          campaign_id,
          company_id,
          outreach_status,
          sequence_step,
          email_subject_draft,
          email_body_draft,
          email_subject_final,
          email_body_final,
          sent_at,
          opened_at,
          open_count,
          clicked_at,
          replied_at,
          bounced_at,
          contacts (*)
        `)
        .order('contacts(last_name)', { ascending: true })
        .range((page - 1) * limit, page * limit - 1)

      if (campaign_id) query = query.eq('campaign_id', campaign_id)
      if (company_id) query = query.eq('company_id', company_id)
      if (outreach_status) query = query.eq('outreach_status', outreach_status)

      const { data, error } = await query
      if (error) throw error

      // Flatten into ContactWithOutreachContext shape with legacy field aliases
      const contacts = (data ?? []).map((row) => ({
        ...(row.contacts as unknown as Record<string, unknown>),
        campaign_contact_id: row.id,
        campaign_id: row.campaign_id,
        company_id: row.company_id,
        outreach_status: row.outreach_status,
        sequence_step: row.sequence_step,
        email_subject_draft: row.email_subject_draft,
        email_body_draft: row.email_body_draft,
        email_subject_final: row.email_subject_final,
        email_body_final: row.email_body_final,
        sent_at: row.sent_at,
        opened_at: row.opened_at,
        clicked_at: row.clicked_at,
        replied_at: row.replied_at,
        // Legacy aliases
        mail_status: row.outreach_status,
        mail_sent_at: row.sent_at,
        mail_opened_at: row.opened_at,
        mail_replied_at: row.replied_at,
      }))

      return NextResponse.json({ data: contacts })
    }

    // Global contacts list (no campaign filter)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('last_name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/contacts]', err)
    return NextResponse.json({ data: null, error: 'Failed to fetch contacts' }, { status: 500 })
  }
}
