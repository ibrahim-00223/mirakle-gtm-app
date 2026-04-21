'use client'

import Link from 'next/link'
import { Plus, Target } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { CampaignCard } from '@/components/campaigns/CampaignCard'

export default function CampagnesPage() {
  const { data: campaigns, isLoading } = useCampaigns()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] leading-[32px] font-bold text-[#03182F]">Campagnes</h1>
          <p className="text-[#30373E]/60 text-sm mt-1">
            Gérez vos campagnes de prospection intelligente
          </p>
        </div>
        <Link
          href="/campagnes/nouvelle"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2764FF] hover:bg-[#1a4fd8] text-white text-sm font-semibold rounded-lg transition-all shadow-[0_2px_8px_rgba(39,100,255,0.25)]"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne
        </Link>
      </div>

      {/* Campaign grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-[#03182F]/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : campaigns?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-lg bg-[#F2F8FF] border border-[#03182F]/10 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-[#30373E]/40" />
          </div>
          <h3 className="text-[#03182F] font-bold mb-2">Aucune campagne</h3>
          <p className="text-[#30373E]/60 text-sm mb-6 max-w-xs">
            Créez votre première campagne pour démarrer le pipeline de prospection.
          </p>
          <Link
            href="/campagnes/nouvelle"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2764FF] hover:bg-[#1a4fd8] text-white text-sm font-semibold rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Créer une campagne
          </Link>
        </div>
      )}
    </div>
  )
}
