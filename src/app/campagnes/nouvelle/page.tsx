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
          className="inline-flex items-center gap-1.5 text-[#30373E]/60 hover:text-[#03182F] text-sm transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux campagnes
        </Link>
        <h1 className="text-[22px] leading-[32px] font-bold text-[#03182F]">Nouvelle campagne</h1>
        <p className="text-[#30373E]/60 text-sm mt-1">
          Définissez les paramètres de ciblage — Mirakl génèrera automatiquement les prospects correspondants.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white border border-[#03182F]/10 rounded-lg p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <CampaignCreateForm />
      </div>
    </div>
  )
}
