'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CompanyWithCampaignContext } from '@/types'

interface MatchingJob {
  job_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  campaign_id: string
  started_at: string
}

interface ScrapingJob {
  job_id: string | null
  status: string
  campaign_id: string
  message: string
}

async function launchScraping(campaignId: string): Promise<ScrapingJob> {
  const res = await fetch(`/api/campaigns/${campaignId}/scraping`, {
    method: 'POST',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to launch scraping')
  return json.data
}

async function launchMatching(campaignId: string): Promise<MatchingJob> {
  const res = await fetch(`/api/campaigns/${campaignId}/matching`, {
    method: 'POST',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to launch matching')
  return json.data
}

async function fetchMatchResults(campaignId: string): Promise<CompanyWithCampaignContext[]> {
  const res = await fetch(`/api/companies?campaign_id=${campaignId}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch match results')

  const companies: CompanyWithCampaignContext[] = json.data ?? []
  // Trier : qualified en premier, puis par score décroissant
  return companies.sort((a, b) => {
    if (a.status === 'qualified' && b.status !== 'qualified') return -1
    if (b.status === 'qualified' && a.status !== 'qualified') return 1
    return (b.match_score ?? 0) - (a.match_score ?? 0)
  })
}

export function useLaunchScraping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: launchScraping,
    onSuccess: (_, campaignId) => {
      // Repolling des entreprises après le scraping
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['companies'] })
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      }, 3000)
    },
  })
}

export function useLaunchContacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch(`/api/campaigns/${campaignId}/contacts`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to launch contact search')
      return json.data
    },
    onSuccess: (_, campaignId) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      }, 5000)
    },
  })
}

export function useLaunchMatching() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: launchMatching,
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['companies', { campaignId }] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useMatchResults(campaignId?: string) {
  return useQuery({
    queryKey: ['match-results', campaignId],
    queryFn: () => fetchMatchResults(campaignId!),
    enabled: !!campaignId,
  })
}
