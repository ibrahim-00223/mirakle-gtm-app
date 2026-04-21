import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  accent?: 'blue' | 'teal' | 'amber' | 'green'
}

const accentColors = {
  blue: 'text-[#2764FF] bg-[rgba(39,100,255,0.1)]',
  teal: 'text-[#F22E75] bg-[#FFE7EC]',
  amber: 'text-[#770031] bg-[#FFE7EC]',
  green: 'text-[#2764FF] bg-[rgba(39,100,255,0.08)]',
}

export function MetricCard({ label, value, icon: Icon, trend, trendUp, accent = 'blue' }: MetricCardProps) {
  return (
    <div className="bg-white border border-[#03182F]/10 rounded-lg p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#30373E]/60 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className={cn('p-2 rounded-lg', accentColors[accent])}>
          <Icon className={cn('w-4 h-4', accentColors[accent].split(' ')[0])} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[#03182F] text-2xl font-bold">{value}</span>
        {trend && (
          <span className={cn('text-xs mb-0.5', trendUp ? 'text-[#2764FF]' : 'text-[#F22E75]')}>
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
