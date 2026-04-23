import Anthropic from '@anthropic-ai/sdk'
import * as cheerio from 'cheerio'
import { unlockUrl } from '@/lib/brightdata/client'
import type { CreateCampaignInput } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ── Tool definitions ────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_web',
    description:
      'Search the web for a query. Returns a list of results with title, URL, and snippet. Use this to find seller directories, marketplace pages, or company information.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query (in English or French)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'scrape_page',
    description:
      'Fetch the full HTML content of a URL using Bright Data anti-bot proxy. Use this to scrape seller listing pages, company websites, team pages, etc. Returns cleaned text content.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full URL to scrape (must start with http/https)' },
        extract: {
          type: 'string',
          enum: ['text', 'links', 'emails'],
          description: 'What to extract: "text" for page content, "links" for all hyperlinks, "emails" for email addresses',
        },
      },
      required: ['url', 'extract'],
    },
  },
]

// ── Tool execution ───────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  input: Record<string, string>
): Promise<string> {
  if (name === 'search_web') {
    // Use DuckDuckGo via Bright Data (no API key needed)
    const query = encodeURIComponent(input.query)
    try {
      const html = await unlockUrl(`https://html.duckduckgo.com/html/?q=${query}`)
      const $ = cheerio.load(html)
      const results: string[] = []

      $('.result').each((i, el) => {
        if (i >= 8) return
        const title = $(el).find('.result__title').text().trim()
        const url = $(el).find('.result__url').text().trim()
        const snippet = $(el).find('.result__snippet').text().trim()
        if (title) results.push(`${i + 1}. ${title}\n   URL: ${url}\n   ${snippet}`)
      })

      return results.length > 0
        ? results.join('\n\n')
        : 'No results found. Try a different query.'
    } catch (err) {
      return `Search failed: ${String(err)}`
    }
  }

  if (name === 'scrape_page') {
    const { url, extract } = input
    try {
      const html = await unlockUrl(url)
      const $ = cheerio.load(html)

      // Remove scripts, styles, nav, footer noise
      $('script, style, nav, footer, header, .cookie-banner, #cookie').remove()

      if (extract === 'links') {
        const links: string[] = []
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href') || ''
          const text = $(el).text().trim()
          if (href.startsWith('http') && text && text.length > 2) {
            links.push(`${text} → ${href}`)
          }
        })
        return links.slice(0, 60).join('\n') || 'No links found'
      }

      if (extract === 'emails') {
        const emailMatches = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []
        const emails = [...new Set(emailMatches)].filter(
          (e) => !e.includes('example') && !e.includes('@sentry')
        )
        return emails.length > 0 ? emails.join('\n') : 'No emails found'
      }

      // Default: clean text
      const text = $('body').text().replace(/\s+/g, ' ').trim()
      return text.slice(0, 4000)
    } catch (err) {
      return `Scraping failed for ${url}: ${String(err)}`
    }
  }

  return 'Unknown tool'
}

// ── Seller result type ───────────────────────────────────────────────────────

export interface AgentSeller {
  name: string
  website_url: string | null
  description: string | null
  sector: string
  linkedin_url: string | null
  current_marketplaces: string[]
  contacts: Array<{
    first_name: string
    last_name: string
    title: string | null
    email: string | null
    linkedin_url: string | null
  }>
}

// ── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(input: CreateCampaignInput): string {
  const isMarketplace = input.mode === 'marketplace'

  if (isMarketplace) {
    return `You are a B2B prospecting agent for Mirakl Connect, a marketplace-as-a-service platform.
Your goal is to find sellers (brands/merchants) that currently sell on ${input.source_marketplace_name} and could potentially join a Mirakl-powered marketplace.

Campaign context:
- Source marketplace: ${input.source_marketplace_name}
- Target sector: ${input.sector}
- Target catalog size: ${input.catalog_size}
- Target regions: ${(input.target_regions ?? []).join(', ') || 'all regions'}

Your task:
1. Search the web to find the seller/brand directory on ${input.source_marketplace_name}
2. Scrape the seller listing page to get a list of sellers
3. For each seller (up to 15), visit their website to gather:
   - Company name, website, description
   - LinkedIn URL if available
   - Email addresses or contact info
   - Current marketplace presence
4. Return your findings as a JSON array of sellers

Focus on brands in the ${input.sector} sector. Be thorough but efficient — use search to find the right pages, then scrape them.

When you have gathered enough data (at least 5-10 sellers), output the final JSON result.`
  }

  const icp: Partial<NonNullable<typeof input.icp>> = input.icp ?? {}
  return `You are a B2B prospecting agent for Mirakl Connect, a marketplace-as-a-service platform.
Your goal is to find sellers (brands/merchants) matching an ICP profile who could join Mirakl-powered marketplaces.

ICP profile:
- Sector: ${input.sector}
- Revenue range: ${icp.revenue_range_min_eur ? `${icp.revenue_range_min_eur}€` : 'any'} – ${icp.revenue_range_max_eur ? `${icp.revenue_range_max_eur}€` : 'any'}
- Employee count: ${icp.employee_count_min ?? '?'} – ${icp.employee_count_max ?? '?'}
- Geography: ${(icp.geography_filter ?? []).join(', ') || 'all regions'}
- Min match score: ${icp.min_match_score_threshold ?? 60}%

Your task:
1. Search for brands/sellers in the ${input.sector} sector matching this profile
2. Find their websites and gather company information
3. Look for contact information (email, LinkedIn) on their websites
4. Return your findings as a JSON array of sellers

Focus on finding sellers who sell products online but may not yet use Mirakl-powered marketplaces.
When you have gathered data on at least 5-10 sellers, output the final JSON result.`
}

// ── Main agent function ──────────────────────────────────────────────────────

export async function runScrapingAgent(
  input: CreateCampaignInput,
  onProgress?: (message: string) => void
): Promise<AgentSeller[]> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Start the prospecting process for this campaign: "${input.name}". Follow your instructions and return the sellers as a JSON array at the end.`,
    },
  ]

  const MAX_ITERATIONS = 12
  let iteration = 0

  while (iteration < MAX_ITERATIONS) {
    iteration++

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: buildSystemPrompt(input),
      tools: TOOLS,
      messages,
    })

    // Add assistant response to history
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      // Extract JSON from final response
      const textContent = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')

      onProgress?.(`Agent completed after ${iteration} iterations`)

      // Try to parse JSON from the response
      const jsonMatch = textContent.match(/```json\n?([\s\S]+?)\n?```/) ||
        textContent.match(/(\[[\s\S]+\])/)

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          if (Array.isArray(parsed)) return parsed as AgentSeller[]
        } catch {
          console.warn('[agent] Failed to parse JSON from response')
        }
      }

      return []
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      )

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUseBlocks) {
        onProgress?.(`🔧 ${toolUse.name}: ${JSON.stringify(toolUse.input).slice(0, 80)}...`)
        console.log(`[agent] Tool: ${toolUse.name}`, toolUse.input)

        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, string>
        )

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        })
      }

      messages.push({ role: 'user', content: toolResults })
    }
  }

  console.warn('[agent] Max iterations reached')
  return []
}
