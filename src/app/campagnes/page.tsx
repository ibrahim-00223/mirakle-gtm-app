'use client'

import { useState } from 'react'
import { Plus, Search, Trash2, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useCampaigns } from '@/hooks/useCampaigns'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { CampaignStatusBadge } from '@/components/campaigns/CampaignStatusBadge'
import type { CampaignStatus } from '@/types'

const STATUS_FILTERS: { value: CampaignStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'generating', label: 'Génération' },
  { value: 'ready', label: 'Prête' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Pausée' },
  { value: 'completed', label: 'Terminée' },
]

export default function CampagnesPage() {
  const { data: campaigns, isLoading } = useCampaigns()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')

  const filtered = (campaigns ?? []).filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#03182F]">Campagnes</h1>
          <p className="text-sm text-[#30373E]/60 mt-1">
            {(campaigns ?? []).length} campagne{(campaigns ?? []).length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/campagnes/nouvelle"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2764FF] text-white text-sm font-semibold rounded-xl hover:bg-[#1a4fd8] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#30373E]/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une campagne…"
            className="pl-8 pr-3 py-2 text-sm bg-white border border-[#03182F]/15 rounded-xl focus:outline-none focus:border-[#2764FF] text-[#03182F] placeholder:text-[#30373E]/30 w-64"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-white border border-[#03182F]/10 rounded-xl p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                statusFilter === f.value
                  ? 'bg-[#2764FF] text-white'
                  : 'text-[#30373E]/60 hover:bg-[#F2F8FF]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-white border border-[#03182F]/8 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[#30373E]/40">
          <p className="text-base mb-2">
            {search || statusFilter !== 'all' ? 'Aucune campagne trouvée' : 'Aucune campagne'}
          </p>
          {!search && statusFilter === 'all' && (
            <Link href="/campagnes/nouvelle" className="text-sm text-[#2764FF] hover:underline">
              Créer votre première campagne
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((campaign) => (
            <div key={campaign.id} className="relative group">
              <CampaignCard campaign={campaign} />
              {/* Actions hover overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/campagnes/${campaign.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 bg-white border border-[#03182F]/10 rounded-lg text-[#30373E]/60 hover:text-[#2764FF] hover:border-[#2764FF]/30 transition-colors shadow-sm"
                  title="Modifier"
                >
                  <Pencil className="w-3 h-3" />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    if (confirm(`Supprimer la campagne "${campaign.name}" ?`)) {
                      // TODO: delete mutation
                    }
                  }}
                  className="p-1.5 bg-white border border-[#03182F]/10 rounded-lg text-[#30373E]/60 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                  title="Supprimer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
