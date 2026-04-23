'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CompanyWithCampaignContext, CompanyStatus } from '@/types'

interface UseCompaniesOptions {
  campaignId?: string
  status?: CompanyStatus
}

async function fetchCompanies(opts: UseCompaniesOptions): Promise<CompanyWithCampaignContext[]> {
  const params = new URLSearchParams()
  if (opts.campaignId) params.set('campaign_id', opts.campaignId)
  if (opts.status) params.set('status', opts.status)

  const res = await fetch(`/api/companies?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch companies')
  return json.data ?? []
}

async function updateCompanyStatus(
  id: string,
  status: CompanyStatus
): Promise<CompanyWithCampaignContext> {
  const res = await fetch(`/api/companies/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to update company')
  return json.data
}

export function useCompanies(opts: UseCompaniesOptions = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['companies', opts],
    queryFn: () => fetchCompanies(opts),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CompanyStatus }) =>
      updateCompanyStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  return { ...query, updateStatus }
}
