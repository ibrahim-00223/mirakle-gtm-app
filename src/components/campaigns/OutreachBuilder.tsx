'use client'

import { useState } from 'react'
import { Sparkles, Send, AlertTriangle, Settings2, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmailSequenceCard } from './EmailSequenceCard'
import type { OutreachAngle, SeasonalContext, EmailTone, NewMailStatus } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface EmailSequence {
  id: string
  step: number
  delayDays: number
  subject: string
  body: string
  status: NewMailStatus
}

interface OutreachConfig {
  angle: OutreachAngle
  tone: EmailTone
  seasonalContext: SeasonalContext
  customHook: string
  autoMode: boolean
}

interface OutreachBuilderProps {
  campaignId: string
  campaignName?: string
  marketplaceName?: string
  sellerSector?: string
}

// ── Config Options ─────────────────────────────────────────────────────────────

const ANGLE_OPTIONS: { value: OutreachAngle; label: string; desc: string }[] = [
  { value: 'roi', label: '💰 ROI', desc: 'Revenus additionnels et retour sur investissement' },
  { value: 'seasonality', label: '📅 Saisonnalité', desc: 'Opportunité liée à une saison commerciale' },
  { value: 'partnership', label: '🤝 Partenariat', desc: 'Accord stratégique à long terme' },
  { value: 'growth', label: '📈 Croissance', desc: 'Expansion sur de nouveaux marchés' },
  { value: 'competitive', label: '⚡ Compétitif', desc: 'Avantage face aux concurrents' },
]

const SEASONAL_OPTIONS: { value: SeasonalContext; label: string }[] = [
  { value: 'none', label: 'Aucun (standard)' },
  { value: 'black_friday', label: '🛍️ Black Friday' },
  { value: 'christmas', label: '🎄 Noël' },
  { value: 'chinese_ny', label: '🧧 Nouvel An Chinois' },
  { value: 'back_to_school', label: '📚 Rentrée' },
  { value: 'summer', label: '☀️ Soldes d\'été' },
]

const TONE_OPTIONS: { value: EmailTone; label: string }[] = [
  { value: 'consultative', label: 'Consultatif' },
  { value: 'direct', label: 'Direct' },
  { value: 'educational', label: 'Pédagogique' },
  { value: 'luxury', label: 'Premium' },
]

const DEFAULT_SEQUENCES: EmailSequence[] = [
  { id: 'seq-1', step: 1, delayDays: 0, subject: '', body: '', status: 'draft' },
  { id: 'seq-2', step: 2, delayDays: 3, subject: '', body: '', status: 'draft' },
  { id: 'seq-3', step: 3, delayDays: 5, subject: '', body: '', status: 'draft' },
]

// ── Component ──────────────────────────────────────────────────────────────────

export function OutreachBuilder({ campaignId, campaignName, marketplaceName, sellerSector }: OutreachBuilderProps) {
  const [config, setConfig] = useState<OutreachConfig>({
    angle: 'growth',
    tone: 'consultative',
    seasonalContext: 'none',
    customHook: '',
    autoMode: false,
  })
  const [sequences, setSequences] = useState<EmailSequence[]>(DEFAULT_SEQUENCES)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingStep, setGeneratingStep] = useState<number | null>(null)
  const [showSendConfirm, setShowSendConfirm] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const allApproved = sequences.every((s) => s.status === 'approved' || s.status === 'sent')
  const approvedCount = sequences.filter((s) => s.status === 'approved').length

  // ── Génération IA ────────────────────────────────────────────────────────────
  async function generateSequence(step: number) {
    setIsGenerating(true)
    setGeneratingStep(step)

    // Mettre la séquence en état "generating"
    updateSequence(step, { status: 'generating', subject: '', body: '' })

    try {
      const previousSubjects = sequences
        .filter((s) => s.step < step && s.subject)
        .map((s) => s.subject)

      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          sequence_step: step,
          angle: config.angle,
          tone: config.tone,
          status: 'generating',
        }),
      })

      // Générer via OpenAI (route dédiée ou appel direct)
      const genRes = await fetch('/api/emails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          sequence_step: step,
          total_steps: sequences.length,
          angle: config.angle,
          tone: config.tone,
          seasonal_context: config.seasonalContext,
          custom_hook: config.customHook,
          marketplace_name: marketplaceName,
          seller_sector: sellerSector,
          previous_subjects: previousSubjects,
        }),
      })

      if (genRes.ok) {
        const { data } = await genRes.json()
        updateSequence(step, {
          subject: data?.subject ?? '',
          body: data?.body ?? '',
          status: 'review',
        })
      } else {
        // Fallback : contenu placeholder
        updateSequence(step, {
          subject: `[Mail ${step}] Opportunité marketplace pour votre entreprise`,
          body: `Bonjour,\n\nJe me permets de vous contacter concernant une opportunité sur ${marketplaceName ?? 'notre plateforme'}.\n\nCordialement,\nÉquipe Mirakl`,
          status: 'review',
        })
      }
    } catch (err) {
      console.error('Generation error:', err)
      updateSequence(step, {
        subject: `[Mail ${step}] Opportunité marketplace`,
        body: 'Génération en cours — veuillez réessayer.',
        status: 'draft',
      })
    } finally {
      setIsGenerating(false)
      setGeneratingStep(null)
    }
  }

  async function generateAll() {
    for (let step = 1; step <= sequences.length; step++) {
      await generateSequence(step)
    }
  }

  // ── Update helpers ────────────────────────────────────────────────────────────
  function updateSequence(step: number, patch: Partial<EmailSequence>) {
    setSequences((prev) => prev.map((s) => (s.step === step ? { ...s, ...patch } : s)))
  }

  function approveSequence(step: number) {
    updateSequence(step, { status: 'approved' })
  }

  function approveAll() {
    setSequences((prev) =>
      prev.map((s) =>
        s.status === 'review' || s.status === 'draft' ? { ...s, status: 'approved' } : s
      )
    )
  }

  // ── Send ──────────────────────────────────────────────────────────────────────
  async function handleSend() {
    setIsSending(true)
    setSendError(null)
    try {
      // Créer les mails en DB et déclencher l'envoi
      for (const seq of sequences) {
        if (seq.status === 'approved') {
          await fetch(`/api/emails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaign_id: campaignId,
              sequence_step: seq.step,
              delay_days: seq.delayDays,
              angle: config.angle,
              tone: config.tone,
              subject_final: seq.subject,
              body_final: seq.body,
              status: 'scheduled',
            }),
          })
        }
      }
      setSequences((prev) =>
        prev.map((s) => (s.status === 'approved' ? { ...s, status: 'sent' } : s))
      )
      setShowSendConfirm(false)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
    } finally {
      setIsSending(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-6">
      {/* ── Left panel : configuration ──────────────────────────────────────── */}
      <div className="w-72 shrink-0 space-y-5">
        <div className="bg-white border border-[#03182F]/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-4 h-4 text-[#2764FF]" />
            <h3 className="text-sm font-bold text-[#03182F]">Configuration</h3>
          </div>

          {/* Mode automatique */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#03182F]/5">
            <div>
              <p className="text-xs font-semibold text-[#03182F]">Mode automatique</p>
              <p className="text-[10px] text-[#30373E]/50 mt-0.5">Pré-configurer pour le BDR</p>
            </div>
            <button onClick={() => setConfig((c) => ({ ...c, autoMode: !c.autoMode }))}>
              {config.autoMode ? (
                <ToggleRight className="w-8 h-8 text-[#2764FF]" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-[#30373E]/30" />
              )}
            </button>
          </div>

          {/* Angle */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold text-[#30373E]/50 uppercase tracking-wider block mb-2">
              Angle d&apos;attaque
            </label>
            <div className="space-y-1.5">
              {ANGLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setConfig((c) => ({ ...c, angle: opt.value }))}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg border text-xs transition-all',
                    config.angle === opt.value
                      ? 'bg-[rgba(39,100,255,0.08)] border-[rgba(39,100,255,0.3)] text-[#2764FF]'
                      : 'border-[#03182F]/8 text-[#30373E]/60 hover:bg-[#F2F8FF]'
                  )}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className={cn('block text-[10px] mt-0.5', config.angle === opt.value ? 'text-[#2764FF]/70' : 'text-[#30373E]/40')}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ton */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold text-[#30373E]/50 uppercase tracking-wider block mb-2">
              Ton
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TONE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setConfig((c) => ({ ...c, tone: opt.value }))}
                  className={cn(
                    'px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all',
                    config.tone === opt.value
                      ? 'bg-[rgba(39,100,255,0.08)] border-[rgba(39,100,255,0.3)] text-[#2764FF]'
                      : 'border-[#03182F]/8 text-[#30373E]/60 hover:bg-[#F2F8FF]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Saisonnalité */}
          <div className="mb-4">
            <label className="text-[10px] font-semibold text-[#30373E]/50 uppercase tracking-wider block mb-2">
              Contexte saisonnier
            </label>
            <select
              value={config.seasonalContext}
              onChange={(e) => setConfig((c) => ({ ...c, seasonalContext: e.target.value as SeasonalContext }))}
              className="w-full text-xs text-[#03182F] bg-[#F2F8FF] border border-[#03182F]/10 rounded-lg px-2 py-2 focus:outline-none focus:border-[#2764FF]"
            >
              {SEASONAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Accroche personnalisée */}
          <div>
            <label className="text-[10px] font-semibold text-[#30373E]/50 uppercase tracking-wider block mb-2">
              Accroche personnalisée
            </label>
            <textarea
              value={config.customHook}
              onChange={(e) => setConfig((c) => ({ ...c, customHook: e.target.value }))}
              placeholder="Ex : J'ai vu votre nouveau catalogue Printemps/Été…"
              rows={3}
              className="w-full text-xs text-[#03182F] bg-[#F2F8FF] border border-[#03182F]/10 rounded-lg px-2 py-2 focus:outline-none focus:border-[#2764FF] resize-none placeholder:text-[#30373E]/30"
            />
          </div>
        </div>
      </div>

      {/* ── Right : sequences + actions ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Action bar */}
        <div className="flex items-center gap-2 bg-white border border-[#03182F]/10 rounded-xl px-4 py-3">
          <button
            onClick={generateAll}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#2764FF] text-white rounded-lg hover:bg-[#1a4fd8] transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'Génération…' : 'Générer avec IA'}
          </button>

          {approvedCount > 0 && approvedCount < sequences.length && (
            <button
              onClick={approveAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[#03182F]/15 rounded-lg hover:bg-[#F2F8FF] transition-colors"
            >
              Valider tout
            </button>
          )}

          <div className="flex-1" />

          {allApproved && (
            <button
              onClick={() => setShowSendConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              Envoyer la campagne
            </button>
          )}

          {/* Progress */}
          <span className="text-xs text-[#30373E]/50">
            {approvedCount}/{sequences.length} validés
          </span>
        </div>

        {/* Sequences */}
        <div className="space-y-3">
          {sequences.map((seq) => (
            <EmailSequenceCard
              key={seq.id}
              step={seq.step}
              totalSteps={sequences.length}
              delayDays={seq.delayDays}
              subject={seq.subject}
              body={seq.body}
              status={seq.status}
              isGenerating={isGenerating && generatingStep === seq.step}
              angle={config.angle}
              tone={config.tone}
              seasonalContext={config.seasonalContext}
              onDelayChange={(days) => updateSequence(seq.step, { delayDays: days })}
              onSubjectChange={(val) => updateSequence(seq.step, { subject: val })}
              onBodyChange={(val) => updateSequence(seq.step, { body: val })}
              onRegenerate={() => generateSequence(seq.step)}
              onApprove={() => approveSequence(seq.step)}
            />
          ))}
        </div>
      </div>

      {/* ── Modal de confirmation d'envoi ─────────────────────────────────── */}
      {showSendConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <button onClick={() => setShowSendConfirm(false)} className="text-[#30373E]/40 hover:text-[#30373E]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-base font-bold text-[#03182F] mb-2">
              Confirmer l&apos;envoi
            </h3>
            <p className="text-sm text-[#30373E]/60 mb-4">
              Vous êtes sur le point d&apos;envoyer{' '}
              <strong>{approvedCount} séquence{approvedCount > 1 ? 's' : ''} email</strong> dans le cadre de la campagne{' '}
              <strong>{campaignName}</strong>.
            </p>
            <p className="text-xs text-[#30373E]/40 mb-5 bg-[#F2F8FF] rounded-lg p-3">
              ⚠️ Cette action va déclencher l&apos;envoi aux contacts qualifiés. Assurez-vous que tous les emails ont été relus et validés.
            </p>

            {sendError && (
              <p className="text-xs text-red-600 mb-3">{sendError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowSendConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-[#03182F]/15 rounded-xl hover:bg-[#F2F8FF] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Envoi…' : 'Confirmer l\'envoi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
