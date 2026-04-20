'use client'

import { useState } from 'react'
import { Rocket, AlertTriangle } from 'lucide-react'
import { useLaunchCampaign } from '@/hooks/useCampaign'
import type { CampaignWithStats } from '@/types'

interface LaunchCampaignModalProps {
  campaign: CampaignWithStats
  onSuccess?: () => void
}

export function LaunchCampaignModal({ campaign, onSuccess }: LaunchCampaignModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [launched, setLaunched] = useState(false)
  const { mutateAsync, isPending, error } = useLaunchCampaign(campaign.id)

  const isDisabled = campaign.status !== 'ready' || campaign.status === ('generating' as string)

  const handleLaunch = async () => {
    try {
      await mutateAsync()
      setLaunched(true)
      setIsOpen(false)
      onSuccess?.()
    } catch {
      // error displayed below
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all
          ${
            isDisabled
              ? 'bg-white/[0.05] text-slate-600 cursor-not-allowed border border-white/[0.06]'
              : 'bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-lg shadow-[#0066FF]/20'
          }
        `}
      >
        <Rocket className="w-4 h-4" />
        {launched ? 'Campagne active !' : 'Lancer la campagne'}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog */}
          <div className="relative bg-[#162035] border border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/20 mx-auto mb-4">
              <Rocket className="w-6 h-6 text-[#0066FF]" />
            </div>

            <h2 className="text-white font-bold text-lg font-heading text-center mb-2">
              Lancer la campagne
            </h2>
            <p className="text-slate-400 text-sm text-center mb-5">
              Vous êtes sur le point d'envoyer des emails à{' '}
              <span className="text-white font-semibold">{campaign.contact_count} contacts</span>{' '}
              qualifiés pour la campagne{' '}
              <span className="text-[#0066FF] font-semibold">"{campaign.name}"</span>.
            </p>

            {/* Warning */}
            <div className="flex items-start gap-2.5 p-3 bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-lg mb-5">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <p className="text-[#F59E0B] text-xs">
                Cette action est irréversible. Les mails personnalisés seront générés par Dust AI
                et envoyés immédiatement.
              </p>
            </div>

            {error && (
              <p className="text-[#EF4444] text-xs mb-4 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg px-3 py-2">
                {error instanceof Error ? error.message : 'Erreur lors du lancement'}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm text-slate-400 border border-white/[0.08] rounded-xl hover:text-white hover:border-white/20 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleLaunch}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-50 rounded-xl transition-all"
              >
                {isPending ? 'Lancement...' : 'Confirmer le lancement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
