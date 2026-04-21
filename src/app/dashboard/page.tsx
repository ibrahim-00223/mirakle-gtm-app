'use client'

import { BarChart2, Mail, TrendingUp, Target, Users } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import { ScoreBar } from '@/components/matching/ScoreBar'
import { formatDate, formatScore } from '@/lib/utils'
import { mockContacts } from '@/lib/mock/contacts'

export default function DashboardPage() {
  const { data: campaigns, isLoading } = useCampaigns()

  const totalSent = mockContacts.filter((c) => c.mail_status !== 'pending').length
  const totalOpened = mockContacts.filter((c) => ['opened', 'replied'].includes(c.mail_status)).length
  const totalReplied = mockContacts.filter((c) => c.mail_status === 'replied').length

  const openRate = totalSent ? Math.round((totalOpened / totalSent) * 100) : 0
  const replyRate = totalSent ? Math.round((totalReplied / totalSent) * 100) : 0
  const totalQualified = campaigns?.reduce((sum, c) => sum + c.qualified_count, 0) || 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[22px] leading-[32px] font-bold text-[#03182F]">Dashboard</h1>
        <p className="text-[#30373E]/60 text-sm mt-1">Performance globale de vos campagnes d'outreach</p>
      </div>

      {/* Global metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <MetricCard label="Mails envoyés" value={totalSent} icon={Mail} accent="blue" />
        <MetricCard label="Taux d'ouverture" value={`${openRate}%`} icon={TrendingUp} accent="amber" />
        <MetricCard label="Taux de réponse" value={`${replyRate}%`} icon={BarChart2} accent="green" />
        <MetricCard label="Comptes qualifiés" value={totalQualified} icon={Target} accent="teal" />
        <MetricCard label="Campagnes totales" value={campaigns?.length || 0} icon={Target} accent="blue" />
        <MetricCard
          label="Contacts total"
          value={campaigns?.reduce((s, c) => s + c.contact_count, 0) || 0}
          icon={Users}
          accent="amber"
        />
      </div>

      {/* Campaign performance table */}
      <div className="bg-white border border-[#03182F]/10 rounded-lg p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <h2 className="text-[18px] leading-[28px] font-bold text-[#03182F] mb-5">Performance par campagne</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-[#03182F]/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#03182F]/8">
                  {['Campagne', 'Statut', 'Entreprises', 'Qualifiés', 'Contacts', 'Score moy.', 'Créée le'].map(
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
                {campaigns?.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-[#F2F8FF] transition-colors">
                    <td className="px-3 py-4 first:pl-0">
                      <span className="text-[#03182F] font-medium">{campaign.name}</span>
                    </td>
                    <td className="px-3 py-4">
                      <CampaignStatusBadge status={campaign.status} />
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-[#30373E] text-sm">{campaign.company_count}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-[#2764FF] text-sm font-semibold">{campaign.qualified_count}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className="text-[#30373E] text-sm">{campaign.contact_count}</span>
                    </td>
                    <td className="px-3 py-4 w-40">
                      {campaign.avg_match_score ? (
                        <ScoreBar score={campaign.avg_match_score} size="sm" />
                      ) : (
                        <span className="text-[#30373E]/40 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-4 last:pr-0">
                      <span className="text-[#30373E]/50 text-xs">{formatDate(campaign.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
