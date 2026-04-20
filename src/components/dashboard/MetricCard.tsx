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
  blue: 'text-[#0066FF] bg-[rgba(0,102,255,0.1)]',
  teal: 'text-[#00C2A8] bg-[rgba(0,194,168,0.1)]',
  amber: 'text-[#F59E0B] bg-[rgba(245,158,11,0.1)]',
  green: 'text-[#10B981] bg-[rgba(16,185,129,0.1)]',
}

export function MetricCard({ label, value, icon: Icon, trend, trendUp, accent = 'blue' }: MetricCardProps) {
  return (
    <div className="bg-[#162035] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className={cn('p-2 rounded-lg', accentColors[accent])}>
          <Icon className={cn('w-4 h-4', accentColors[accent].split(' ')[0])} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-white text-2xl font-bold font-mono">{value}</span>
        {trend && (
          <span className={cn('text-xs mb-0.5', trendUp ? 'text-[#10B981]' : 'text-[#EF4444]')}>
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
