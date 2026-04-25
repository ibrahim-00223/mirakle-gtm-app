'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Mail, NewMailStatus } from '@/types'

interface UseEmailsOptions {
  campaignId?: string
  contactId?: string
  status?: NewMailStatus
}

async function fetchEmails(opts: UseEmailsOptions): Promise<Mail[]> {
  const params = new URLSearchParams()
  if (opts.campaignId) params.set('campaign_id', opts.campaignId)
  if (opts.contactId) params.set('contact_id', opts.contactId)
  if (opts.status) params.set('status', opts.status)

  const res = await fetch(`/api/emails?${params}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch emails')
  return json.data ?? []
}

async function createEmail(payload: Partial<Mail>): Promise<Mail> {
  const res = await fetch('/api/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to create email')
  return json.data
}

async function updateEmail(id: string, payload: Partial<Mail>): Promise<Mail> {
  const res = await fetch(`/api/emails/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to update email')
  return json.data
}

async function approveEmail(id: string): Promise<Mail> {
  return updateEmail(id, { status: 'approved', approved_at: new Date().toISOString() })
}

export function useEmails(opts: UseEmailsOptions = {}) {
  return useQuery({
    queryKey: ['emails', opts],
    queryFn: () => fetchEmails(opts),
    enabled: !!(opts.campaignId || opts.contactId),
  })
}

export function useCreateEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })
}

export function useUpdateEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<Mail> & { id: string }) => updateEmail(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })
}

export function useApproveEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })
}
