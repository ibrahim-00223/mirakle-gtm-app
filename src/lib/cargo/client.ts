/**
 * Cargo AI — enrichissement via workflows Orchestration
 * https://docs.getcargo.ai/api-reference/orchestration--runs/create-run
 *
 * Variables d'environnement requises :
 *   CARGO_API_ENDPOINT       — ex: https://api.getcargo.io/v1
 *   CARGO_API_KEY            — Bearer token (Settings > API Tokens)
 *   CARGO_FIND_LINKEDIN_UUID — UUID du workflow "Find LinkedIn company URL"
 *   CARGO_FIND_EMAIL_UUID    — UUID du workflow "Find email"
 */

const BASE_URL = (process.env.CARGO_API_ENDPOINT ?? 'https://api.getcargo.io/v1').replace(/\/$/, '')

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.CARGO_API_KEY}`,
  }
}

// ── Core runner ───────────────────────────────────────────────────────────────

interface CargoRun {
  run: {
    uuid: string
    status: 'idle' | 'pending' | 'running' | 'success' | 'error' | 'cancelled' | 'skipped'
  }
  runContext?: Record<string, unknown>
  executions?: unknown[]
}

/**
 * Déclenche un workflow Cargo et attend son résultat (polling).
 * @returns runContext — objet contenant les sorties du workflow
 */
async function triggerAndWait(
  workflowUuid: string,
  data: Record<string, unknown>,
  timeoutMs = 60_000
): Promise<Record<string, unknown>> {
  const apiKey = process.env.CARGO_API_KEY
  if (!apiKey) {
    console.warn('[Cargo] CARGO_API_KEY not configured — skipping')
    return {}
  }
  if (!workflowUuid) {
    console.warn('[Cargo] workflowUuid not configured — skipping')
    return {}
  }

  // 1. Créer le run
  const createRes = await fetch(`${BASE_URL}/orchestration/runs`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ data, workflowUuid }),
  })

  if (!createRes.ok) {
    const text = await createRes.text()
    throw new Error(`[Cargo] Create run failed (${createRes.status}): ${text}`)
  }

  const created: CargoRun = await createRes.json()
  const runUuid = created.run?.uuid
  if (!runUuid) throw new Error('[Cargo] No run UUID in response')

  console.log(`[Cargo] Run created: ${runUuid} (workflow: ${workflowUuid})`)

  // 2. Polling jusqu'à success ou error
  const deadline = Date.now() + timeoutMs
  const POLL_INTERVAL = 2500

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))

    const statusRes = await fetch(`${BASE_URL}/orchestration/runs/${runUuid}`, {
      headers: headers(),
    })

    if (!statusRes.ok) {
      console.warn(`[Cargo] Poll failed (${statusRes.status}) — retrying`)
      continue
    }

    const body: CargoRun = await statusRes.json()
    const status = body.run?.status

    console.log(`[Cargo] Run ${runUuid} — status: ${status}`)

    if (status === 'success') {
      return (body.runContext ?? {}) as Record<string, unknown>
    }

    if (status === 'error' || status === 'cancelled' || status === 'skipped') {
      throw new Error(`[Cargo] Run ${runUuid} ended with status: ${status}`)
    }
  }

  throw new Error(`[Cargo] Run ${runUuid} timed out after ${timeoutMs / 1000}s`)
}

// ── Étape 2 — domain → LinkedIn company URL ──────────────────────────────────

export interface CargoLinkedInResult {
  linkedin_company_url: string | null
  enriched: boolean
}

/**
 * Appelle le workflow Cargo "Find LinkedIn company URL".
 * Input : { domain }
 * Output attendu dans runContext : { linkedinUrl, linkedin_url, linkedin_company_url… }
 */
export async function getLinkedInUrlFromCargo(domain: string): Promise<CargoLinkedInResult> {
  const workflowUuid = process.env.CARGO_FIND_LINKEDIN_UUID ?? ''

  try {
    const ctx = await triggerAndWait(workflowUuid, { domain }, 60_000)

    // Cargo peut retourner le champ sous différents noms selon la config du workflow
    const url =
      (ctx.linkedinUrl as string) ??
      (ctx.linkedin_url as string) ??
      (ctx.linkedin_company_url as string) ??
      (ctx.companyLinkedinUrl as string) ??
      null

    return { linkedin_company_url: url, enriched: !!url }
  } catch (err) {
    console.error(`[Cargo] getLinkedInUrlFromCargo error for "${domain}":`, err)
    return { linkedin_company_url: null, enriched: false }
  }
}

// ── Étape 3 — contact info → email ───────────────────────────────────────────

export interface CargoEmailResult {
  email: string | null
  email_verified: boolean
}

export interface CargoEmailInput {
  first_name: string
  last_name: string
  /** URL LinkedIn de l'entreprise */
  company_linkedin_url: string
  /** URL LinkedIn du profil contact */
  contact_linkedin_url: string
}

/**
 * Appelle le workflow Cargo "Find email".
 * Input : { firstName, lastName, companyLinkedinUrl, linkedinProfileUrl }
 * Output attendu dans runContext : { email, emailVerified… }
 */
export async function getEmailFromCargo(params: CargoEmailInput): Promise<CargoEmailResult> {
  const workflowUuid = process.env.CARGO_FIND_EMAIL_UUID ?? ''

  try {
    const ctx = await triggerAndWait(
      workflowUuid,
      {
        firstName: params.first_name,
        lastName: params.last_name,
        companyLinkedinUrl: params.company_linkedin_url,
        linkedinProfileUrl: params.contact_linkedin_url,
      },
      60_000
    )

    const email =
      (ctx.email as string) ??
      (ctx.emailAddress as string) ??
      (ctx.email_address as string) ??
      null

    const verified = Boolean(
      ctx.emailVerified ?? ctx.email_verified ?? ctx.verified ?? false
    )

    return { email, email_verified: verified }
  } catch (err) {
    console.error(`[Cargo] getEmailFromCargo error for "${params.first_name} ${params.last_name}":`, err)
    return { email: null, email_verified: false }
  }
}
