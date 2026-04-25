import { Suspense } from 'react'
import { LayoutDashboard, Megaphone, Building2, Users, TrendingUp } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMockCampaigns } from '@/lib/mock/campaigns'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { formatScore, formatDate } from '@/lib/utils'
import Link from 'next/link'

async function getDashboardData() {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

  if (useMock) {
    const campaigns = getMockCampaigns()
    return {
      campaigns,
      metrics: {
        activeCampaigns: campaigns.filter((c) => c.status === 'active' || c.status === 'ready').length,
        totalCompanies: campaigns.reduce((s, c) => s + c.company_count, 0),
        totalContacts: campaigns.reduce((s, c) => s + c.contact_count, 0),
        avgMatchScore: Math.round(campaigns.reduce((s, c) => s + (c.avg_match_score ?? 0), 0) / campaigns.length),
        totalQualified: campaigns.reduce((s, c) => s + c.qualified_count, 0),
      },
    }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    const { data: allCampaigns } = await supabase.from('campaigns').select('status, company_count, contact_count, qualified_count, avg_match_score')

    const all = allCampaigns ?? []
    return {
      campaigns: campaigns ?? [],
      metrics: {
        activeCampaigns: all.filter((c) => c.status === 'active' || c.status === 'ready').length,
        totalCompanies: all.reduce((s: number, c: { company_count: number }) => s + (c.company_count ?? 0), 0),
        totalContacts: all.reduce((s: number, c: { contact_count: number }) => s + (c.contact_count ?? 0), 0),
        avgMatchScore: all.length ? Math.round(all.reduce((s: number, c: { avg_match_score: number | null }) => s + (c.avg_match_score ?? 0), 0) / all.length) : 0,
        totalQualified: all.reduce((s: number, c: { qualified_count: number }) => s + (c.qualified_count ?? 0), 0),
      },
    }
  } catch {
    return { campaigns: [], metrics: { activeCampaigns: 0, totalCompanies: 0, totalContacts: 0, avgMatchScore: 0, totalQualified: 0 } }
  }
}

export default async function DashboardPage() {
  const { campaigns, metrics } = await getDashboardData()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#03182F]">Dashboard</h1>
        <p className="text-sm text-[#30373E]/60 mt-1">Vue d&apos;ensemble de vos campagnes GTM</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard
          label="Campagnes actives"
          value={metrics.activeCampaigns}
          icon={Megaphone}
          accent="blue"
        />
        <MetricCard
          label="Sellers identifiés"
          value={metrics.totalCompanies}
          icon={Building2}
          accent="green"
        />
        <MetricCard
          label="Contacts enrichis"
          value={metrics.totalContacts}
          icon={Users}
          accent="blue"
        />
        <MetricCard
          label="Score match moyen"
          value={metrics.avgMatchScore > 0 ? `${metrics.avgMatchScore}/100` : '—'}
          icon={TrendingUp}
          accent="teal"
        />
        <MetricCard
          label="Sellers qualifiés"
          value={metrics.totalQualified}
          icon={LayoutDashboard}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent campaigns */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#03182F]">Campagnes récentes</h2>
            <Link
              href="/campagnes"
              className="text-xs text-[#2764FF] hover:text-[#1a4fd8] font-medium transition-colors"
            >
              Voir toutes →
            </Link>
          </div>
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-[#30373E]/40 text-sm bg-white border border-[#03182F]/8 rounded-xl">
                Aucune campagne. <Link href="/campagnes/nouvelle" className="text-[#2764FF]">Créer votre première campagne</Link>
              </div>
            ) : (
              campaigns.slice(0, 3).map((campaign) => (
                <Link key={campaign.id} href={`/campagnes/${campaign.id}`}>
                  <div className="bg-white border border-[#03182F]/10 rounded-xl p-4 hover:border-[#2764FF]/30 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-[#03182F] group-hover:text-[#2764FF] transition-colors">
                          {campaign.name}
                        </h3>
                        <p className="text-xs text-[#30373E]/50 mt-0.5">
                          {campaign.source_marketplace_name ?? campaign.sector}
                        </p>
                      </div>
                      <CampaignStatusBadge status={campaign.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#30373E]/60">
                      <span><strong className="text-[#03182F]">{campaign.company_count}</strong> sellers</span>
                      <span><strong className="text-[#03182F]">{campaign.contact_count}</strong> contacts</span>
                      {campaign.avg_match_score && (
                        <span><strong className="text-[#2764FF]">{formatScore(campaign.avg_match_score)}</strong> score moy.</span>
                      )}
                      <span className="ml-auto">{formatDate(campaign.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <h2 className="text-base font-bold text-[#03182F] mb-4">Activité récente</h2>
          <Suspense fallback={<div className="h-40 bg-white border border-[#03182F]/8 rounded-xl animate-pulse" />}>
            <ActivityFeed />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
