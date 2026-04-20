'use client'

import Link from 'next/link'
import { Plus, Target, Building2, Users, TrendingUp, Mail } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'

export default function HomePage() {
  const { data: campaigns, isLoading } = useCampaigns()

  const activeCampaigns = campaigns?.filter((c) => ['active', 'ready'].includes(c.status)) || []
  const totalCompanies = campaigns?.reduce((sum, c) => sum + c.company_count, 0) || 0
  const totalQualified = campaigns?.reduce((sum, c) => sum + c.qualified_count, 0) || 0
  const totalContacts = campaigns?.reduce((sum, c) => sum + c.contact_count, 0) || 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-heading">Bonjour, équipe BDR 👋</h1>
        <p className="text-slate-500 text-sm mt-1">
          Voici un résumé de vos activités sales en cours.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Campagnes actives"
          value={activeCampaigns.length}
          icon={Target}
          accent="blue"
        />
        <MetricCard
          label="Entreprises totales"
          value={totalCompanies}
          icon={Building2}
          accent="teal"
        />
        <MetricCard
          label="Comptes qualifiés"
          value={totalQualified}
          icon={TrendingUp}
          accent="green"
        />
        <MetricCard
          label="Contacts identifiés"
          value={totalContacts}
          icon={Users}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active campaigns */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold font-heading">Campagnes actives</h2>
            <Link href="/campagnes" className="text-[#0066FF] hover:text-[#00C2A8] text-xs transition-colors">
              Voir tout →
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-44 bg-white/[0.03] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : activeCampaigns.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCampaigns.slice(0, 4).map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          ) : (
            <div className="bg-[#162035] border border-white/[0.06] rounded-xl p-8 text-center">
              <Target className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-4">Aucune campagne active</p>
              <Link
                href="/campagnes/nouvelle"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold rounded-lg transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Créer une campagne
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex items-center gap-3 mt-4">
            <Link
              href="/campagnes/nouvelle"
              className="flex items-center gap-2 px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-semibold rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle campagne
            </Link>
            <Link
              href="/contacts"
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 text-xs font-medium rounded-lg transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              Voir les contacts
            </Link>
            <Link
              href="/entreprises"
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 text-xs font-medium rounded-lg transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              Toutes les entreprises
            </Link>
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
