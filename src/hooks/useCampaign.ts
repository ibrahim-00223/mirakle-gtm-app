'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mockCampaigns } from '@/lib/mock/campaigns'
import type { CampaignWithStats } from '@/types'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

async function fetchCampaign(id: string): Promise<CampaignWithStats> {
  if (USE_MOCK) {
    const campaign = mockCampaigns.find((c) => c.id === id)
    if (!campaign) throw new Error('Campaign not found')
    return campaign
  }

  const res = await fetch(`/api/campaigns/${id}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch campaign')
  return json.data
}

async function launchCampaign(id: string): Promise<void> {
  if (USE_MOCK) {
    const campaign = mockCampaigns.find((c) => c.id === id)
    if (campaign) campaign.status = 'active'
    return
  }

  const res = await fetch(`/api/campaigns/${id}/launch`, { method: 'POST' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to launch campaign')
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetchCampaign(id),
    enabled: !!id,
  })
}

export function useLaunchCampaign(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => launchCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}
