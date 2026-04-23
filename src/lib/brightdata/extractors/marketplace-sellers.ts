import * as cheerio from 'cheerio'
import { unlockUrl } from '../client'

export interface RawSeller {
  name: string
  website_url: string | null
  boutique_url: string | null
  categories: string[]
  country_code: string | null
  description: string | null
  sku_count_approx: number | null
}

// --- Adapter registry ---

type MarketplaceAdapter = {
  sellersUrl: (marketplaceName: string) => string
  extract: (html: string, baseUrl: string) => RawSeller[]
}

function extractAsosMarketplace(html: string): RawSeller[] {
  const $ = cheerio.load(html)
  const sellers: RawSeller[] = []

  // ASOS marketplace boutique cards
  $('[data-auto-id="boutique-card"], .boutique-item, article').each((_, el) => {
    const name = $(el).find('h2, h3, .boutique-name, [class*="name"]').first().text().trim()
    const href = $(el).find('a').first().attr('href') || null
    const desc = $(el).find('p, .description, [class*="desc"]').first().text().trim()

    if (!name) return

    sellers.push({
      name,
      website_url: null,
      boutique_url: href ? (href.startsWith('http') ? href : `https://marketplace.asos.com${href}`) : null,
      categories: [],
      country_code: null,
      description: desc || null,
      sku_count_approx: null,
    })
  })

  return sellers
}

function extractZalando(html: string): RawSeller[] {
  const $ = cheerio.load(html)
  const sellers: RawSeller[] = []

  // Zalando brand/seller listings
  $('[class*="brand"], [class*="Brand"], .catalog-brandList_item, li').each((_, el) => {
    const name = $(el).find('a, span, p').first().text().trim()
    const href = $(el).find('a').first().attr('href') || null
    if (!name || name.length < 2) return

    sellers.push({
      name,
      website_url: null,
      boutique_url: href ? (href.startsWith('http') ? href : `https://www.zalando.fr${href}`) : null,
      categories: ['fashion'],
      country_code: null,
      description: null,
      sku_count_approx: null,
    })
  })

  return sellers
}

function extractCdiscount(html: string): RawSeller[] {
  const $ = cheerio.load(html)
  const sellers: RawSeller[] = []

  $('[class*="marchand"], [class*="seller"], .merchant-item, .seller-card').each((_, el) => {
    const name = $(el).find('h2, h3, strong, .name').first().text().trim()
    const href = $(el).find('a').first().attr('href') || null
    if (!name) return

    sellers.push({
      name,
      website_url: null,
      boutique_url: href ? (href.startsWith('http') ? href : `https://www.cdiscount.com${href}`) : null,
      categories: [],
      country_code: 'FR',
      description: null,
      sku_count_approx: null,
    })
  })

  return sellers
}

// Generic extractor — scans for repetitive card/list patterns that look like seller directories
function extractGeneric(html: string, baseUrl: string): RawSeller[] {
  const $ = cheerio.load(html)
  const sellers: RawSeller[] = []
  const seen = new Set<string>()

  // Look for links in repeated structures (cards, list items)
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const name = $(el).text().trim()
    const parentText = $(el).parent().text().trim()

    // Skip nav links, short texts, duplicates
    if (!name || name.length < 3 || name.length > 80) return
    if (seen.has(name.toLowerCase())) return
    if (/^(accueil|home|menu|login|contact|about|faq|help)/i.test(name)) return

    const fullHref = href.startsWith('http') ? href : `${baseUrl}${href}`

    seen.add(name.toLowerCase())
    sellers.push({
      name,
      website_url: null,
      boutique_url: fullHref,
      categories: [],
      country_code: null,
      description: parentText !== name ? parentText.slice(0, 200) : null,
      sku_count_approx: null,
    })
  })

  // Return top 50 most likely sellers (sorted by link text length — longer = more descriptive)
  return sellers
    .sort((a, b) => (b.name.length - a.name.length))
    .slice(0, 50)
}

const ADAPTERS: Record<string, MarketplaceAdapter> = {
  asos: {
    sellersUrl: () => 'https://marketplace.asos.com/boutiques',
    extract: (html) => extractAsosMarketplace(html),
  },
  zalando: {
    sellersUrl: () => 'https://www.zalando.fr/nos-marques/',
    extract: (html) => extractZalando(html),
  },
  cdiscount: {
    sellersUrl: () => 'https://www.cdiscount.com/marchands/',
    extract: (html) => extractCdiscount(html),
  },
}

function resolveAdapter(marketplaceName: string): MarketplaceAdapter {
  const key = marketplaceName.toLowerCase().replace(/[^a-z]/g, '')
  if (ADAPTERS[key]) return ADAPTERS[key]

  // Fallback: build a plausible sellers URL from the marketplace name
  return {
    sellersUrl: (name) => {
      const slug = name.toLowerCase().replace(/\s+/g, '')
      return `https://www.${slug}.com/sellers`
    },
    extract: (html, baseUrl) => extractGeneric(html, baseUrl),
  }
}

export async function scrapeMarketplaceSellers(marketplaceName: string): Promise<RawSeller[]> {
  const adapter = resolveAdapter(marketplaceName)
  const url = adapter.sellersUrl(marketplaceName)

  console.log(`[brightdata] Scraping sellers from: ${url}`)

  const html = await unlockUrl(url)
  const sellers = adapter.extract(html, new URL(url).origin)

  console.log(`[brightdata] Found ${sellers.length} sellers on ${marketplaceName}`)
  return sellers
}
