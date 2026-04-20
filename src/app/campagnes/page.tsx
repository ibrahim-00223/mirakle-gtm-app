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
          <h1 className="text-2xl font-bold text-white font-heading">Campagnes</h1>
          <p className="text-slate-500 text-sm mt-1">
            Gérez vos campagnes de prospection intelligente
          </p>
        </div>
        <Link
          href="/campagnes/nouvelle"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#0066FF]/20"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne
        </Link>
      </div>

      {/* Campaign grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white/[0.03] rounded-xl animate-pulse" />
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
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-slate-600" />
          </div>
          <h3 className="text-white font-semibold mb-2">Aucune campagne</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs">
            Créez votre première campagne pour démarrer le pipeline de prospection.
          </p>
          <Link
            href="/campagnes/nouvelle"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Créer une campagne
          </Link>
        </div>
      )}
    </div>
  )
}
