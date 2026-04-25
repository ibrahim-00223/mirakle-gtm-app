'use client'

import { useEffect } from 'react'
import { useCompanies } from '@/hooks/useCompanies'
import { cn, getCompanyStatusColor, getCompanyStatusLabel } from '@/lib/utils'
import { ScoreBar } from '@/components/matching/ScoreBar'
import type { CompanyWithCampaignContext } from '@/types'

interface CompaniesTableProps {
  campaignId?: string
  /** Intervalle de polling en ms (ex: 5000) */
  refetchInterval?: number
  /** Appelé dès que des données apparaissent — permet d'arrêter le polling */
  onDataLoaded?: () => void
}

const marketplaceBadge = (mp: string) => (
  <span
    key={mp}
    className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F2F8FF] text-[#30373E]/70 border border-[#03182F]/10"
  >
    {mp}
  </span>
)

export function CompaniesTable({ campaignId, refetchInterval, onDataLoaded }: CompaniesTableProps) {
  const { data: companies, isLoading, updateStatus } = useCompanies({ campaignId, refetchInterval })

  // Arrêter le polling dès que des entreprises arrivent
  useEffect(() => {
    if (companies && companies.length > 0 && onDataLoaded) {
      onDataLoaded()
    }
  }, [companies, onDataLoaded])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-[#03182F]/5 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!companies?.length) {
    return (
      <div className="text-center py-16 text-[#30373E]/60">
        <p className="text-sm">Aucune entreprise encore enrichie.</p>
        <p className="text-xs mt-1">Les données apparaîtront une fois la génération terminée.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#03182F]/8">
            {['Entreprise', 'Secteur', 'Marketplaces', 'Top Match Mirakl', 'Score', 'Statut', ''].map(
              (h) => (
                <th
                  key={h}
                  className="text-left text-[10px] font-semibold text-[#30373E]/50 uppercase tracking-wider px-3 py-3 first:pl-0 last:pr-0"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#03182F]/5">
          {(companies as CompanyWithCampaignContext[]).map((company) => (
            <tr key={company.id} className="hover:bg-[#F2F8FF] transition-colors group">
              <td className="px-3 py-3 first:pl-0">
                <span className="text-[#03182F] font-medium">{company.name}</span>
              </td>
              <td className="px-3 py-3">
                <span className="text-[#30373E]/60 text-xs">{company.sector}</span>
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {company.current_marketplaces?.map(marketplaceBadge)}
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="text-[#2764FF] text-xs font-medium">{company.top_match_marketplace_name}</span>
              </td>
              <td className="px-3 py-3 w-36">
                <ScoreBar score={company.match_score ?? 0} size="sm" />
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
                      onClick={() => updateStatus.mutate({ id: company.campaign_company_id, status: 'qualified' })}
                      className="px-2 py-1 text-[10px] font-medium text-[#2764FF] border border-[rgba(39,100,255,0.3)] rounded hover:bg-[rgba(39,100,255,0.08)] transition-colors"
                    >
                      Qualifier
                    </button>
                  )}
                  {company.status !== 'disqualified' && (
                    <button
                      onClick={() =>
                        updateStatus.mutate({ id: company.campaign_company_id, status: 'disqualified' })
                      }
                      className="px-2 py-1 text-[10px] font-medium text-[#770031] border border-[#F22E75]/30 rounded hover:bg-[#FFE7EC] transition-colors"
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
