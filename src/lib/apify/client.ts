/**
 * Apify — extraction de contacts LinkedIn + enrichissement email/téléphone
 * https://apify.com/
 *
 * Étape 2 : URL LinkedIn entreprise → liste de contacts (avec profils)
 * Étape 3 : URL LinkedIn profil → email + téléphone
 */

export interface ApifyContact {
  first_name: string
  last_name: string
  full_name: string
  title: string | null
  department: string | null
  seniority: string | null
  linkedin_profile_url: string | null
  company_name?: string
}

export interface ApifyEnrichedContact {
  email: string | null
  phone: string | null
  email_verified: boolean
  source: string
}

const APIFY_API_BASE = 'https://api.apify.com/v2'

// Actor IDs Apify pour LinkedIn
const LINKEDIN_COMPANY_PEOPLE_ACTOR = 'curious_coder/linkedin-company-employees-scraper'
const LINKEDIN_PROFILE_ENRICHER_ACTOR = 'apimaestro/linkedin-profile-email-extractor'

async function runApifyActor<T>(actorId: string, input: Record<string, unknown>): Promise<T[]> {
  const apiToken = process.env.APIFY_API_TOKEN
  if (!apiToken) {
    console.warn('[Apify] APIFY_API_TOKEN not configured — skipping')
    return []
  }

  // Lancer le run
  const runRes = await fetch(
    `${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${apiToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    }
  )

  if (!runRes.ok) {
    const text = await runRes.text()
    throw new Error(`[Apify] Failed to start actor ${actorId}: ${runRes.status} ${text}`)
  }

  const runData = await runRes.json()
  const runId = runData?.data?.id

  if (!runId) throw new Error('[Apify] No run ID returned')

  // Attendre la fin du run (polling toutes les 3s, timeout 2min)
  const maxAttempts = 40
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000))

    const statusRes = await fetch(
      `${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/runs/${runId}?token=${apiToken}`
    )
    const statusData = await statusRes.json()
    const status = statusData?.data?.status

    if (status === 'SUCCEEDED') break
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`[Apify] Run ${runId} ended with status: ${status}`)
    }
  }

  // Récupérer les résultats
  const datasetId = runData?.data?.defaultDatasetId
  if (!datasetId) return []

  const itemsRes = await fetch(
    `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${apiToken}&format=json`
  )
  if (!itemsRes.ok) return []

  return itemsRes.json()
}

/**
 * Étape 2 — Extraire les contacts d'une entreprise via son URL LinkedIn
 */
export async function extractContactsFromLinkedIn(
  linkedinCompanyUrl: string,
  maxContacts = 20
): Promise<ApifyContact[]> {
  try {
    const results = await runApifyActor<Record<string, unknown>>(
      LINKEDIN_COMPANY_PEOPLE_ACTOR,
      {
        companyUrl: linkedinCompanyUrl,
        maxResults: maxContacts,
        // Filtrer les décideurs : C-level, VP, Director, Head
        titleFilters: ['CEO', 'Founder', 'Co-Founder', 'COO', 'CMO', 'VP', 'Director', 'Head', 'Manager'],
      }
    )

    return results.map((r) => ({
      first_name: (r.firstName as string) ?? (r.first_name as string) ?? '',
      last_name: (r.lastName as string) ?? (r.last_name as string) ?? '',
      full_name: (r.fullName as string) ?? (r.name as string) ?? '',
      title: (r.title as string) ?? (r.headline as string) ?? null,
      department: (r.department as string) ?? null,
      seniority: (r.seniority as string) ?? null,
      linkedin_profile_url: (r.profileUrl as string) ?? (r.linkedinUrl as string) ?? null,
      company_name: (r.companyName as string) ?? undefined,
    }))
  } catch (err) {
    console.error('[Apify] extractContactsFromLinkedIn error:', err)
    return []
  }
}

/**
 * Étape 3 — Enrichir un contact avec son email/téléphone à partir de son profil LinkedIn
 */
export async function enrichContactFromLinkedIn(
  linkedinProfileUrl: string
): Promise<ApifyEnrichedContact> {
  try {
    const results = await runApifyActor<Record<string, unknown>>(
      LINKEDIN_PROFILE_ENRICHER_ACTOR,
      { profileUrl: linkedinProfileUrl }
    )

    const r = results[0] ?? {}
    return {
      email: (r.email as string) ?? null,
      phone: (r.phone as string) ?? (r.phoneNumber as string) ?? null,
      email_verified: Boolean(r.emailVerified ?? r.email_verified ?? false),
      source: 'apify',
    }
  } catch (err) {
    console.error('[Apify] enrichContactFromLinkedIn error:', err)
    return { email: null, phone: null, email_verified: false, source: 'apify_failed' }
  }
}
