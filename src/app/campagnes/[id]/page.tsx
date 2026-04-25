import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Globe } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMockCampaigns } from '@/lib/mock/campaigns'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { CampaignPerformanceSummary } from '@/components/campaigns/CampaignPerformanceSummary'
import { CampaignTabs } from '@/components/campaigns/CampaignTabs'
import { formatDate, getSectorLabel } from '@/lib/utils'
import type { Campaign } from '@/types'

async function getCampaign(id: string): Promise<Campaign | null> {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

  if (useMock) {
    const campaigns = getMockCampaigns()
    return campaigns.find((c) => c.id === id) ?? null
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data as Campaign
  } catch {
    return null
  }
}

interface CampaignDetailPageProps {
  params: { id: string }
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const campaign = await getCampaign(params.id)

  if (!campaign) {
    notFound()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back */}
      <Link
        href="/campagnes"
        className="inline-flex items-center gap-1.5 text-xs text-[#30373E]/50 hover:text-[#30373E] transition-colors mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour aux campagnes
      </Link>

      {/* Campaign header */}
      <div className="bg-white border border-[#03182F]/10 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-[#03182F] truncate">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-sm text-[#30373E]/60">{getSectorLabel(campaign.sector)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap text-xs text-[#30373E]/50">
          {campaign.source_marketplace_name && (
            <div className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Source : <strong className="text-[#03182F]">{campaign.source_marketplace_name}</strong></span>
            </div>
          )}
          {campaign.target_regions?.length > 0 && (
            <div className="flex items-center gap-1">
              <span>Régions : <strong className="text-[#03182F]">{campaign.target_regions.join(', ')}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Créée le {formatDate(campaign.created_at)}</span>
          </div>
          {campaign.mode && (
            <span className="px-2 py-0.5 bg-[#F2F8FF] border border-[#03182F]/8 rounded text-[10px] font-medium uppercase tracking-wider">
              Mode {campaign.mode === 'marketplace' ? 'Marketplace → Sellers' : 'ICP'}
            </span>
          )}
        </div>
      </div>

      {/* Performance summary */}
      <CampaignPerformanceSummary campaign={campaign} />

      {/* Tabs */}
      <div className="bg-white border border-[#03182F]/10 rounded-xl p-5">
        <CampaignTabs campaignId={campaign.id} campaign={campaign} />
      </div>
    </div>
  )
}
