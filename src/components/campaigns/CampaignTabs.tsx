'use client'

import { useState } from 'react'
import { Building2, TrendingUp, Users, Rocket, Loader2, RefreshCw } from 'lucide-react'
import { CompaniesTable } from '@/components/companies/CompaniesTable'
import { MatchingTable } from '@/components/matching/MatchingTable'
import { ContactsTable } from '@/components/contacts/ContactsTable'
import { OutreachBuilder } from '@/components/campaigns/OutreachBuilder'
import { cn } from '@/lib/utils'
import { useLaunchMatching, useLaunchScraping, useLaunchContacts } from '@/hooks/useMatching'
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
  const [scrapingActive, setScrapingActive] = useState(false)
  const [contactsActive, setContactsActive] = useState(false)
  const launchMatching = useLaunchMatching()
  const launchScraping = useLaunchScraping()
  const launchContacts = useLaunchContacts()

  // Polling toutes les 5s après un scraping lancé — s'arrête dès que des entreprises apparaissent
  const pollingInterval = scrapingActive ? 5000 : undefined

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
          {/* Actions bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-[#30373E]/50">
              Entreprises identifiées par la campagne
            </p>
            <div className="flex items-center gap-2">
              {/* Bouton Scraping */}
              <button
                onClick={() => {
                  setScrapingActive(true)
                  launchScraping.mutate(campaignId, {
                    onSuccess: () => {
                      // Arrêter le polling après 3 minutes max
                      setTimeout(() => setScrapingActive(false), 3 * 60 * 1000)
                    },
                    onError: () => setScrapingActive(false),
                  })
                }}
                disabled={launchScraping.isPending || launchMatching.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#03182F] text-white rounded-lg hover:bg-[#0a2540] transition-colors disabled:opacity-50"
              >
                {launchScraping.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : scrapingActive ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                {launchScraping.isPending ? 'Lancement…' : scrapingActive ? 'Scraping en cours…' : 'Lancer le Scraping'}
              </button>

              {/* Bouton Matching */}
              <button
                onClick={() => launchMatching.mutate(campaignId)}
                disabled={launchMatching.isPending || launchScraping.isPending}
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
          </div>

          {/* Feedback messages */}
          {launchScraping.isSuccess && (
            <p className="text-xs text-[#03182F] bg-[#F2F8FF] border border-[#2764FF]/20 rounded-lg px-3 py-2">
              🔍 Scraping lancé — les sellers apparaîtront dans quelques instants.
            </p>
          )}
          {launchScraping.isError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ✗ Erreur lors du lancement du scraping. Vérifiez la configuration N8N ou BrightData.
            </p>
          )}
          {launchMatching.isSuccess && (
            <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              ✓ Matching lancé — les scores seront mis à jour dans quelques instants.
            </p>
          )}

          <CompaniesTable campaignId={campaignId} refetchInterval={pollingInterval} onDataLoaded={() => setScrapingActive(false)} />
        </div>
      )}
      {active === 'matching' && <MatchingTable campaignId={campaignId} />}
      {active === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-[#30373E]/50">
              Contacts clés identifiés pour chaque entreprise
            </p>
            <button
              onClick={() => {
                setContactsActive(true)
                launchContacts.mutate(campaignId, {
                  onSuccess: () => setTimeout(() => setContactsActive(false), 5 * 60 * 1000),
                  onError: () => setContactsActive(false),
                })
              }}
              disabled={launchContacts.isPending || contactsActive}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#03182F] text-white rounded-lg hover:bg-[#0a2540] transition-colors disabled:opacity-50"
            >
              {launchContacts.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : contactsActive ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              {launchContacts.isPending
                ? 'Lancement…'
                : contactsActive
                ? 'Recherche en cours…'
                : 'Trouver les contacts'}
            </button>
          </div>

          {launchContacts.isSuccess && (
            <p className="text-xs text-[#03182F] bg-[#F2F8FF] border border-[#2764FF]/20 rounded-lg px-3 py-2">
              👥 Recherche lancée — les contacts apparaîtront dans quelques instants via Cargo + Apify.
            </p>
          )}
          {launchContacts.isError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ✗ Erreur lors de la recherche. Vérifiez les clés CARGO_API_KEY et APIFY_API_TOKEN.
            </p>
          )}

          <ContactsTable campaignId={campaignId} />
        </div>
      )}
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
