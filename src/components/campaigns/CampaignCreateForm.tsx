'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateCampaign } from '@/hooks/useCampaigns'
import type { CreateCampaignInput, CatalogSize, EmailTone, CampaignMode } from '@/types'
import { cn } from '@/lib/utils'

// ── Static options ─────────────────────────────────────────────────────────

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

const regions = ['France', 'Allemagne', 'Espagne', 'Italie', 'UK', 'Benelux', 'Europe du Nord']

// ── Shared style tokens ─────────────────────────────────────────────────────

const inputClass =
  'w-full bg-white border border-[#03182F]/15 rounded-lg px-3.5 py-2.5 text-[#03182F] text-sm placeholder-[#30373E]/40 focus:outline-none focus:border-[#2764FF]/60 transition-all'
const selectClass =
  'w-full bg-white border border-[#03182F]/15 rounded-lg px-3.5 py-2.5 text-[#03182F] text-sm focus:outline-none focus:border-[#2764FF]/60 transition-all appearance-none'
const labelClass =
  'block text-[#30373E]/60 text-xs font-medium mb-1.5 uppercase tracking-wider'

// ── Initial form state ──────────────────────────────────────────────────────

function defaultForm(): CreateCampaignInput {
  return {
    name: '',
    sector: '',
    mode: 'marketplace',
    source_marketplace_name: '',
    catalog_size: 'medium',
    tone: 'consultative',
    target_regions: [],
    icp: {
      target_marketplace_criteria: {},
      target_seller_criteria: {},
      min_match_score_threshold: 60,
      geography_filter: [],
      revenue_range_min_eur: null,
      revenue_range_max_eur: null,
      employee_count_min: null,
      employee_count_max: null,
      preferred_categories: [],
      excluded_categories: [],
    },
  }
}

// ── Step 1 — Mode selection ─────────────────────────────────────────────────

function Step1Mode({
  mode,
  onChange,
}: {
  mode: CampaignMode
  onChange: (m: CampaignMode) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-[#30373E]/60 text-sm">
        Comment souhaitez-vous cibler vos prospects ?
      </p>
      <div className="grid grid-cols-2 gap-4">
        {/* Marketplace card */}
        <button
          type="button"
          onClick={() => onChange('marketplace')}
          className={cn(
            'text-left p-5 rounded-xl border-2 transition-all',
            mode === 'marketplace'
              ? 'border-[#2764FF] bg-[rgba(39,100,255,0.05)]'
              : 'border-[#03182F]/12 bg-white hover:border-[#03182F]/25'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                mode === 'marketplace' ? 'border-[#2764FF]' : 'border-[#03182F]/25'
              )}
            >
              {mode === 'marketplace' && <div className="w-2 h-2 rounded-full bg-[#2764FF]" />}
            </div>
            <div>
              <p className="text-[#03182F] text-sm font-semibold mb-1">À partir d'une marketplace</p>
              <p className="text-[#30373E]/55 text-xs leading-relaxed">
                Scrape les sellers d'une marketplace existante (ASOS, Zalando, Amazon…) et trouve ceux qui pourraient rejoindre Mirakl.
              </p>
            </div>
          </div>
        </button>

        {/* ICP card */}
        <button
          type="button"
          onClick={() => onChange('icp')}
          className={cn(
            'text-left p-5 rounded-xl border-2 transition-all',
            mode === 'icp'
              ? 'border-[#2764FF] bg-[rgba(39,100,255,0.05)]'
              : 'border-[#03182F]/12 bg-white hover:border-[#03182F]/25'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                mode === 'icp' ? 'border-[#2764FF]' : 'border-[#03182F]/25'
              )}
            >
              {mode === 'icp' && <div className="w-2 h-2 rounded-full bg-[#2764FF]" />}
            </div>
            <div>
              <p className="text-[#03182F] text-sm font-semibold mb-1">À partir d'un segment ICP</p>
              <p className="text-[#30373E]/55 text-xs leading-relaxed">
                Définis un profil de seller cible. L'agent IA cherche les sellers ET les marketplaces pertinentes sur le web.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

// ── Step 2a — Marketplace config ────────────────────────────────────────────

function Step2Marketplace({
  form,
  setForm,
}: {
  form: CreateCampaignInput
  setForm: (f: CreateCampaignInput) => void
}) {
  const toggleRegion = (r: string) => {
    const current = form.target_regions ?? []
    setForm({
      ...form,
      target_regions: current.includes(r) ? current.filter((x) => x !== r) : [...current, r],
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>
          Nom de la campagne <span className="text-[#F22E75]">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: Mode Femme SS25 — ASOS"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Marketplace source <span className="text-[#F22E75]">*</span>
          </label>
          <input
            type="text"
            value={form.source_marketplace_name ?? ''}
            onChange={(e) => setForm({ ...form, source_marketplace_name: e.target.value })}
            placeholder="Ex: ASOS, Zalando, Amazon FR"
            className={inputClass}
          />
        </div>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div>
        <label className={labelClass}>Régions cibles</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {regions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRegion(r)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                (form.target_regions ?? []).includes(r)
                  ? 'bg-[#2764FF] text-white border-[#2764FF]'
                  : 'bg-white text-[#30373E]/60 border-[#03182F]/15 hover:border-[#03182F]/30'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 2b — ICP config ─────────────────────────────────────────────────────

function Step2ICP({
  form,
  setForm,
}: {
  form: CreateCampaignInput
  setForm: (f: CreateCampaignInput) => void
}) {
  const icp = form.icp!
  const toggleRegion = (r: string) => {
    const current = icp.geography_filter ?? []
    setForm({
      ...form,
      icp: {
        ...icp,
        geography_filter: current.includes(r) ? current.filter((x) => x !== r) : [...current, r],
      },
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>
          Nom de la campagne <span className="text-[#F22E75]">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: Sellers Mode Europe Q2"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label className={labelClass}>Score match minimum</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={40}
              max={90}
              step={5}
              value={icp.min_match_score_threshold ?? 60}
              onChange={(e) =>
                setForm({ ...form, icp: { ...icp, min_match_score_threshold: Number(e.target.value) } })
              }
              className="flex-1 accent-[#2764FF]"
            />
            <span className="text-[#2764FF] font-semibold text-sm w-8">
              {icp.min_match_score_threshold ?? 60}%
            </span>
          </div>
        </div>
      </div>

      {/* Revenue range */}
      <div>
        <label className={labelClass}>Chiffre d'affaires annuel (€)</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Min (ex: 500000)"
            value={icp.revenue_range_min_eur ?? ''}
            onChange={(e) =>
              setForm({ ...form, icp: { ...icp, revenue_range_min_eur: e.target.value ? Number(e.target.value) : null } })
            }
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Max (ex: 10000000)"
            value={icp.revenue_range_max_eur ?? ''}
            onChange={(e) =>
              setForm({ ...form, icp: { ...icp, revenue_range_max_eur: e.target.value ? Number(e.target.value) : null } })
            }
            className={inputClass}
          />
        </div>
      </div>

      {/* Employee range */}
      <div>
        <label className={labelClass}>Nombre d'employés</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Min (ex: 10)"
            value={icp.employee_count_min ?? ''}
            onChange={(e) =>
              setForm({ ...form, icp: { ...icp, employee_count_min: e.target.value ? Number(e.target.value) : null } })
            }
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Max (ex: 500)"
            value={icp.employee_count_max ?? ''}
            onChange={(e) =>
              setForm({ ...form, icp: { ...icp, employee_count_max: e.target.value ? Number(e.target.value) : null } })
            }
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div>
        <label className={labelClass}>Zones géographiques</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {regions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRegion(r)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                (icp.geography_filter ?? []).includes(r)
                  ? 'bg-[#2764FF] text-white border-[#2764FF]'
                  : 'bg-white text-[#30373E]/60 border-[#03182F]/15 hover:border-[#03182F]/30'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 3 — Summary + Launch ───────────────────────────────────────────────

function Step3Launch({ form }: { form: CreateCampaignInput }) {
  const sectorLabel = sectors.find((s) => s.value === form.sector)?.label ?? form.sector
  const catalogLabel = catalogSizes.find((s) => s.value === form.catalog_size)?.label ?? ''
  const toneLabel = tones.find((t) => t.value === form.tone)?.label ?? ''

  const rows =
    form.mode === 'marketplace'
      ? [
          ['Mode', 'Marketplace source'],
          ['Marketplace', form.source_marketplace_name ?? '—'],
          ['Secteur', sectorLabel],
          ['Catalogue cible', catalogLabel],
          ['Ton du mail', toneLabel],
          ['Régions', (form.target_regions ?? []).join(', ') || 'Toutes'],
        ]
      : [
          ['Mode', 'Segment ICP'],
          ['Secteur', sectorLabel],
          ['CA min', form.icp?.revenue_range_min_eur ? `${form.icp.revenue_range_min_eur.toLocaleString('fr')} €` : '—'],
          ['CA max', form.icp?.revenue_range_max_eur ? `${form.icp.revenue_range_max_eur.toLocaleString('fr')} €` : '—'],
          ['Employés', form.icp?.employee_count_min || form.icp?.employee_count_max ? `${form.icp?.employee_count_min ?? '?'} – ${form.icp?.employee_count_max ?? '?'}` : '—'],
          ['Score min', `${form.icp?.min_match_score_threshold ?? 60}%`],
          ['Régions', (form.icp?.geography_filter ?? []).join(', ') || 'Toutes'],
          ['Ton du mail', toneLabel],
        ]

  return (
    <div className="space-y-5">
      <div className="bg-[#F2F8FF] rounded-xl p-5 border border-[#2764FF]/15">
        <p className="text-[#03182F] font-semibold text-sm mb-3">{form.name}</p>
        <dl className="space-y-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-xs">
              <dt className="text-[#30373E]/50 font-medium">{k}</dt>
              <dd className="text-[#03182F] font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex items-start gap-3 bg-white border border-[#03182F]/10 rounded-xl p-4">
        <div className="w-8 h-8 rounded-lg bg-[rgba(39,100,255,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm">🤖</span>
        </div>
        <div>
          <p className="text-[#03182F] text-sm font-medium mb-0.5">Agent IA + Bright Data</p>
          <p className="text-[#30373E]/55 text-xs leading-relaxed">
            Un agent IA va scraper le web en contournant automatiquement les anti-bots pour trouver les sellers, enrichir leurs profils et extraire les contacts clés.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Wizard shell ─────────────────────────────────────────────────────────────

const STEPS = ['Mode', 'Paramètres', 'Lancer']

export function CampaignCreateForm() {
  const router = useRouter()
  const { mutateAsync, isPending } = useCreateCampaign()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<CreateCampaignInput>(defaultForm())
  const [error, setError] = useState<string | null>(null)

  const canNext = () => {
    if (step === 0) return true
    if (step === 1) {
      if (!form.name || !form.sector) return false
      if (form.mode === 'marketplace' && !form.source_marketplace_name) return false
      return true
    }
    return true
  }

  const handleNext = () => {
    if (!canNext()) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setError(null)
    setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    setError(null)
    try {
      const campaign = await mutateAsync(form)
      router.push(`/campagnes/${campaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
                  i < step
                    ? 'bg-[#2764FF] text-white'
                    : i === step
                    ? 'bg-[#2764FF] text-white ring-4 ring-[rgba(39,100,255,0.15)]'
                    : 'bg-[#03182F]/10 text-[#30373E]/40'
                )}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-all',
                  i === step ? 'text-[#2764FF]' : i < step ? 'text-[#03182F]/60' : 'text-[#30373E]/35'
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('w-8 h-px mx-3', i < step ? 'bg-[#2764FF]/40' : 'bg-[#03182F]/10')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[280px]">
        {step === 0 && (
          <Step1Mode
            mode={form.mode}
            onChange={(m) => setForm({ ...form, mode: m })}
          />
        )}
        {step === 1 && form.mode === 'marketplace' && (
          <Step2Marketplace form={form} setForm={setForm} />
        )}
        {step === 1 && form.mode === 'icp' && (
          <Step2ICP form={form} setForm={setForm} />
        )}
        {step === 2 && <Step3Launch form={form} />}
      </div>

      {error && (
        <p className="text-[#770031] text-sm bg-[#FFE7EC] border border-[#F22E75]/30 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={step === 0 ? () => router.back() : () => { setStep((s) => s - 1); setError(null) }}
          className="px-4 py-2.5 text-sm text-[#30373E]/70 hover:text-[#03182F] border border-[#03182F]/15 rounded-lg hover:border-[#03182F]/30 transition-all"
        >
          {step === 0 ? 'Annuler' : '← Retour'}
        </button>

        {step < 2 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#2764FF] hover:bg-[#1a4fd8] rounded-lg transition-all"
          >
            Suivant →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#2764FF] hover:bg-[#1a4fd8] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Lancement...
              </>
            ) : (
              '🚀 Lancer le scraping'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
