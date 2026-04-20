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
      <div className="bg-[#162035] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] hover:bg-[#1a2742] transition-all duration-150 cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold font-heading text-sm truncate group-hover:text-[#0066FF] transition-colors">
              {campaign.name}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">{getSectorLabel(campaign.sector)}</p>
          </div>
          <CampaignStatusBadge status={campaign.status} className="shrink-0 ml-2" />
        </div>

        {/* Source marketplace */}
        <div className="mb-4">
          <span className="text-xs text-slate-500">Source : </span>
          <span className="text-xs text-slate-300">{campaign.source_marketplace}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 bg-white/[0.03] rounded-lg">
            <Building2 className="w-3.5 h-3.5 text-slate-500 mb-1" />
            <span className="text-white font-bold text-sm font-mono">{campaign.company_count}</span>
            <span className="text-slate-600 text-[10px]">Entreprises</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-white/[0.03] rounded-lg">
            <Users className="w-3.5 h-3.5 text-slate-500 mb-1" />
            <span className="text-white font-bold text-sm font-mono">{campaign.contact_count}</span>
            <span className="text-slate-600 text-[10px]">Contacts</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-white/[0.03] rounded-lg">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500 mb-1" />
            <span className="text-[#00C2A8] font-bold text-sm font-mono">
              {campaign.avg_match_score ? formatScore(campaign.avg_match_score) : '—'}
            </span>
            <span className="text-slate-600 text-[10px]">Score moy.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1 text-slate-600 text-[10px]">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(campaign.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
