/**
 * Apify — pipeline d'enrichissement contacts
 * https://apify.com/
 *
 * Étape 2 : URL LinkedIn entreprise → key personas (nom, prénom, titre, linkedin_profile_url)
 * Étape 3 : prénom + nom + company_linkedin_url + contact_linkedin_url → email
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

/**
 * Étape 2 — Company LinkedIn URL → key contacts (C-level, VP, Director…)
 * Actor : curious_coder/linkedin-company-employees-scraper
 */
const LINKEDIN_COMPANY_PEOPLE_ACTOR = 'curious_coder/linkedin-company-employees-scraper'

/**
 * Étape 3 — first_name + last_name + company_linkedin_url + contact_linkedin_url → email
 * Actor : danek/email-finder-linkedin (ou équivalent)
 */
const EMAIL_FINDER_ACTOR = 'danek/email-finder-linkedin'

// ── Core Apify runner ────────────────────────────────────────────────────────

async function runApifyActor<T>(
  actorId: string,
  input: Record<string, unknown>,
  timeoutSeconds = 120
): Promise<T[]> {
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
      body: JSON.stringify({ input, timeout: timeoutSeconds }),
    }
  )

  if (!runRes.ok) {
    const text = await runRes.text()
    throw new Error(`[Apify] Failed to start actor ${actorId}: ${runRes.status} ${text}`)
  }

  const runData = await runRes.json()
  const runId: string | undefined = runData?.data?.id
  if (!runId) throw new Error('[Apify] No run ID returned')

  // Polling jusqu'à SUCCEEDED (timeout = timeoutSeconds + 30s marge)
  const maxAttempts = Math.ceil((timeoutSeconds + 30) / 3)
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000))

    const statusRes = await fetch(
      `${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/runs/${runId}?token=${apiToken}`
    )
    const statusData = await statusRes.json()
    const status: string = statusData?.data?.status

    if (status === 'SUCCEEDED') break
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`[Apify] Run ${runId} ended with status: ${status}`)
    }
  }

  // Récupérer les résultats depuis le dataset
  const datasetId: string | undefined = runData?.data?.defaultDatasetId
  if (!datasetId) return []

  const itemsRes = await fetch(
    `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${apiToken}&format=json`
  )
  if (!itemsRes.ok) return []

  return itemsRes.json()
}

// ── Étape 2 — Key personas depuis LinkedIn entreprise ────────────────────────

/**
 * À partir de l'URL LinkedIn de l'entreprise, retourne les key personas
 * (C-level, VP, Director, Head, Manager) avec leur profil LinkedIn.
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
        titleFilters: ['CEO', 'Founder', 'Co-Founder', 'COO', 'CMO', 'CTO', 'VP', 'Director', 'Head', 'Manager'],
      },
      180
    )

    return results.map((r) => ({
      first_name: String(r.firstName ?? r.first_name ?? ''),
      last_name: String(r.lastName ?? r.last_name ?? ''),
      full_name: String(r.fullName ?? r.name ?? ''),
      title: (r.title as string) ?? (r.headline as string) ?? null,
      department: (r.department as string) ?? null,
      seniority: (r.seniority as string) ?? null,
      linkedin_profile_url:
        (r.profileUrl as string) ??
        (r.linkedinUrl as string) ??
        (r.linkedin_profile_url as string) ??
        null,
      company_name: (r.companyName as string) ?? undefined,
    }))
  } catch (err) {
    console.error('[Apify] extractContactsFromLinkedIn error:', err)
    return []
  }
}

// ── Étape 3 — Email à partir des infos LinkedIn du contact ───────────────────

export interface ContactEmailInput {
  first_name: string
  last_name: string
  /** URL LinkedIn de l'entreprise (ex: linkedin.com/company/asos) */
  company_linkedin_url: string
  /** URL LinkedIn du profil contact (ex: linkedin.com/in/john-doe) */
  contact_linkedin_url: string
}

/**
 * À partir du prénom, nom, URL LinkedIn entreprise et URL LinkedIn contact,
 * retourne l'adresse email professionnelle du contact.
 */
export async function getEmailFromContact(params: ContactEmailInput): Promise<ApifyEnrichedContact> {
  try {
    const results = await runApifyActor<Record<string, unknown>>(
      EMAIL_FINDER_ACTOR,
      {
        firstName: params.first_name,
        lastName: params.last_name,
        companyLinkedinUrl: params.company_linkedin_url,
        linkedinProfileUrl: params.contact_linkedin_url,
      },
      60
    )

    const r = results[0] ?? {}
    return {
      email: (r.email as string) ?? null,
      phone: (r.phone as string) ?? (r.phoneNumber as string) ?? null,
      email_verified: Boolean(r.emailVerified ?? r.email_verified ?? false),
      source: 'apify:email-finder',
    }
  } catch (err) {
    console.error('[Apify] getEmailFromContact error:', err)
    return { email: null, phone: null, email_verified: false, source: 'apify_failed' }
  }
}

/**
 * @deprecated Utiliser getEmailFromContact() à la place
 */
export async function enrichContactFromLinkedIn(
  linkedinProfileUrl: string
): Promise<ApifyEnrichedContact> {
  return getEmailFromContact({
    first_name: '',
    last_name: '',
    company_linkedin_url: '',
    contact_linkedin_url: linkedinProfileUrl,
  })
}
