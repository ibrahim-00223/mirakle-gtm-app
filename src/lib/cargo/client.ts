/**
 * Cargo AI — enrichissement LinkedIn d'entreprises
 * https://www.getcargo.ai/
 *
 * Étape 1 du pipeline d'enrichissement :
 * domaine → URL LinkedIn de l'entreprise
 */

export interface CargoEnrichmentResult {
  linkedin_company_url: string | null
  company_name?: string
  domain?: string
  enriched: boolean
}

export async function getLinkedInUrlFromCargo(domain: string): Promise<CargoEnrichmentResult> {
  const apiKey = process.env.CARGO_API_KEY
  if (!apiKey) {
    console.warn('[Cargo] CARGO_API_KEY not configured — skipping enrichment')
    return { linkedin_company_url: null, enriched: false }
  }

  try {
    const res = await fetch('https://api.getcargo.io/v1/enrich/company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ domain }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[Cargo] Enrichment failed for ${domain}: ${res.status} ${text}`)
      return { linkedin_company_url: null, enriched: false }
    }

    const data = await res.json()

    return {
      linkedin_company_url: data?.linkedin_url ?? data?.linkedin_company_url ?? null,
      company_name: data?.name,
      domain,
      enriched: !!data?.linkedin_url || !!data?.linkedin_company_url,
    }
  } catch (err) {
    console.error(`[Cargo] Error enriching ${domain}:`, err)
    return { linkedin_company_url: null, enriched: false }
  }
}
