import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (process.env.N8N_WEBHOOK_SECRET && secret !== process.env.N8N_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, id, status, data } = body

    const supabase = await createServerSupabaseClient()

    switch (type) {
      case 'campaign_update':
        await supabase.from('campaigns').update({ status, ...data }).eq('id', id)
        break

      case 'company_upsert': {
        // Upsert into global companies table, then update campaign_companies if campaign context given
        const { campaign_id, campaign_company_id, match_score, match_rationale,
                top_match_marketplace_name, company_status, ...companyData } = data ?? {}

        const { data: company, error: companyErr } = await supabase
          .from('companies')
          .upsert({ id, ...companyData }, { onConflict: 'id' })
          .select()
          .single()

        if (companyErr) throw companyErr

        if (campaign_id) {
          await supabase
            .from('campaign_companies')
            .upsert({
              id: campaign_company_id,
              campaign_id,
              company_id: company.id,
              match_score,
              match_rationale,
              top_match_marketplace_name,
              status: company_status ?? 'pending',
            }, { onConflict: 'campaign_id,company_id' })
        }
        break
      }

      case 'contact_upsert': {
        const { campaign_id, campaign_contact_id, outreach_status, sequence_step,
                email_subject_draft, email_body_draft, ai_generation_context,
                ai_model_version, ...contactData } = data ?? {}

        const { data: contact, error: contactErr } = await supabase
          .from('contacts')
          .upsert({ id, ...contactData }, { onConflict: 'id' })
          .select()
          .single()

        if (contactErr) throw contactErr

        if (campaign_id) {
          await supabase
            .from('campaign_contacts')
            .upsert({
              id: campaign_contact_id,
              campaign_id,
              contact_id: contact.id,
              company_id: contactData.company_id,
              outreach_status: outreach_status ?? 'pending',
              sequence_step: sequence_step ?? 1,
              email_subject_draft,
              email_body_draft,
              ai_generation_context: ai_generation_context ?? {},
              ai_model_version,
              ...(email_body_draft ? { draft_generated_at: new Date().toISOString() } : {}),
            }, { onConflict: 'campaign_id,contact_id,sequence_step' })
        }
        break
      }

      case 'outreach_event': {
        // Tracking events: sent, opened, clicked, replied, bounced
        const timestamps: Record<string, string | number> = {}
        const now = new Date().toISOString()
        if (status === 'sent')    { timestamps.sent_at = now }
        if (status === 'opened')  { timestamps.opened_at = now; timestamps.open_count = data?.open_count ?? 1 }
        if (status === 'clicked') { timestamps.clicked_at = now; timestamps.click_count = data?.click_count ?? 1 }
        if (status === 'replied') { timestamps.replied_at = now }
        if (status === 'bounced') { timestamps.bounced_at = now; timestamps.bounce_type = data?.bounce_type ?? 'hard' }

        await supabase
          .from('campaign_contacts')
          .update({ outreach_status: status, ...timestamps })
          .eq('id', id)
        break
      }

      // Legacy support
      case 'company_update':
        await supabase.from('campaign_companies').update({ status, ...data }).eq('id', id)
        break
      case 'contact_update':
        await supabase.from('campaign_contacts').update({ outreach_status: status, ...data }).eq('id', id)
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[POST /api/webhooks/n8n]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
