import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CampaignCreateForm } from '@/components/campaigns/CampaignCreateForm'

export default function NouvelleCampagnePage() {
  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/campagnes"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-sm transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux campagnes
        </Link>
        <h1 className="text-2xl font-bold text-white font-heading">Nouvelle campagne</h1>
        <p className="text-slate-500 text-sm mt-1">
          Définissez les paramètres de ciblage — Mirakl génèrera automatiquement les prospects correspondants.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-[#162035] border border-white/[0.06] rounded-2xl p-6">
        <CampaignCreateForm />
      </div>
    </div>
  )
}
