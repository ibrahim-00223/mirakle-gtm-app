'use client'

import { useCompanies } from '@/hooks/useCompanies'
import { ScoreBar } from './ScoreBar'
import { cn, getCompanyStatusColor, getCompanyStatusLabel } from '@/lib/utils'

interface MatchingTableProps {
  campaignId?: string
}

export function MatchingTable({ campaignId }: MatchingTableProps) {
  const { data: companies, isLoading, updateStatus } = useCompanies({ campaignId })

  const sorted = [...(companies || [])].sort((a, b) => b.match_score - a.match_score)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-white/[0.03] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!sorted.length) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        Aucun matching disponible pour le moment.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((company) => (
        <div
          key={company.id}
          className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 hover:border-white/[0.1] transition-all"
        >
          <div className="flex items-start gap-4">
            {/* Left: Company info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-semibold text-sm">{company.name}</span>
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
              <p className="text-[#00C2A8] text-xs mb-2">
                Top match :{' '}
                <span className="font-semibold">{company.top_match_marketplace}</span>
              </p>

              {/* Score bar */}
              <div className="mb-2">
                <ScoreBar score={company.match_score} />
              </div>

              {/* Rationale */}
              {company.match_rationale && (
                <p className="text-slate-500 text-xs leading-relaxed italic">
                  "{company.match_rationale}"
                </p>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col gap-1.5 shrink-0">
              {company.status !== 'qualified' && (
                <button
                  onClick={() => updateStatus.mutate({ id: company.id, status: 'qualified' })}
                  className="px-3 py-1.5 text-xs font-medium text-[#00C2A8] border border-[rgba(0,194,168,0.3)] rounded-lg hover:bg-[rgba(0,194,168,0.1)] transition-colors"
                >
                  Qualifier
                </button>
              )}
              {company.status !== 'disqualified' && (
                <button
                  onClick={() =>
                    updateStatus.mutate({ id: company.id, status: 'disqualified' })
                  }
                  className="px-3 py-1.5 text-xs font-medium text-[#EF4444] border border-[rgba(239,68,68,0.3)] rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-colors"
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
