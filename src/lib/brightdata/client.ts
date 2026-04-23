/**
 * Bright Data Web Unlocker client.
 * Sends any URL through Bright Data's anti-bot infrastructure and returns
 * the raw HTML (or parsed JSON for API endpoints).
 *
 * Env vars required:
 *   BRIGHTDATA_API_TOKEN  — Bearer token from Bright Data dashboard
 *   BRIGHTDATA_ZONE       — Web Unlocker zone name (e.g. "web_unlocker1")
 */

const BRIGHTDATA_API = 'https://api.brightdata.com/request'

function getConfig() {
  const token = process.env.BRIGHTDATA_API_TOKEN
  const zone = process.env.BRIGHTDATA_ZONE
  if (!token || !zone) return null
  return { token, zone }
}

export async function unlockUrl(url: string): Promise<string> {
  const config = getConfig()

  if (!config) {
    throw new Error('Bright Data not configured (BRIGHTDATA_API_TOKEN / BRIGHTDATA_ZONE missing)')
  }

  const res = await fetch(BRIGHTDATA_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      zone: config.zone,
      url,
      format: 'raw',
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Bright Data error ${res.status}: ${body}`)
  }

  return res.text()
}

export async function unlockJson<T = unknown>(url: string): Promise<T> {
  const html = await unlockUrl(url)
  return JSON.parse(html) as T
}

export function isBrightDataConfigured(): boolean {
  return !!getConfig()
}
