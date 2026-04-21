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
          flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all
          ${
            isDisabled
              ? 'bg-[#F2F8FF] text-[#30373E]/40 cursor-not-allowed border border-[#03182F]/10'
              : 'bg-[#2764FF] hover:bg-[#1a4fd8] text-white shadow-[0_2px_8px_rgba(39,100,255,0.25)]'
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
            className="absolute inset-0 bg-[#03182F]/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white border border-[#03182F]/10 rounded-lg p-6 w-full max-w-md shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[rgba(39,100,255,0.08)] border border-[rgba(39,100,255,0.2)] mx-auto mb-4">
              <Rocket className="w-6 h-6 text-[#2764FF]" />
            </div>

            <h2 className="text-[#03182F] font-bold text-lg text-center mb-2">
              Lancer la campagne
            </h2>
            <p className="text-[#30373E]/70 text-sm text-center mb-5">
              Vous êtes sur le point d'envoyer des emails à{' '}
              <span className="text-[#03182F] font-semibold">{campaign.contact_count} contacts</span>{' '}
              qualifiés pour la campagne{' '}
              <span className="text-[#2764FF] font-semibold">"{campaign.name}"</span>.
            </p>

            {/* Warning */}
            <div className="flex items-start gap-2.5 p-3 bg-[#FFE7EC] border border-[#F22E75]/30 rounded-lg mb-5">
              <AlertTriangle className="w-4 h-4 text-[#F22E75] shrink-0 mt-0.5" />
              <p className="text-[#770031] text-xs">
                Cette action est irréversible. Les mails personnalisés seront générés par Dust AI
                et envoyés immédiatement.
              </p>
            </div>

            {error && (
              <p className="text-[#770031] text-xs mb-4 bg-[#FFE7EC] border border-[#F22E75]/30 rounded-lg px-3 py-2">
                {error instanceof Error ? error.message : 'Erreur lors du lancement'}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm text-[#30373E]/70 border border-[#03182F]/15 rounded-lg hover:text-[#03182F] hover:border-[#03182F]/30 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleLaunch}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#2764FF] hover:bg-[#1a4fd8] disabled:opacity-50 rounded-lg transition-all"
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
