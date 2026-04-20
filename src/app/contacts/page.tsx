'use client'

import { useState } from 'react'
import { Users, Search, Mail, ExternalLink } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { cn, getMailStatusColor, getMailStatusLabel, formatDate } from '@/lib/utils'
import type { MailStatus } from '@/types'

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
    mailStatus: mailFilter || undefined,
  })

  const filtered = (contacts || []).filter((c) =>
    search
      ? `${c.first_name} ${c.last_name} ${c.title} ${c.email}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-heading">Contacts</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tous les prospects identifiés à travers vos campagnes
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un contact..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#0066FF]/60 transition-all"
          />
        </div>
        <select
          value={mailFilter}
          onChange={(e) => setMailFilter(e.target.value as MailStatus | '')}
          className="bg-[#0F1F3D] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#0066FF]/60 transition-all"
        >
          {mailStatuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-slate-600 text-xs ml-auto">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#162035] border border-white/[0.06] rounded-2xl p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/[0.03] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Contact', 'Poste', 'Email', 'LinkedIn', 'Statut mail', 'Envoyé le', 'Ouvert le', 'Répondu le'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-3 first:pl-0 last:pr-0"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((contact) => (
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
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          getMailStatusColor(contact.mail_status)
                        )}
                      >
                        {getMailStatusLabel(contact.mail_status)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-slate-500 text-xs">{formatDate(contact.mail_sent_at)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-slate-500 text-xs">{formatDate(contact.mail_opened_at)}</span>
                    </td>
                    <td className="px-3 py-3 last:pr-0">
                      <span className="text-slate-500 text-xs">{formatDate(contact.mail_replied_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Aucun contact trouvé.</p>
          </div>
        )}
      </div>
    </div>
  )
}
