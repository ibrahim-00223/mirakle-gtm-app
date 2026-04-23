'use client'

import { useQuery } from '@tanstack/react-query'
import type { ContactWithOutreachContext, OutreachStatus } from '@/types'

interface UseContactsOptions {
  campaignId?: string
  companyId?: string
  outreachStatus?: OutreachStatus
}

async function fetchContacts(opts: UseContactsOptions): Promise<ContactWithOutreachContext[]> {
  const params = new URLSearchParams()
  if (opts.campaignId) params.set('campaign_id', opts.campaignId)
  if (opts.companyId) params.set('company_id', opts.companyId)
  if (opts.outreachStatus) params.set('outreach_status', opts.outreachStatus)

  const res = await fetch(`/api/contacts?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch contacts')
  return json.data ?? []
}

export function useContacts(opts: UseContactsOptions = {}) {
  return useQuery({
    queryKey: ['contacts', opts],
    queryFn: () => fetchContacts(opts),
  })
}
