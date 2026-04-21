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
        <div className="h-6 w-48 bg-[#03182F]/5 rounded animate-pulse mb-8" />
        <div className="h-32 bg-[#03182F]/5 rounded-lg animate-pulse" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center text-[#30373E]/60">
        <p>Campagne introuvable.</p>
        <Link href="/campagnes" className="text-[#2764FF] hover:underline text-sm mt-2 inline-block">
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
        className="inline-flex items-center gap-1.5 text-[#30373E]/60 hover:text-[#03182F] text-sm transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour aux campagnes
      </Link>

      {/* Campaign header card */}
      <div className="bg-white border border-[#03182F]/10 rounded-lg p-6 mb-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[22px] leading-[32px] font-bold text-[#03182F]">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-[#30373E]/60 text-sm">
              {getSectorLabel(campaign.sector)} · {campaign.source_marketplace}
            </p>
          </div>

          <LaunchCampaignModal campaign={campaign} />
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-[#03182F]/8">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#30373E]/40" />
            <span className="text-[#03182F] font-bold">{campaign.company_count}</span>
            <span className="text-[#30373E]/60 text-sm">entreprises</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#30373E]/40" />
            <span className="text-[#03182F] font-bold">{campaign.contact_count}</span>
            <span className="text-[#30373E]/60 text-sm">contacts</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#30373E]/40" />
            <span className="text-[#2764FF] font-bold">
              {campaign.avg_match_score ? formatScore(campaign.avg_match_score) : '—'}
            </span>
            <span className="text-[#30373E]/60 text-sm">score moyen</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="w-4 h-4 text-[#30373E]/40" />
            <span className="text-[#30373E]/60 text-sm">{formatDate(campaign.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#30373E]/60 text-sm">
              Taille : <span className="text-[#03182F] font-medium">{sizeLabels[campaign.catalog_size] || campaign.catalog_size}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#30373E]/60 text-sm">
              Ton : <span className="text-[#03182F] font-medium">{toneLabels[campaign.tone] || campaign.tone}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Generating notice */}
      {campaign.status === 'generating' && (
        <div className="bg-[#FFE7EC] border border-[#F22E75]/30 rounded-lg p-4 mb-6 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#F22E75] animate-pulse shrink-0" />
          <div>
            <p className="text-[#770031] text-sm font-medium">Génération en cours...</p>
            <p className="text-[#770031]/70 text-xs mt-0.5">
              Cargo scrape et enrichit les entreprises. Vous recevrez une notification quand les données seront prêtes.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-[#03182F]/10 rounded-lg p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <CampaignTabs campaignId={id} />
      </div>
    </div>
  )
}
