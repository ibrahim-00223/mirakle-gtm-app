'use client'

import { useCompanies } from '@/hooks/useCompanies'
import { ScoreBar } from './ScoreBar'
import { cn, getCompanyStatusColor, getCompanyStatusLabel } from '@/lib/utils'
import type { CompanyWithCampaignContext } from '@/types'

interface MatchingTableProps {
  campaignId?: string
}

export function MatchingTable({ campaignId }: MatchingTableProps) {
  const { data: companies, isLoading, updateStatus } = useCompanies({ campaignId })

  const sorted = [...((companies as CompanyWithCampaignContext[]) || [])].sort(
    (a, b) => (b.match_score ?? 0) - (a.match_score ?? 0)
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-[#03182F]/5 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!sorted.length) {
    return (
      <div className="text-center py-16 text-[#30373E]/60 text-sm">
        Aucun matching disponible pour le moment.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((company) => (
        <div
          key={company.id}
          className="bg-[#F2F8FF] border border-[#03182F]/8 rounded-lg p-4 hover:border-[#2764FF]/25 transition-all"
        >
          <div className="flex items-start gap-4">
            {/* Left: Company info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#03182F] font-semibold text-sm">{company.name}</span>
                <span
                  className={cn(
                    'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    getCompanyStatusColor(company.status)
                  )}
                >
                  {getCompanyStatusLabel(company.status)}
                </span>
              </div>

              {/* Top match */}
              <p className="text-[#2764FF] text-xs mb-2">
                Top match :{' '}
                <span className="font-semibold">{company.top_match_marketplace_name}</span>
              </p>

              {/* Score bar */}
              <div className="mb-2">
                <ScoreBar score={company.match_score ?? 0} />
              </div>

              {/* Rationale */}
              {company.match_rationale && (
                <p className="text-[#30373E]/60 text-xs leading-relaxed italic">
                  "{company.match_rationale}"
                </p>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col gap-1.5 shrink-0">
              {company.status !== 'qualified' && (
                <button
                  onClick={() => updateStatus.mutate({ id: company.campaign_company_id, status: 'qualified' })}
                  className="px-3 py-1.5 text-xs font-medium text-[#2764FF] border border-[rgba(39,100,255,0.3)] rounded-lg hover:bg-[rgba(39,100,255,0.08)] transition-colors"
                >
                  Qualifier
                </button>
              )}
              {company.status !== 'disqualified' && (
                <button
                  onClick={() =>
                    updateStatus.mutate({ id: company.campaign_company_id, status: 'disqualified' })
                  }
                  className="px-3 py-1.5 text-xs font-medium text-[#770031] border border-[#F22E75]/30 rounded-lg hover:bg-[#FFE7EC] transition-colors"
                >
                  Disqualifier
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
