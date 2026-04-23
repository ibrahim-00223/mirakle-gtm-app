'use client'

import { useState } from 'react'
import { Users, Search, Mail, ExternalLink } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { cn, getMailStatusColor, getMailStatusLabel, formatDate } from '@/lib/utils'
import type { MailStatus, OutreachStatus, ContactWithOutreachContext } from '@/types'

const mailStatuses: { value: MailStatus | ''; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'Non envoyé' },
  { value: 'sent', label: 'Envoyé' },
  { value: 'opened', label: 'Ouvert' },
  { value: 'replied', label: 'Répondu' },
]

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [mailFilter, setMailFilter] = useState<MailStatus | ''>('')

  const { data: contacts, isLoading } = useContacts({
    outreachStatus: (mailFilter as OutreachStatus) || undefined,
  })

  const filtered = ((contacts || []) as ContactWithOutreachContext[]).filter((c) =>
    search
      ? `${c.first_name} ${c.last_name} ${c.title} ${c.email}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-[22px] leading-[32px] font-bold text-[#03182F]">Contacts</h1>
        <p className="text-[#30373E]/60 text-sm mt-1">
          Tous les prospects identifiés à travers vos campagnes
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#30373E]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un contact..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#03182F]/15 rounded-lg text-[#03182F] text-sm placeholder-[#30373E]/40 focus:outline-none focus:border-[#2764FF]/60 transition-all"
          />
        </div>
        <select
          value={mailFilter}
          onChange={(e) => setMailFilter(e.target.value as MailStatus | '')}
          className="bg-white border border-[#03182F]/15 rounded-lg px-3 py-2.5 text-[#03182F] text-sm focus:outline-none focus:border-[#2764FF]/60 transition-all"
        >
          {mailStatuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-[#30373E]/50 text-xs ml-auto">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#03182F]/10 rounded-lg p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#03182F]/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#03182F]/8">
                  {['Contact', 'Poste', 'Email', 'LinkedIn', 'Statut mail', 'Envoyé le', 'Ouvert le', 'Répondu le'].map(
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
                {filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-[#F2F8FF] transition-colors">
                    <td className="px-3 py-3 first:pl-0">
                      <span className="text-[#03182F] font-medium">
                        {contact.first_name} {contact.last_name}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[#30373E]/60 text-xs">{contact.title}</span>
                    </td>
                    <td className="px-3 py-3">
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 text-xs text-[#2764FF] hover:text-[#1a4fd8] transition-colors"
                        >
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-[#30373E]/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {contact.linkedin_url ? (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#30373E]/60 hover:text-[#03182F] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          LinkedIn
                        </a>
                      ) : (
                        <span className="text-[#30373E]/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          getMailStatusColor(contact.mail_status ?? contact.outreach_status)
                        )}
                      >
                        {getMailStatusLabel(contact.mail_status ?? contact.outreach_status)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[#30373E]/50 text-xs">{formatDate(contact.mail_sent_at ?? contact.sent_at)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[#30373E]/50 text-xs">{formatDate(contact.mail_opened_at ?? contact.opened_at)}</span>
                    </td>
                    <td className="px-3 py-3 last:pr-0">
                      <span className="text-[#30373E]/50 text-xs">{formatDate(contact.mail_replied_at ?? contact.replied_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-8 h-8 text-[#30373E]/30 mx-auto mb-3" />
            <p className="text-[#30373E]/60 text-sm">Aucun contact trouvé.</p>
          </div>
        )}
      </div>
    </div>
  )
}
