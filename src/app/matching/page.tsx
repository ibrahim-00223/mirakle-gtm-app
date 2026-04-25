'use client'

import { useState } from 'react'
import { ChevronRight, Building2, Target } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useMatchResults } from '@/hooks/useMatching'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { MatchStatusBadge } from '@/components/matching/MatchStatusBadge'
import { ScoreBar } from '@/components/matching/ScoreBar'
import { cn } from '@/lib/utils'
import type { CompanyWithCampaignContext } from '@/types'

export default function MatchingPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const { data: companies, isLoading: companiesLoading } = useMatchResults(selectedCampaignId ?? undefined)

  const selectedCampaign = campaigns?.find((c) => c.id === selectedCampaignId)

  // Séparer Matched et Not Matched
  const matched = (companies ?? []).filter((c) => c.status === 'qualified' || (c.match_score ?? 0) >= 60)
  const notMatched = (companies ?? []).filter((c) => c.status === 'disqualified' || ((c.match_score ?? 0) < 60 && c.status !== 'qualified'))
  const pending = (companies ?? []).filter((c) => c.status === 'pending' && (c.match_score ?? 0) >= 60)

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
        <h1 className="text-2xl font-bold text-[#03182F]">Matching</h1>
        <p className="text-sm text-[#30373E]/60 mt-1">
          {selectedCampaign
            ? `Résultats de matching pour "${selectedCampaign.name}"`
            : 'Sélectionnez une campagne pour voir les scores de compatibilité'}
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
            <div className="text-center py-20 text-[#30373E]/40 text-sm">Aucune campagne disponible.</div>
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
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>{campaign.qualified_count} matchés</span>
                    </div>
                    {campaign.avg_match_score && (
                      <span>Moy. <strong className="text-[#2764FF]">{Math.round(campaign.avg_match_score)}</strong></span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Matching results */}
      {selectedCampaignId && (
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="flex items-center gap-4 bg-white border border-[#03182F]/10 rounded-xl px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-[#03182F]">{matched.length} Matched</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#03182F]/20" />
              <span className="text-xs text-[#30373E]/60">{notMatched.length} Not Matched</span>
            </div>
            <div className="flex-1" />
            <span className="text-xs text-[#30373E]/40">Seuil : score ≥ 60</span>
          </div>

          {companiesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-white border border-[#03182F]/8 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (companies ?? []).length === 0 ? (
            <div className="text-center py-16 text-[#30373E]/60 text-sm">
              Aucun résultat de matching. Lancez le matching depuis l&apos;onglet Entreprises de la campagne.
            </div>
          ) : (
            <div className="space-y-2">
              {/* ── Matched ───────────────────────────────────────────────── */}
              {matched.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-2 px-1">
                    ✓ Matched ({matched.length})
                  </p>
                  {matched.map((company) => (
                    <CompanyMatchRow key={company.id} company={company} />
                  ))}
                </div>
              )}

              {/* ── Not Matched ────────────────────────────────────────────── */}
              {notMatched.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-[#30373E]/40 uppercase tracking-wider mb-2 px-1">
                    ✗ Not Matched ({notMatched.length})
                  </p>
                  {notMatched.map((company) => (
                    <CompanyMatchRow key={company.id} company={company} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CompanyMatchRow({ company }: { company: CompanyWithCampaignContext }) {
  return (
    <div className="bg-white border border-[#03182F]/8 rounded-xl p-4 mb-2 hover:border-[#2764FF]/20 transition-all">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[#03182F] font-semibold text-sm">{company.name}</span>
            <MatchStatusBadge status={company.status} score={company.match_score} />
            {company.top_match_marketplace_name && (
              <span className="text-[10px] text-[#2764FF] font-medium">
                → {company.top_match_marketplace_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48">
              <ScoreBar score={company.match_score ?? 0} size="sm" />
            </div>
            {company.match_rationale && (
              <p className="text-[11px] text-[#30373E]/50 italic truncate max-w-xs">
                {company.match_rationale}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-2xl font-bold text-[#2764FF]">
            {company.match_score ?? '—'}
          </span>
          <span className="text-xs text-[#30373E]/40">/100</span>
        </div>
      </div>
    </div>
  )
}
