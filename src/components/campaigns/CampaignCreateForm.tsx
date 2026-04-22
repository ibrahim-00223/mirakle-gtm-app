'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateCampaign } from '@/hooks/useCampaigns'
import type { CreateCampaignInput, CatalogSize, EmailTone } from '@/types'

const sectors = [
  { value: 'fashion', label: 'Mode' },
  { value: 'beauty', label: 'Beauté' },
  { value: 'home', label: 'Maison & Décoration' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'sport', label: 'Sport' },
  { value: 'food', label: 'Alimentation' },
  { value: 'toys', label: 'Jouets' },
  { value: 'automotive', label: 'Automobile' },
]

const catalogSizes: { value: CatalogSize; label: string }[] = [
  { value: 'small', label: 'Petit (< 500 SKUs)' },
  { value: 'medium', label: 'Moyen (500–5 000 SKUs)' },
  { value: 'large', label: 'Grand (> 5 000 SKUs)' },
]

const tones: { value: EmailTone; label: string }[] = [
  { value: 'consultative', label: 'Consultatif' },
  { value: 'direct', label: 'Direct' },
  { value: 'educational', label: 'Éducatif' },
  { value: 'luxury', label: 'Premium / Luxe' },
]

export function CampaignCreateForm() {
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateCampaign()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<CreateCampaignInput>({
    name: '',
    sector: '',
    mode: 'marketplace',
    source_marketplace_name: '',
    catalog_size: 'medium',
    tone: 'consultative',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name || !form.sector || !form.source_marketplace_name) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    try {
      const campaign = await mutateAsync(form)
      router.push(`/campagnes/${campaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    }
  }

  const inputClass =
    'w-full bg-white border border-[#03182F]/15 rounded-lg px-3.5 py-2.5 text-[#03182F] text-sm placeholder-[#30373E]/40 focus:outline-none focus:border-[#2764FF]/60 transition-all'

  const selectClass =
    'w-full bg-white border border-[#03182F]/15 rounded-lg px-3.5 py-2.5 text-[#03182F] text-sm focus:outline-none focus:border-[#2764FF]/60 transition-all appearance-none'

  const labelClass = 'block text-[#30373E]/60 text-xs font-medium mb-1.5 uppercase tracking-wider'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Campaign name */}
      <div>
        <label className={labelClass}>
          Nom de la campagne <span className="text-[#F22E75]">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: Mode Femme SS25"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sector */}
        <div>
          <label className={labelClass}>
            Secteur cible <span className="text-[#F22E75]">*</span>
          </label>
          <select
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
            className={selectClass}
          >
            <option value="">Choisir un secteur</option>
            {sectors.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Source marketplace */}
        <div>
          <label className={labelClass}>
            Marketplace source <span className="text-[#F22E75]">*</span>
          </label>
          <input
            type="text"
            value={form.source_marketplace_name}
            onChange={(e) => setForm({ ...form, source_marketplace_name: e.target.value })}
            placeholder="Ex: Amazon FR"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Catalog size */}
        <div>
          <label className={labelClass}>Taille catalogue cible</label>
          <select
            value={form.catalog_size}
            onChange={(e) => setForm({ ...form, catalog_size: e.target.value as CatalogSize })}
            className={selectClass}
          >
            {catalogSizes.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tone */}
        <div>
          <label className={labelClass}>Ton du mail</label>
          <select
            value={form.tone}
            onChange={(e) => setForm({ ...form, tone: e.target.value as EmailTone })}
            className={selectClass}
          >
            {tones.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-[#770031] text-sm bg-[#FFE7EC] border border-[#F22E75]/30 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-sm text-[#30373E]/70 hover:text-[#03182F] border border-[#03182F]/15 rounded-lg hover:border-[#03182F]/30 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-[#2764FF] hover:bg-[#1a4fd8] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
        >
          {isPending ? 'Création...' : 'Créer la campagne →'}
        </button>
      </div>
    </form>
  )
}
