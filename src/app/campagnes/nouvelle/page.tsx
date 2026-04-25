import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CampaignCreateForm } from '@/components/campaigns/CampaignCreateForm'

export default function NouvelleCampagnePage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/campagnes"
        className="inline-flex items-center gap-1.5 text-xs text-[#30373E]/50 hover:text-[#30373E] transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour aux campagnes
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#03182F]">Nouvelle campagne</h1>
        <p className="text-sm text-[#30373E]/60 mt-1">
          Configurez votre campagne de prospection Mirakl
        </p>
      </div>

      <CampaignCreateForm />
    </div>
  )
}
