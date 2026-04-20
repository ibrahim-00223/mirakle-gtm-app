import type { CreateCampaignInput } from '@/types'

interface WebhookResult {
  success: boolean
  jobId?: string
  error?: string
}

export async function triggerWorkflow1(
  campaignId: string,
  payload: CreateCampaignInput
): Promise<WebhookResult> {
  const webhookUrl = process.env.N8N_WORKFLOW1_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('[n8n] WORKFLOW1 webhook URL not configured — running in demo mode')
    return { success: true, jobId: `mock-job-${Date.now()}` }
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, ...payload }),
    })

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` }
    }

    const data = await res.json().catch(() => ({}))
    return { success: true, jobId: data.jobId }
  } catch (err) {
    console.error('[n8n] Workflow 1 trigger failed:', err)
    return { success: false, error: String(err) }
  }
}

export async function triggerWorkflow2(campaignId: string): Promise<WebhookResult> {
  const webhookUrl = process.env.N8N_WORKFLOW2_WEBHOOK_URL

  if (!webhookUrl) {
    console.warn('[n8n] WORKFLOW2 webhook URL not configured — running in demo mode')
    return { success: true }
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId }),
    })

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` }
    }

    return { success: true }
  } catch (err) {
    console.error('[n8n] Workflow 2 trigger failed:', err)
    return { success: false, error: String(err) }
  }
}
