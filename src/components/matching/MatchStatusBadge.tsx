import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { CompanyStatus } from '@/types'

interface MatchStatusBadgeProps {
  status: CompanyStatus
  score?: number | null
  threshold?: number
  size?: 'sm' | 'md'
}

export function MatchStatusBadge({
  status,
  score,
  threshold = 60,
  size = 'md',
}: MatchStatusBadgeProps) {
  const isMatched = status === 'qualified' || (status === 'pending' && (score ?? 0) >= threshold)
  const isPending = status === 'pending'

  const sizeClasses = size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'

  if (status === 'qualified' || isMatched) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-semibold border',
          'text-emerald-700 bg-emerald-50 border-emerald-200',
          sizeClasses
        )}
      >
        <CheckCircle2 className={iconSize} />
        Matched
      </span>
    )
  }

  if (status === 'disqualified') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-semibold border',
          'text-[#770031] bg-[#FFE7EC] border-[#F22E75]/30',
          sizeClasses
        )}
      >
        <XCircle className={iconSize} />
        Not Matched
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold border',
        'text-[#30373E]/60 bg-[#F2F8FF] border-[#03182F]/10',
        sizeClasses
      )}
    >
      <Clock className={iconSize} />
      En attente
    </span>
  )
}
