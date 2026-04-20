'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockCampaigns } from '@/lib/mock/campaigns'
import type { CampaignWithStats, CreateCampaignInput } from '@/types'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

async function fetchCampaigns(): Promise<CampaignWithStats[]> {
  if (USE_MOCK) return mockCampaigns

  const res = await fetch('/api/campaigns')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch campaigns')
  return json.data
}

async function createCampaign(input: CreateCampaignInput): Promise<CampaignWithStats> {
  if (USE_MOCK) {
    // Simulate creating a campaign in mock mode
    const newCampaign: CampaignWithStats = {
      id: `camp-${Date.now()}`,
      ...input,
      status: 'generating',
      created_at: new Date().toISOString(),
      company_count: 0,
      contact_count: 0,
      qualified_count: 0,
    }
    mockCampaigns.unshift(newCampaign)
    return newCampaign
  }

  const res = await fetch('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to create campaign')
  return json.data
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}
