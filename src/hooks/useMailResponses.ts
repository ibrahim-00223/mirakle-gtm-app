'use client'

import { useQuery } from '@tanstack/react-query'
import type { MailResponse } from '@/types'

interface UseMailResponsesOptions {
  mailId?: string
  campaignId?: string
  contactId?: string
}

async function fetchMailResponses(opts: UseMailResponsesOptions): Promise<MailResponse[]> {
  const params = new URLSearchParams()
  if (opts.mailId) params.set('mail_id', opts.mailId)
  if (opts.campaignId) params.set('campaign_id', opts.campaignId)
  if (opts.contactId) params.set('contact_id', opts.contactId)

  const res = await fetch(`/api/mail-responses?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch mail responses')
  return json.data ?? []
}

export function useMailResponses(opts: UseMailResponsesOptions = {}) {
  return useQuery({
    queryKey: ['mail-responses', opts],
    queryFn: () => fetchMailResponses(opts),
    enabled: !!(opts.mailId || opts.campaignId || opts.contactId),
  })
}
