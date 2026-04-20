import { cn, getCampaignStatusColor, getCampaignStatusLabel } from '@/lib/utils'
import type { CampaignStatus } from '@/types'

interface CampaignStatusBadgeProps {
  status: CampaignStatus
  className?: string
}

export function CampaignStatusBadge({ status, className }: CampaignStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        getCampaignStatusColor(status),
        className
      )}
    >
      {status === 'generating' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {getCampaignStatusLabel(status)}
    </span>
  )
}
