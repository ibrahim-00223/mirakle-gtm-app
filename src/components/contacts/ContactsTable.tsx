'use client'

import { ExternalLink, Mail } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { cn, getMailStatusColor, getMailStatusLabel } from '@/lib/utils'

interface ContactsTableProps {
  campaignId?: string
  companyId?: string
}

export function ContactsTable({ campaignId, companyId }: ContactsTableProps) {
  const { data: contacts, isLoading } = useContacts({ campaignId, companyId })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-white/[0.03] rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!contacts?.length) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        Aucun contact identifié pour le moment.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {['Contact', 'Poste', 'Email', 'LinkedIn', 'Statut mail'].map((h) => (
              <th
                key={h}
                className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-3 first:pl-0 last:pr-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-3 py-3 first:pl-0">
                <span className="text-white font-medium">
                  {contact.first_name} {contact.last_name}
                </span>
              </td>
              <td className="px-3 py-3">
                <span className="text-slate-400 text-xs">{contact.title}</span>
              </td>
              <td className="px-3 py-3">
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-1 text-xs text-[#0066FF] hover:text-[#00C2A8] transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </td>
              <td className="px-3 py-3">
                {contact.linkedin_url ? (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    LinkedIn
                  </a>
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
              </td>
              <td className="px-3 py-3 last:pr-0">
                <span
                  className={cn(
                    'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    getMailStatusColor(contact.mail_status)
                  )}
                >
                  {getMailStatusLabel(contact.mail_status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
