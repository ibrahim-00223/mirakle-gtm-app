'use client'

import { useCompanies } from '@/hooks/useCompanies'
import { cn, getCompanyStatusColor, getCompanyStatusLabel } from '@/lib/utils'
import { ScoreBar } from '@/components/matching/ScoreBar'
import type { CompanyStatus } from '@/types'

interface CompaniesTableProps {
  campaignId?: string
}

const marketplaceBadge = (mp: string) => (
  <span
    key={mp}
    className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.06] text-slate-400 border border-white/[0.06]"
  >
    {mp}
  </span>
)

export function CompaniesTable({ campaignId }: CompaniesTableProps) {
  const { data: companies, isLoading, updateStatus } = useCompanies({ campaignId })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-white/[0.03] rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!companies?.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-sm">Aucune entreprise encore enrichie.</p>
        <p className="text-xs mt-1">Les données apparaîtront une fois la génération terminée.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['Entreprise', 'Secteur', 'Marketplaces', 'Top Match Mirakl', 'Score', 'Statut', ''].map(
              (h) => (
                <th
                  key={h}
                  className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-3 first:pl-0 last:pr-0"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-white/[0.02] transition-colors group">
              <td className="px-3 py-3 first:pl-0">
                <span className="text-white font-medium">{company.name}</span>
              </td>
              <td className="px-3 py-3">
                <span className="text-slate-400 text-xs">{company.sector}</span>
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {company.marketplaces?.map(marketplaceBadge)}
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="text-[#00C2A8] text-xs">{company.top_match_marketplace}</span>
              </td>
              <td className="px-3 py-3 w-36">
                <ScoreBar score={company.match_score} size="sm" />
              </td>
              <td className="px-3 py-3">
                <span
                  className={cn(
                    'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    getCompanyStatusColor(company.status)
                  )}
                >
                  {getCompanyStatusLabel(company.status)}
                </span>
              </td>
              <td className="px-3 py-3 last:pr-0">
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {company.status !== 'qualified' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: company.id, status: 'qualified' })}
                      className="px-2 py-1 text-[10px] font-medium text-[#00C2A8] border border-[rgba(0,194,168,0.3)] rounded hover:bg-[rgba(0,194,168,0.1)] transition-colors"
                    >
                      Qualifier
                    </button>
                  )}
                  {company.status !== 'disqualified' && (
                    <button
                      onClick={() =>
                        updateStatus.mutate({ id: company.id, status: 'disqualified' })
                      }
                      className="px-2 py-1 text-[10px] font-medium text-[#EF4444] border border-[rgba(239,68,68,0.3)] rounded hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                    >
                      Disqualifier
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
