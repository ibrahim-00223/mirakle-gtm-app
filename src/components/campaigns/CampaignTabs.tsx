'use client'

import { useState } from 'react'
import { Building2, TrendingUp, Users, Rocket, Loader2 } from 'lucide-react'
import { CompaniesTable } from '@/components/companies/CompaniesTable'
import { MatchingTable } from '@/components/matching/MatchingTable'
import { ContactsTable } from '@/components/contacts/ContactsTable'
import { OutreachBuilder } from '@/components/campaigns/OutreachBuilder'
import { cn } from '@/lib/utils'
import { useLaunchMatching } from '@/hooks/useMatching'
import type { Campaign } from '@/types'

const tabs = [
  { id: 'entreprises', label: 'Entreprises', icon: Building2 },
  { id: 'matching', label: 'Match', icon: TrendingUp },
  { id: 'contacts', label: 'Key Contacts', icon: Users },
  { id: 'outreach', label: 'Outreach', icon: Rocket },
] as const

type TabId = (typeof tabs)[number]['id']

interface CampaignTabsProps {
  campaignId: string
  campaign?: Campaign
}

export function CampaignTabs({ campaignId, campaign }: CampaignTabsProps) {
  const [active, setActive] = useState<TabId>('entreprises')
  const launchMatching = useLaunchMatching()

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-[#03182F]/10 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px',
                isActive
                  ? 'text-[#03182F] border-[#2764FF]'
                  : 'text-[#30373E]/50 border-transparent hover:text-[#30373E]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {active === 'entreprises' && (
        <div className="space-y-4">
          {/* Lancer le Matching */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#30373E]/50">
              Entreprises identifiées par la campagne
            </p>
            <button
              onClick={() => launchMatching.mutate(campaignId)}
              disabled={launchMatching.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#2764FF] text-white rounded-lg hover:bg-[#1a4fd8] transition-colors disabled:opacity-50"
            >
              {launchMatching.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              {launchMatching.isPending ? 'Matching en cours…' : 'Lancer le Matching'}
            </button>
          </div>
          {launchMatching.isSuccess && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              ✓ Matching lancé — les scores seront mis à jour dans quelques instants.
            </p>
          )}
          <CompaniesTable campaignId={campaignId} />
        </div>
      )}
      {active === 'matching' && <MatchingTable campaignId={campaignId} />}
      {active === 'contacts' && <ContactsTable campaignId={campaignId} />}
      {active === 'outreach' && (
        <OutreachBuilder
          campaignId={campaignId}
          campaignName={campaign?.name}
          marketplaceName={campaign?.source_marketplace_name ?? undefined}
          sellerSector={campaign?.sector}
        />
      )}
    </div>
  )
}
