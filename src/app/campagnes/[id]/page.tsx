'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Users, TrendingUp, Calendar } from 'lucide-react'
import { useCampaign } from '@/hooks/useCampaign'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { CampaignTabs } from '@/components/campaigns/CampaignTabs'
import { LaunchCampaignModal } from '@/components/campaigns/LaunchCampaignModal'
import { formatDate, formatScore, getSectorLabel } from '@/lib/utils'

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
}

const toneLabels: Record<string, string> = {
  consultative: 'Consultatif',
  direct: 'Direct',
  educational: 'Éducatif',
  luxury: 'Premium / Luxe',
}

const sizeLabels: Record<string, string> = {
  small: '< 500 SKUs',
  medium: '500–5 000 SKUs',
  large: '> 5 000 SKUs',
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params)
  const { data: campaign, isLoading } = useCampaign(id)

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-6 w-48 bg-white/[0.05] rounded animate-pulse mb-8" />
        <div className="h-32 bg-white/[0.03] rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Campagne introuvable.</p>
        <Link href="/campagnes" className="text-[#0066FF] hover:underline text-sm mt-2 inline-block">
          Retour aux campagnes
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Back */}
      <Link
        href="/campagnes"
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour aux campagnes
      </Link>

      {/* Campaign header card */}
      <div className="bg-[#162035] border border-white/[0.06] rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white font-heading">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-slate-500 text-sm">
              {getSectorLabel(campaign.sector)} · {campaign.source_marketplace}
            </p>
          </div>

          {/* Launch button */}
          <LaunchCampaignModal campaign={campaign} />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600" />
            <span className="text-white font-bold font-mono">{campaign.company_count}</span>
            <span className="text-slate-500 text-sm">entreprises</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <span className="text-white font-bold font-mono">{campaign.contact_count}</span>
            <span className="text-slate-500 text-sm">contacts</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-600" />
            <span className="text-[#00C2A8] font-bold font-mono">
              {campaign.avg_match_score ? formatScore(campaign.avg_match_score) : '—'}
            </span>
            <span className="text-slate-500 text-sm">score moyen</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="w-4 h-4 text-slate-600" />
            <span className="text-slate-500 text-sm">{formatDate(campaign.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">
              Taille : <span className="text-white">{sizeLabels[campaign.catalog_size] || campaign.catalog_size}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">
              Ton : <span className="text-white">{toneLabels[campaign.tone] || campaign.tone}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Generating notice */}
      {campaign.status === 'generating' && (
        <div className="bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse shrink-0" />
          <div>
            <p className="text-[#F59E0B] text-sm font-medium">Génération en cours...</p>
            <p className="text-[#F59E0B]/70 text-xs mt-0.5">
              Cargo scrape et enrichit les entreprises. Vous recevrez une notification quand les données seront prêtes.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-[#162035] border border-white/[0.06] rounded-2xl p-6">
        <CampaignTabs campaignId={id} />
      </div>
    </div>
  )
}
