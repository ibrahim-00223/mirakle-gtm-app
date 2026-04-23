import * as cheerio from 'cheerio'
import { unlockUrl } from '../client'

export interface CompanyProfile {
  name: string | null
  description: string | null
  linkedin_url: string | null
  country_code: string | null
  tech_stack: string[]
  employee_count_approx: number | null
}

const TECH_SIGNATURES: [RegExp, string][] = [
  [/shopify/i, 'Shopify'],
  [/woocommerce/i, 'WooCommerce'],
  [/magento/i, 'Magento'],
  [/prestashop/i, 'PrestaShop'],
  [/salesforce/i, 'Salesforce'],
  [/hubspot/i, 'HubSpot'],
  [/klaviyo/i, 'Klaviyo'],
  [/zendesk/i, 'Zendesk'],
  [/stripe/i, 'Stripe'],
  [/intercom/i, 'Intercom'],
  [/segment/i, 'Segment'],
  [/google-analytics|googletagmanager/i, 'Google Analytics'],
  [/facebook\.net\/en_US\/fbevents/i, 'Meta Pixel'],
]

function parseTechStack(html: string): string[] {
  const found = new Set<string>()
  for (const [pattern, name] of TECH_SIGNATURES) {
    if (pattern.test(html)) found.add(name)
  }
  return [...found]
}

function parseEmployeeCount(text: string): number | null {
  const match = text.match(/(\d[\d\s,]*)\s*(employees?|salariés?|collaborateurs?|membres?)/i)
  if (!match) return null
  return parseInt(match[1].replace(/[\s,]/g, ''), 10)
}

export async function enrichCompanyFromWebsite(websiteUrl: string): Promise<CompanyProfile> {
  let html: string
  try {
    html = await unlockUrl(websiteUrl)
  } catch {
    return { name: null, description: null, linkedin_url: null, country_code: null, tech_stack: [], employee_count_approx: null }
  }

  const $ = cheerio.load(html)

  const name =
    $('meta[property="og:site_name"]').attr('content') ||
    $('title').text().split(/[-|]/)[0].trim() ||
    null

  const description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    null

  // Find LinkedIn link anywhere on the page
  let linkedin_url: string | null = null
  $('a[href*="linkedin.com/company"], a[href*="linkedin.com/in"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href && !linkedin_url) linkedin_url = href
  })

  const bodyText = $('body').text()
  const employee_count_approx = parseEmployeeCount(bodyText)
  const tech_stack = parseTechStack(html)

  return {
    name,
    description: description?.slice(0, 500) ?? null,
    linkedin_url,
    country_code: null,
    tech_stack,
    employee_count_approx,
  }
}

export async function findContactsOnWebsite(
  websiteUrl: string
): Promise<Array<{ first_name: string; last_name: string; title: string | null; email: string | null; linkedin_url: string | null }>> {
  // Try /about, /team, /equipe pages
  const pagesToTry = [
    `${websiteUrl.replace(/\/$/, '')}/about`,
    `${websiteUrl.replace(/\/$/, '')}/team`,
    `${websiteUrl.replace(/\/$/, '')}/equipe`,
    `${websiteUrl.replace(/\/$/, '')}/about-us`,
  ]

  const contacts: Array<{ first_name: string; last_name: string; title: string | null; email: string | null; linkedin_url: string | null }> = []

  for (const pageUrl of pagesToTry) {
    let html: string
    try {
      html = await unlockUrl(pageUrl)
    } catch {
      continue
    }

    const $ = cheerio.load(html)

    // Look for email addresses in the page source
    const emailMatches = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []
    const emails = [...new Set(emailMatches)].filter(
      (e) => !e.includes('example') && !e.includes('domain') && !e.includes('email@')
    )

    // Look for person cards (team members)
    $('[class*="team"], [class*="person"], [class*="member"], [class*="staff"]').each((_, el) => {
      const nameText = $(el).find('h2, h3, h4, strong, [class*="name"]').first().text().trim()
      const titleText = $(el).find('p, span, [class*="title"], [class*="role"], [class*="position"]').first().text().trim()
      const linkedin = $(el).find('a[href*="linkedin.com"]').first().attr('href') || null

      if (!nameText || nameText.length < 3) return

      const parts = nameText.split(/\s+/)
      if (parts.length < 2) return

      contacts.push({
        first_name: parts[0],
        last_name: parts.slice(1).join(' '),
        title: titleText || null,
        email: emails[0] ?? null,
        linkedin_url: linkedin,
      })
    })

    // If we found people, stop searching other pages
    if (contacts.length > 0) break
  }

  return contacts.slice(0, 10)
}
