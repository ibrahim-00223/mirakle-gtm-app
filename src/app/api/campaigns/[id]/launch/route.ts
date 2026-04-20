import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { triggerWorkflow2 } from '@/lib/n8n/webhooks'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !campaign) {
      return NextResponse.json({ data: null, error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'ready') {
      return NextResponse.json(
        { data: null, error: 'Campaign must be in "ready" status to launch' },
        { status: 400 }
      )
    }

    // Update status to active
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ status: 'active' })
      .eq('id', id)

    if (updateError) throw updateError

    // Trigger n8n Workflow 2
    const result = await triggerWorkflow2(id)

    return NextResponse.json({ data: { success: true, workflow: result } })
  } catch (err) {
    console.error('[POST /api/campaigns/[id]/launch]', err)
    return NextResponse.json({ data: null, error: 'Failed to launch campaign' }, { status: 500 })
  }
}
