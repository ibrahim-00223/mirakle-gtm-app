'use client'

import { useState } from 'react'
import { Building2, Search } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'
import { cn, getCompanyStatusColor, getCompanyStatusLabel, getSectorLabel } from '@/lib/utils'
import { ScoreBar } from '@/components/matching/ScoreBar'
import type { CompanyStatus } from '@/types'

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

  const filtered = (companies || []).filter((c) =>
    search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-heading">Entreprises</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tous les comptes enrichis à travers vos campagnes
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une entreprise..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#0066FF]/60 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CompanyStatus | '')}
          className="bg-[#0F1F3D] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#0066FF]/60 transition-all"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-slate-600 text-xs ml-auto">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#162035] border border-white/[0.06] rounded-2xl p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/[0.03] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length ? (
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
                {filtered.map((company) => (
                  <tr key={company.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-3 py-3 first:pl-0">
                      <span className="text-white font-medium">{company.name}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-slate-400 text-xs">{getSectorLabel(company.sector)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {company.marketplaces?.map((mp) => (
                          <span
                            key={mp}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-slate-400 border border-white/[0.06]"
                          >
                            {mp}
                          </span>
                        ))}
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
                            onClick={() =>
                              updateStatus.mutate({ id: company.id, status: 'qualified' })
                            }
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
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Aucune entreprise trouvée.</p>
          </div>
        )}
      </div>
    </div>
  )
}
