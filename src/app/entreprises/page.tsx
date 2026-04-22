'use client'

import { useState } from 'react'
import { Building2, Search } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'
import { cn, getCompanyStatusColor, getCompanyStatusLabel, getSectorLabel } from '@/lib/utils'
import { ScoreBar } from '@/components/matching/ScoreBar'
import type { CompanyStatus, CompanyWithCampaignContext } from '@/types'

const statuses: { value: CompanyStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'qualified', label: 'Qualifiés' },
  { value: 'pending', label: 'En attente' },
  { value: 'disqualified', label: 'Disqualifiés' },
]

export default function EntreprisesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | ''>('')

  const { data: companies, isLoading, updateStatus } = useCompanies({
    status: statusFilter || undefined,
  })

  const filtered = ((companies || []) as CompanyWithCampaignContext[]).filter((c) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[22px] leading-[32px] font-bold text-[#03182F]">Entreprises</h1>
        <p className="text-[#30373E]/60 text-sm mt-1">
          Tous les comptes enrichis à travers vos campagnes
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#30373E]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une entreprise..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#03182F]/15 rounded-lg text-[#03182F] text-sm placeholder-[#30373E]/40 focus:outline-none focus:border-[#2764FF]/60 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CompanyStatus | '')}
          className="bg-white border border-[#03182F]/15 rounded-lg px-3 py-2.5 text-[#03182F] text-sm focus:outline-none focus:border-[#2764FF]/60 transition-all"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-[#30373E]/50 text-xs ml-auto">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#03182F]/10 rounded-lg p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#03182F]/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length ? (
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
                {filtered.map((company) => (
                  <tr key={company.id} className="hover:bg-[#F2F8FF] transition-colors group">
                    <td className="px-3 py-3 first:pl-0">
                      <span className="text-[#03182F] font-medium">{company.name}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[#30373E]/60 text-xs">{getSectorLabel(company.sector ?? '')}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {company.current_marketplaces?.map((mp) => (
                          <span
                            key={mp}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-[#F2F8FF] text-[#30373E]/70 border border-[#03182F]/10"
                          >
                            {mp}
                          </span>
                        ))}
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
                            onClick={() =>
                              updateStatus.mutate({ id: company.campaign_company_id, status: 'qualified' })
                            }
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
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-8 h-8 text-[#30373E]/30 mx-auto mb-3" />
            <p className="text-[#30373E]/60 text-sm">Aucune entreprise trouvée.</p>
          </div>
        )}
      </div>
    </div>
  )
}
