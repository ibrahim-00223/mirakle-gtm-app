import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateEmailWithOpenAI } from '@/lib/ai/email-generator'
import type { OutreachAngle, EmailTone, SeasonalContext } from '@/types'

/**
 * POST /api/emails/generate
 * Génère un email avec OpenAI GPT-4o en fonction du contexte de la campagne
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      campaign_id,
      sequence_step,
      total_steps,
      angle,
      tone,
      seasonal_context,
      custom_hook,
      marketplace_name,
      seller_sector,
      previous_subjects,
    } = body

    if (!campaign_id || !sequence_step) {
      return NextResponse.json(
        { data: null, error: 'campaign_id and sequence_step are required' },
        { status: 400 }
      )
    }

    // Récupérer les infos de la campagne pour enrichir la génération
    const supabase = await createServerSupabaseClient()
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name, sector, source_marketplace_name, tone')
      .eq('id', campaign_id)
      .single()

    const draft = await generateEmailWithOpenAI({
      sequenceStep: sequence_step,
      totalSteps: total_steps ?? 3,
      angle: (angle as OutreachAngle) ?? 'growth',
      tone: (tone as EmailTone) ?? campaign?.tone ?? 'consultative',
      seasonalContext: (seasonal_context as SeasonalContext) ?? 'none',
      customHook: custom_hook,
      sellerName: 'votre entreprise',
      sellerSector: seller_sector ?? campaign?.sector,
      marketplaceName: marketplace_name ?? campaign?.source_marketplace_name,
      previousSubjects: previous_subjects ?? [],
    })

    return NextResponse.json({ data: draft })
  } catch (err) {
    console.error('[POST /api/emails/generate]', err)
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return NextResponse.json({ data: null, error: message }, { status: 500 })
  }
}
