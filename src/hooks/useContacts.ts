'use client'

import { useQuery } from '@tanstack/react-query'
import { mockContacts } from '@/lib/mock/contacts'
import type { ContactWithOutreachContext, OutreachStatus } from '@/types'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

interface UseContactsOptions {
  campaignId?: string
  companyId?: string
  outreachStatus?: OutreachStatus
  /** @deprecated Use outreachStatus */
  mailStatus?: string
}

async function fetchContacts(opts: UseContactsOptions): Promise<ContactWithOutreachContext[]> {
  const status = opts.outreachStatus ?? opts.mailStatus

  if (USE_MOCK) {
    let result = mockContacts
    if (opts.campaignId) result = result.filter((c) => c.campaign_id === opts.campaignId)
    if (opts.companyId) result = result.filter((c) => c.company_id === opts.companyId)
    if (status) result = result.filter((c) => c.outreach_status === status)
    return result
  }

  const params = new URLSearchParams()
  if (opts.campaignId) params.set('campaign_id', opts.campaignId)
  if (opts.companyId) params.set('company_id', opts.companyId)
  if (status) params.set('outreach_status', status)

  const res = await fetch(`/api/contacts?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch contacts')
  return json.data
}

export function useContacts(opts: UseContactsOptions = {}) {
  return useQuery({
    queryKey: ['contacts', opts],
    queryFn: () => fetchContacts(opts),
  })
}
