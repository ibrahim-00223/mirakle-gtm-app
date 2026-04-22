'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockCampaigns } from '@/lib/mock/campaigns'
import type { Campaign, CreateCampaignInput } from '@/types'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

async function fetchCampaigns(): Promise<Campaign[]> {
  if (USE_MOCK) return mockCampaigns

  const res = await fetch('/api/campaigns')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch campaigns')
  return json.data
}

async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  if (USE_MOCK) {
    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      name: input.name,
      mode: input.mode ?? 'marketplace',
      sector: input.sector,
      source_marketplace_id: input.source_marketplace_id ?? null,
      source_marketplace_name: input.source_marketplace_name ?? null,
      catalog_size: input.catalog_size,
      tone: input.tone,
      target_regions: input.target_regions ?? [],
      status: 'generating',
      sdr_user_id: null,
      company_count: 0,
      contact_count: 0,
      qualified_count: 0,
      avg_match_score: null,
      launched_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
