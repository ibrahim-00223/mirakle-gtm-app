'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Campaign, CreateCampaignInput } from '@/types'

async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await fetch('/api/campaigns')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch campaigns')
  return json.data ?? []
}

async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
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
