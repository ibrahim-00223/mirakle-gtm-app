'use client'

import { ExternalLink, Mail, Phone, CheckCircle2, Loader2, AlertCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTriggerEnrichment } from '@/hooks/useEnrichment'
import type { ContactWithOutreachContext } from '@/types'

interface EnrichmentTableProps {
  contacts: ContactWithOutreachContext[]
  isLoading?: boolean
  onBulkEnrich?: () => void
}

type EnrichStep = 'completed' | 'partial' | 'pending'

function getEnrichStatus(contact: ContactWithOutreachContext): EnrichStep {
  if (contact.email && contact.linkedin_url) return 'completed'
  if (contact.email || contact.linkedin_url) return 'partial'
  return 'pending'
}

function EnrichStepIndicator({ step }: { step: EnrichStep }) {
  const steps = [
    { label: 'LinkedIn URL', key: 'linkedin' },
    { label: 'Contacts', key: 'contacts' },
    { label: 'Email/Tél.', key: 'email' },
  ]

  const completedCount =
    step === 'completed' ? 3 : step === 'partial' ? 2 : 0

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              i < completedCount
                ? 'bg-emerald-500'
                : step === 'partial' && i === completedCount
                ? 'bg-amber-400'
                : 'bg-[#03182F]/15'
            )}
            title={s.label}
          />
          {i < steps.length - 1 && (
            <div
              className={cn(
                'w-4 h-px',
                i < completedCount - 1 ? 'bg-emerald-500' : 'bg-[#03182F]/10'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function EnrichmentTable({ contacts, isLoading, onBulkEnrich }: EnrichmentTableProps) {
  const trigger = useTriggerEnrichment()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-[#03182F]/5 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!contacts?.length) {
    return (
      <div className="text-center py-16 text-[#30373E]/60">
        <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Aucun prospect identifié.</p>
        <p className="text-xs mt-1">Lancez d&apos;abord le matching pour identifier des sellers.</p>
      </div>
    )
  }

  const pendingCount = contacts.filter((c) => getEnrichStatus(c) === 'pending').length

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#30373E]/60">
            {contacts.length} prospects —{' '}
            <span className="text-emerald-600 font-medium">
              {contacts.filter((c) => c.email).length} emails trouvés
            </span>
          </span>
        </div>
        {pendingCount > 0 && (
          <button
            onClick={onBulkEnrich}
            disabled={trigger.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#2764FF] text-white rounded-lg hover:bg-[#1a4fd8] transition-colors disabled:opacity-50"
          >
            {trigger.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            Tout enrichir ({pendingCount})
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#03182F]/8">
              {['Prospect', 'Titre', 'Email', 'LinkedIn', 'Téléphone', 'Enrichissement', ''].map((h) => (
                <th
                  key={h}
                  className="text-left text-[10px] font-semibold text-[#30373E]/50 uppercase tracking-wider px-3 py-3 first:pl-0 last:pr-0"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#03182F]/5">
            {contacts.map((contact) => {
              const step = getEnrichStatus(contact)
              return (
                <tr key={contact.id} className="hover:bg-[#F2F8FF] transition-colors group">
                  <td className="px-3 py-3 first:pl-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#2764FF]/10 flex items-center justify-center shrink-0">
                        <span className="text-[#2764FF] text-[10px] font-bold">
                          {contact.first_name?.[0]}{contact.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-[#03182F] font-medium text-xs">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {contact.is_decision_maker && (
                          <span className="text-[9px] text-[#2764FF] font-medium">Décideur</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[#30373E]/60 text-xs">{contact.title ?? '—'}</span>
                  </td>
                  <td className="px-3 py-3">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1 text-xs text-[#2764FF] hover:underline"
                      >
                        <Mail className="w-3 h-3" />
                        {contact.email}
                        {contact.email_verified && (
                          <span title="Email vérifié">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          </span>
                        )}
                      </a>
                    ) : (
                      <span className="text-[#30373E]/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {contact.linkedin_url ? (
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#30373E]/60 hover:text-[#03182F] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Profil
                      </a>
                    ) : (
                      <span className="text-[#30373E]/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1 text-xs text-[#30373E]/70 hover:text-[#03182F] transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </a>
                    ) : (
                      <span className="text-[#30373E]/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <EnrichStepIndicator step={step} />
                      <span className="text-[9px] text-[#30373E]/50">
                        {step === 'completed' ? 'Complet' : step === 'partial' ? 'Partiel' : 'À enrichir'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 last:pr-0">
                    {step !== 'completed' && (
                      <button
                        onClick={() =>
                          trigger.mutate({
                            company_id: contact.company_id,
                            contact_ids: [contact.id],
                          })
                        }
                        disabled={trigger.isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-[10px] font-medium text-[#2764FF] border border-[rgba(39,100,255,0.3)] rounded hover:bg-[rgba(39,100,255,0.08)] transition-colors disabled:opacity-30"
                      >
                        {trigger.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Enrichir'
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
