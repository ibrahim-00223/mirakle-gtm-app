import Link from 'next/link'
import { Building2, Users, TrendingUp, Calendar } from 'lucide-react'
import { CampaignStatusBadge } from './CampaignStatusBadge'
import { formatDate, formatScore, getSectorLabel } from '@/lib/utils'
import type { CampaignWithStats } from '@/types'

interface CampaignCardProps {
  campaign: CampaignWithStats
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Link href={`/campagnes/${campaign.id}`}>
      <div className="bg-white border border-[#03182F]/10 rounded-lg p-5 hover:border-[#2764FF]/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-all duration-150 cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[#03182F] font-bold text-sm truncate group-hover:text-[#2764FF] transition-colors">
              {campaign.name}
            </h3>
            <p className="text-[#30373E]/50 text-xs mt-0.5">{getSectorLabel(campaign.sector)}</p>
          </div>
          <CampaignStatusBadge status={campaign.status} className="shrink-0 ml-2" />
        </div>

        {/* Source marketplace */}
        <div className="mb-4">
          <span className="text-xs text-[#30373E]/50">Source : </span>
          <span className="text-xs text-[#30373E]">{campaign.source_marketplace}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 bg-[#F2F8FF] rounded-lg">
            <Building2 className="w-3.5 h-3.5 text-[#30373E]/40 mb-1" />
            <span className="text-[#03182F] font-bold text-sm">{campaign.company_count}</span>
            <span className="text-[#30373E]/40 text-[10px]">Entreprises</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-[#F2F8FF] rounded-lg">
            <Users className="w-3.5 h-3.5 text-[#30373E]/40 mb-1" />
            <span className="text-[#03182F] font-bold text-sm">{campaign.contact_count}</span>
            <span className="text-[#30373E]/40 text-[10px]">Contacts</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-[#F2F8FF] rounded-lg">
            <TrendingUp className="w-3.5 h-3.5 text-[#30373E]/40 mb-1" />
            <span className="text-[#2764FF] font-bold text-sm">
              {campaign.avg_match_score ? formatScore(campaign.avg_match_score) : '—'}
            </span>
            <span className="text-[#30373E]/40 text-[10px]">Score moy.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1 text-[#30373E]/40 text-[10px]">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(campaign.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
