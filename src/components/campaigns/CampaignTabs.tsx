'use client'

import { useState } from 'react'
import { Building2, TrendingUp, Users } from 'lucide-react'
import { CompaniesTable } from '@/components/companies/CompaniesTable'
import { MatchingTable } from '@/components/matching/MatchingTable'
import { ContactsTable } from '@/components/contacts/ContactsTable'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'entreprises', label: 'Entreprises', icon: Building2 },
  { id: 'matching', label: 'Matching', icon: TrendingUp },
  { id: 'contacts', label: 'Key Contacts', icon: Users },
] as const

type TabId = (typeof tabs)[number]['id']

interface CampaignTabsProps {
  campaignId: string
}

export function CampaignTabs({ campaignId }: CampaignTabsProps) {
  const [active, setActive] = useState<TabId>('entreprises')

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
      {active === 'entreprises' && <CompaniesTable campaignId={campaignId} />}
      {active === 'matching' && <MatchingTable campaignId={campaignId} />}
      {active === 'contacts' && <ContactsTable campaignId={campaignId} />}
    </div>
  )
}
