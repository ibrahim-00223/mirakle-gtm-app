'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Contact } from '@/types'

interface EnrichmentTriggerPayload {
  company_id: string
  contact_ids?: string[]
  domain?: string
}

interface EnrichmentJob {
  job_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  company_id: string
  steps_completed: string[]
  contacts_found: number
  contacts_enriched: number
}

async function triggerEnrichment(payload: EnrichmentTriggerPayload): Promise<EnrichmentJob> {
  const res = await fetch('/api/enrichment/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to trigger enrichment')
  return json.data
}

async function fetchEnrichmentStatus(jobId: string): Promise<EnrichmentJob> {
  const res = await fetch(`/api/enrichment/trigger?job_id=${jobId}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch enrichment status')
  return json.data
}

async function fetchEnrichedContacts(campaignId?: string, companyId?: string): Promise<Contact[]> {
  const params = new URLSearchParams()
  if (campaignId) params.set('campaign_id', campaignId)
  if (companyId) params.set('company_id', companyId)

  const res = await fetch(`/api/contacts?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch contacts')
  return json.data ?? []
}

export function useTriggerEnrichment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: triggerEnrichment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export function useEnrichmentStatus(jobId?: string) {
  return useQuery({
    queryKey: ['enrichment-status', jobId],
    queryFn: () => fetchEnrichmentStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      // Repolling tant que le job n'est pas terminé
      return status === 'pending' || status === 'running' ? 3000 : false
    },
  })
}

export function useEnrichedContacts(opts: { campaignId?: string; companyId?: string } = {}) {
  return useQuery({
    queryKey: ['enriched-contacts', opts],
    queryFn: () => fetchEnrichedContacts(opts.campaignId, opts.companyId),
    enabled: !!(opts.campaignId || opts.companyId),
  })
}
