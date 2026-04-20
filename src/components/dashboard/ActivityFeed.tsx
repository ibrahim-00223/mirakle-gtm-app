import { CheckCircle, Mail, TrendingUp, Target, Clock } from 'lucide-react'
import { formatRelativeDate } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'qualified' | 'disqualified' | 'mail_sent' | 'mail_replied' | 'campaign_ready'
  text: string
  time: string
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'mail_replied',
    text: 'Léa Bernard (GreenBeauty) a répondu à votre mail',
    time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'qualified',
    text: 'StyleLab Paris qualifiée dans "Mode Femme SS25"',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'mail_sent',
    text: '31 mails envoyés pour "Beauté Naturelle Q2"',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 3600000).toISOString(),
  },
  {
    id: '4',
    type: 'campaign_ready',
    text: '"Mode Femme SS25" prête — 18 entreprises, 42 contacts',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 7200000).toISOString(),
  },
  {
    id: '5',
    type: 'mail_replied',
    text: 'Alexandre Leroy (TechZone) a répondu à votre mail',
    time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const icons = {
  qualified: { Icon: CheckCircle, color: 'text-[#00C2A8]' },
  disqualified: { Icon: TrendingUp, color: 'text-[#EF4444]' },
  mail_sent: { Icon: Mail, color: 'text-[#0066FF]' },
  mail_replied: { Icon: Mail, color: 'text-[#10B981]' },
  campaign_ready: { Icon: Target, color: 'text-[#F59E0B]' },
}

export function ActivityFeed() {
  return (
    <div className="bg-[#162035] border border-white/[0.06] rounded-xl p-5">
      <h3 className="text-white font-semibold font-heading text-sm mb-4">Activité récente</h3>
      <div className="space-y-3">
        {mockActivity.map((item) => {
          const { Icon, color } = icons[item.type]
          return (
            <div key={item.id} className="flex items-start gap-3">
              <div className="mt-0.5">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-xs leading-relaxed">{item.text}</p>
                <div className="flex items-center gap-1 mt-0.5 text-slate-600 text-[10px]">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{formatRelativeDate(item.time)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
