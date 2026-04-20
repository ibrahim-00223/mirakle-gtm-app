'use client'

import { useQuery } from '@tanstack/react-query'
import { mockContacts } from '@/lib/mock/contacts'
import type { Contact, MailStatus } from '@/types'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

interface UseContactsOptions {
  campaignId?: string
  companyId?: string
  mailStatus?: MailStatus
}

async function fetchContacts(opts: UseContactsOptions): Promise<Contact[]> {
  if (USE_MOCK) {
    let result = mockContacts
    if (opts.campaignId) result = result.filter((c) => c.campaign_id === opts.campaignId)
    if (opts.companyId) result = result.filter((c) => c.company_id === opts.companyId)
    if (opts.mailStatus) result = result.filter((c) => c.mail_status === opts.mailStatus)
    return result
  }

  const params = new URLSearchParams()
  if (opts.campaignId) params.set('campaign_id', opts.campaignId)
  if (opts.companyId) params.set('company_id', opts.companyId)
  if (opts.mailStatus) params.set('mail_status', opts.mailStatus)

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
