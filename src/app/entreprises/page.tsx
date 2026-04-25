'use client'

import { useState } from 'react'
import { ChevronRight, Building2 } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useCompanies } from '@/hooks/useCompanies'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { CsvExportButton } from '@/components/shared/CsvExportButton'
import { ScoreBar } from '@/components/matching/ScoreBar'
import { cn, getCompanyStatusColor, getCompanyStatusLabel } from '@/lib/utils'
import type { CompanyWithCampaignContext } from '@/types'

const CSV_COLUMNS = [
  { header: 'Entreprise', accessor: (r: CompanyWithCampaignContext) => r.name },
  { header: 'Site web', accessor: (r: CompanyWithCampaignContext) => r.website_url ?? '' },
  { header: 'Secteur', accessor: (r: CompanyWithCampaignContext) => r.sector ?? '' },
  { header: 'Pays', accessor: (r: CompanyWithCampaignContext) => r.country_code ?? '' },
  { header: 'Catalogue', accessor: (r: CompanyWithCampaignContext) => r.catalog_size ?? '' },
  { header: 'Score match', accessor: (r: CompanyWithCampaignContext) => r.match_score ?? '' },
  { header: 'Top marketplace', accessor: (r: CompanyWithCampaignContext) => r.top_match_marketplace_name ?? '' },
  { header: 'Statut', accessor: (r: CompanyWithCampaignContext) => r.status },
  { header: 'LinkedIn', accessor: (r: CompanyWithCampaignContext) => r.linkedin_url ?? '' },
]

export default function EntreprisesPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const { data: companies, isLoading: companiesLoading } = useCompanies({
    campaignId: selectedCampaignId ?? undefined,
  })

  const selectedCampaign = campaigns?.find((c) => c.id === selectedCampaignId)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-[#30373E]/50 mb-1">
          <span
            className={cn('cursor-pointer hover:text-[#03182F] transition-colors', !selectedCampaignId && 'text-[#03182F] font-medium')}
            onClick={() => setSelectedCampaignId(null)}
          >
            Campagnes
          </span>
          {selectedCampaign && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#03182F] font-medium">{selectedCampaign.name}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold text-[#03182F]">Entreprises</h1>
        <p className="text-sm text-[#30373E]/60 mt-1">
          {selectedCampaign
            ? `Sellers identifiés dans la campagne "${selectedCampaign.name}"`
            : 'Sélectionnez une campagne pour voir ses entreprises'}
        </p>
      </div>

      {/* Campaign selector */}
      {!selectedCampaignId && (
        <div>
          {campaignsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-white border border-[#03182F]/8 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (campaigns ?? []).length === 0 ? (
            <div className="text-center py-20 text-[#30373E]/40 text-sm">
              Aucune campagne disponible.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(campaigns ?? []).map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => setSelectedCampaignId(campaign.id)}
                  className="text-left bg-white border border-[#03182F]/10 rounded-xl p-4 hover:border-[#2764FF]/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold text-[#03182F] group-hover:text-[#2764FF] transition-colors leading-tight">
                      {campaign.name}
                    </h3>
                    <CampaignStatusBadge status={campaign.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#30373E]/50">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>{campaign.company_count} sellers</span>
                    </div>
                    {campaign.avg_match_score && (
                      <span>Score moy : <strong className="text-[#2764FF]">{Math.round(campaign.avg_match_score)}</strong></span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Companies table */}
      {selectedCampaignId && (
        <div className="bg-white border border-[#03182F]/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-[#30373E]/50">
              {(companies as CompanyWithCampaignContext[])?.length ?? 0} entreprises
            </p>
            <CsvExportButton
              data={(companies as CompanyWithCampaignContext[]) ?? []}
              filename={`sellers-${selectedCampaign?.name?.toLowerCase().replace(/\s+/g, '-')}`}
              columns={CSV_COLUMNS}
              label="Exporter CSV"
            />
          </div>

          {companiesLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-[#03182F]/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !(companies as CompanyWithCampaignContext[])?.length ? (
            <div className="text-center py-16 text-[#30373E]/60 text-sm">
              Aucune entreprise pour cette campagne.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#03182F]/8">
                    {['Entreprise', 'Secteur', 'Pays', 'Catalogue', 'Score', 'Statut'].map((h) => (
                      <th key={h} className="text-left text-[10px] font-semibold text-[#30373E]/50 uppercase tracking-wider px-3 py-3 first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#03182F]/5">
                  {(companies as CompanyWithCampaignContext[]).map((company) => (
                    <tr key={company.id} className="hover:bg-[#F2F8FF] transition-colors">
                      <td className="px-3 py-3 first:pl-0">
                        <div>
                          <p className="text-[#03182F] font-medium text-xs">{company.name}</p>
                          {company.website_url && (
                            <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#2764FF] hover:underline">
                              {company.domain ?? company.website_url}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3"><span className="text-[#30373E]/60 text-xs">{company.sector ?? '—'}</span></td>
                      <td className="px-3 py-3"><span className="text-[#30373E]/60 text-xs">{company.country_code ?? '—'}</span></td>
                      <td className="px-3 py-3"><span className="text-[#30373E]/60 text-xs capitalize">{company.catalog_size ?? '—'}</span></td>
                      <td className="px-3 py-3 w-32">
                        <ScoreBar score={company.match_score ?? 0} size="sm" />
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border', getCompanyStatusColor(company.status))}>
                          {getCompanyStatusLabel(company.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
