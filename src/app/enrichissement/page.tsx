'use client'

import { useState } from 'react'
import { ChevronRight, Building2, Loader2, Zap } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useEnrichedContacts, useTriggerEnrichment } from '@/hooks/useEnrichment'
import { useCompanies } from '@/hooks/useCompanies'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { EnrichmentTable } from '@/components/enrichment/EnrichmentTable'
import { cn } from '@/lib/utils'
import type { ContactWithOutreachContext, CompanyWithCampaignContext } from '@/types'

export default function EnrichissementPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const { data: contacts, isLoading: contactsLoading } = useEnrichedContacts({
    campaignId: selectedCampaignId ?? undefined,
  })
  const { data: companies } = useCompanies({ campaignId: selectedCampaignId ?? undefined })
  const triggerEnrichment = useTriggerEnrichment()

  const selectedCampaign = campaigns?.find((c) => c.id === selectedCampaignId)

  async function handleBulkEnrich() {
    if (!companies?.length) return
    // Lancer l'enrichissement pour chaque entreprise
    for (const company of companies as CompanyWithCampaignContext[]) {
      if (!company.is_enriched) {
        await triggerEnrichment.mutateAsync({ company_id: company.id, domain: company.domain ?? undefined })
      }
    }
  }

  const unenrichedCount = (companies as CompanyWithCampaignContext[] | undefined)?.filter((c) => !c.is_enriched).length ?? 0

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#03182F]">Enrichissement</h1>
            <p className="text-sm text-[#30373E]/60 mt-1">
              {selectedCampaign
                ? `Prospects identifiés dans "${selectedCampaign.name}"`
                : 'Sélectionnez une campagne pour enrichir les contacts'}
            </p>
          </div>
          {selectedCampaignId && unenrichedCount > 0 && (
            <button
              onClick={handleBulkEnrich}
              disabled={triggerEnrichment.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2764FF] text-white text-sm font-semibold rounded-xl hover:bg-[#1a4fd8] transition-colors disabled:opacity-50"
            >
              {triggerEnrichment.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Tout enrichir ({unenrichedCount} entreprises)
            </button>
          )}
        </div>
      </div>

      {/* Pipeline explanation */}
      {selectedCampaignId && (
        <div className="bg-[#F2F8FF] border border-[#2764FF]/15 rounded-xl px-5 py-3 mb-5 flex items-center gap-6 text-xs text-[#30373E]/60">
          <span className="font-semibold text-[#03182F]">Pipeline d&apos;enrichissement :</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2764FF]" />
            <span>① Cargo → LinkedIn URL</span>
          </div>
          <span className="text-[#03182F]/20">→</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2764FF]" />
            <span>② Apify → Extraction contacts</span>
          </div>
          <span className="text-[#03182F]/20">→</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2764FF]" />
            <span>③ Apify → Email + Téléphone</span>
          </div>
        </div>
      )}

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
                      <span>{campaign.contact_count} contacts</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enrichment table */}
      {selectedCampaignId && (
        <div className="bg-white border border-[#03182F]/10 rounded-xl p-5">
          <EnrichmentTable
            contacts={(contacts as ContactWithOutreachContext[]) ?? []}
            isLoading={contactsLoading}
            onBulkEnrich={handleBulkEnrich}
          />
        </div>
      )}
    </div>
  )
}
