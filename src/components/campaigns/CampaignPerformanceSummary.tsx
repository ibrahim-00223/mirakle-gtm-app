import { Building2, Users, Target, Mail, TrendingUp } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import type { Campaign } from '@/types'

interface CampaignPerformanceSummaryProps {
  campaign: Campaign
  openRate?: number
  replyRate?: number
}

export function CampaignPerformanceSummary({
  campaign,
  openRate = 0,
  replyRate = 0,
}: CampaignPerformanceSummaryProps) {
  const matchRate =
    campaign.company_count > 0
      ? Math.round((campaign.qualified_count / campaign.company_count) * 100)
      : 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <MetricCard
        label="Entreprises identifiées"
        value={campaign.company_count}
        icon={Building2}
        accent="blue"
      />
      <MetricCard
        label="Contacts enrichis"
        value={campaign.contact_count}
        icon={Users}
        accent="green"
      />
      <MetricCard
        label="Matched"
        value={`${campaign.qualified_count} (${matchRate}%)`}
        icon={Target}
        accent="blue"
        trend={matchRate > 50 ? '↑ bon taux' : undefined}
        trendUp={matchRate > 50}
      />
      <MetricCard
        label="Open Rate"
        value={openRate > 0 ? `${openRate}%` : '—'}
        icon={Mail}
        accent="teal"
        trend={openRate > 25 ? '↑ au-dessus de la moyenne' : undefined}
        trendUp={openRate > 25}
      />
      <MetricCard
        label="Reply Rate"
        value={replyRate > 0 ? `${replyRate}%` : '—'}
        icon={TrendingUp}
        accent="amber"
        trend={replyRate > 5 ? '↑ bon taux' : undefined}
        trendUp={replyRate > 5}
      />
    </div>
  )
}
