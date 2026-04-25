'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle2, Clock, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NewMailStatus, OutreachAngle, EmailTone, SeasonalContext } from '@/types'

interface EmailSequenceCardProps {
  step: number
  totalSteps: number
  delayDays: number
  subject: string
  body: string
  status: NewMailStatus
  isGenerating?: boolean
  onDelayChange: (days: number) => void
  onSubjectChange: (value: string) => void
  onBodyChange: (value: string) => void
  onRegenerate: () => void
  onApprove: () => void
  angle: OutreachAngle
  tone: EmailTone
  seasonalContext: SeasonalContext
}

const STATUS_CONFIG: Record<NewMailStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Brouillon', color: 'text-[#30373E]/50 bg-[#F2F8FF] border-[#03182F]/10', icon: <Clock className="w-3 h-3" /> },
  generating: { label: 'Génération IA…', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  review: { label: 'À valider', color: 'text-[#2764FF] bg-[rgba(39,100,255,0.08)] border-[rgba(39,100,255,0.2)]', icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Validé', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  scheduled: { label: 'Planifié', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: <Clock className="w-3 h-3" /> },
  sent: { label: 'Envoyé', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <Send className="w-3 h-3" /> },
  failed: { label: 'Échec', color: 'text-red-700 bg-red-50 border-red-200', icon: <Clock className="w-3 h-3" /> },
}

export function EmailSequenceCard({
  step,
  totalSteps,
  delayDays,
  subject,
  body,
  status,
  isGenerating,
  onDelayChange,
  onSubjectChange,
  onBodyChange,
  onRegenerate,
  onApprove,
}: EmailSequenceCardProps) {
  const [expanded, setExpanded] = useState(true)
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  const isSent = status === 'sent' || status === 'scheduled'
  const isApproved = status === 'approved'
  const canApprove = (status === 'review' || status === 'draft') && subject && body

  return (
    <div className={cn(
      'border rounded-xl transition-all',
      isApproved ? 'border-emerald-200 bg-emerald-50/30' : 'border-[#03182F]/10 bg-white',
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Step number */}
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border',
          isApproved ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-[#2764FF] text-white border-[#2764FF]'
        )}>
          {step}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#03182F]">
              {step === 1 ? 'Premier contact' : `Relance #${step - 1}`}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                config.color
              )}
            >
              {config.icon}
              {config.label}
            </span>
          </div>
          {/* Delay selector */}
          {step > 1 && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-[#30373E]/50">Délai :</span>
              <select
                value={delayDays}
                onChange={(e) => onDelayChange(Number(e.target.value))}
                disabled={isSent}
                className="text-[10px] text-[#30373E] bg-transparent border border-[#03182F]/15 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#2764FF] disabled:opacity-50"
              >
                {[1, 2, 3, 4, 5, 7, 10, 14].map((d) => (
                  <option key={d} value={d}>{d} jour{d > 1 ? 's' : ''} après le mail précédent</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded text-[#30373E]/40 hover:text-[#30373E] transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#03182F]/5 pt-3">
          {/* Subject */}
          <div>
            <label className="text-[10px] font-semibold text-[#30373E]/50 uppercase tracking-wider block mb-1">
              Objet
            </label>
            <input
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              disabled={isSent || isGenerating}
              placeholder={isGenerating ? 'Génération en cours…' : 'Objet de l\'email'}
              className={cn(
                'w-full text-sm text-[#03182F] bg-[#F2F8FF] border border-[#03182F]/10 rounded-lg px-3 py-2',
                'focus:outline-none focus:border-[#2764FF] transition-colors',
                'placeholder:text-[#30373E]/30 disabled:opacity-50'
              )}
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-[10px] font-semibold text-[#30373E]/50 uppercase tracking-wider block mb-1">
              Corps de l&apos;email
            </label>
            <textarea
              value={body}
              onChange={(e) => onBodyChange(e.target.value)}
              disabled={isSent || isGenerating}
              placeholder={isGenerating ? 'Génération en cours…' : 'Corps de l\'email…'}
              rows={7}
              className={cn(
                'w-full text-sm text-[#03182F] bg-[#F2F8FF] border border-[#03182F]/10 rounded-lg px-3 py-2',
                'focus:outline-none focus:border-[#2764FF] transition-colors resize-y',
                'placeholder:text-[#30373E]/30 disabled:opacity-50 font-mono'
              )}
            />
          </div>

          {/* Word count */}
          {body && (
            <p className="text-[10px] text-[#30373E]/40 text-right">
              {body.split(/\s+/).filter(Boolean).length} mots
            </p>
          )}

          {/* Actions */}
          {!isSent && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onRegenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#30373E] border border-[#03182F]/15 rounded-lg hover:bg-[#F2F8FF] transition-colors disabled:opacity-40"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Régénérer
              </button>

              {canApprove && (
                <button
                  onClick={onApprove}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approuver
                </button>
              )}

              {isApproved && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Email validé
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
