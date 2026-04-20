'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockCompanies } from '@/lib/mock/companies'
import type { Company, CompanyStatus } from '@/types'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

interface UseCompaniesOptions {
  campaignId?: string
  status?: CompanyStatus
}

async function fetchCompanies(opts: UseCompaniesOptions): Promise<Company[]> {
  if (USE_MOCK) {
    let result = mockCompanies
    if (opts.campaignId) result = result.filter((c) => c.campaign_id === opts.campaignId)
    if (opts.status) result = result.filter((c) => c.status === opts.status)
    return result
  }

  const params = new URLSearchParams()
  if (opts.campaignId) params.set('campaign_id', opts.campaignId)
  if (opts.status) params.set('status', opts.status)

  const res = await fetch(`/api/companies?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch companies')
  return json.data
}

async function updateCompanyStatus(id: string, status: CompanyStatus): Promise<Company> {
  if (USE_MOCK) {
    const company = mockCompanies.find((c) => c.id === id)
    if (company) company.status = status
    return company!
  }

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
