import * as cheerio from 'cheerio'
import { unlockUrl } from '@/lib/brightdata/client'
import type { CreateCampaignInput } from '@/types'

const MISTRAL_API = 'https://api.mistral.ai/v1/chat/completions'
// mistral-small has 10× higher rate limits than large; sufficient for prospecting
const MISTRAL_MODEL = process.env.MISTRAL_MODEL ?? 'mistral-small-latest'

// ── Retry helper ─────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
  baseDelayMs = 15_000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const is429 = message.includes('429') || message.includes('rate_limit') || message.includes('Rate limit')
      if (!is429 || attempt === maxAttempts) throw err

      // Honour Retry-After if the raw response embedded it, otherwise exponential back-off
      const retryAfterMatch = message.match(/retry.after[": ]+(\d+)/i)
      const waitMs = retryAfterMatch
        ? parseInt(retryAfterMatch[1], 10) * 1000
        : baseDelayMs * Math.pow(2, attempt - 1)  // 15s, 30s, 60s, 120s

      console.warn(`[mistral] 429 rate-limited — waiting ${waitMs / 1000}s before retry (attempt ${attempt}/${maxAttempts})`)
      await sleep(waitMs)
    }
  }
  throw new Error('withRetry: unreachable')
}

// ── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_web',
      description:
        'Search the web for a query. Returns a list of results with title, URL, and snippet. Use this to find seller directories, marketplace pages, or company information.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query (in English or French)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scrape_page',
      description:
        'Fetch the full content of a URL using Bright Data anti-bot proxy. Use this to scrape seller listing pages, company websites, team pages, etc.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full URL to scrape (must start with http/https)' },
          extract: {
            type: 'string',
            enum: ['text', 'links', 'emails'],
            description:
              '"text" for page content, "links" for all hyperlinks, "emails" for email addresses',
          },
        },
        required: ['url', 'extract'],
      },
    },
  },
]

// ── Raw Mistral fetch (bypass SDK to control message format exactly) ──────────

interface MistralToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface MistralChoice {
  finish_reason: string
  message: {
    role: string
    content: string | null
    tool_calls?: MistralToolCall[]
  }
}

async function mistralChat(messages: unknown[]): Promise<MistralChoice> {
  return withRetry(async () => {
    const res = await fetch(MISTRAL_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MISTRAL_MODEL, messages, tools: TOOLS, tool_choice: 'auto' }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Mistral API ${res.status}: ${body}`)
    }

    const data = await res.json() as { choices: MistralChoice[] }
    return data.choices[0]
  })
}

// ── Tool execution ────────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  if (name === 'search_web') {
    const query = encodeURIComponent(args.query)
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
      return results.length > 0 ? results.join('\n\n') : 'No results found. Try a different query.'
    } catch (err) {
      return `Search failed: ${String(err)}`
    }
  }

  if (name === 'scrape_page') {
    const { url, extract } = args
    try {
      const html = await unlockUrl(url)
      const $ = cheerio.load(html)
      $('script, style, nav, footer, header').remove()

      if (extract === 'links') {
        const links: string[] = []
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href') || ''
          const text = $(el).text().trim()
          if (href.startsWith('http') && text && text.length > 2) links.push(`${text} → ${href}`)
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

      const text = $('body').text().replace(/\s+/g, ' ').trim()
      return text.slice(0, 4000)
    } catch (err) {
      return `Scraping failed for ${url}: ${String(err)}`
    }
  }

  return 'Unknown tool'
}

// ── Agent result type ─────────────────────────────────────────────────────────

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

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(input: CreateCampaignInput): string {
  if (input.mode === 'marketplace') {
    return `You are a B2B prospecting agent for Mirakl Connect, a marketplace-as-a-service platform.
Your goal is to find sellers (brands/merchants) that currently sell on ${input.source_marketplace_name} and could join a Mirakl-powered marketplace.

Campaign:
- Source marketplace: ${input.source_marketplace_name}
- Target sector: ${input.sector}
- Catalog size: ${input.catalog_size}
- Target regions: ${(input.target_regions ?? []).join(', ') || 'all'}

Steps:
1. Search the web to find the seller/brand directory on ${input.source_marketplace_name}
2. Scrape the seller listing page to list sellers
3. For each seller (up to 15), visit their website to get: name, website, description, LinkedIn, emails, current marketplaces
4. When done, output ONLY a JSON array like:
[{"name":"...","website_url":"...","description":"...","sector":"${input.sector}","linkedin_url":null,"current_marketplaces":["${input.source_marketplace_name}"],"contacts":[{"first_name":"...","last_name":"...","title":"...","email":"...","linkedin_url":null}]}]`
  }

  const icp: Partial<NonNullable<typeof input.icp>> = input.icp ?? {}
  return `You are a B2B prospecting agent for Mirakl Connect, a marketplace-as-a-service platform.
Find sellers matching this ICP profile who could join Mirakl-powered marketplaces.

ICP:
- Sector: ${input.sector}
- Revenue: ${icp.revenue_range_min_eur ?? '?'}€ – ${icp.revenue_range_max_eur ?? '?'}€
- Employees: ${icp.employee_count_min ?? '?'} – ${icp.employee_count_max ?? '?'}
- Geography: ${(icp.geography_filter ?? []).join(', ') || 'all'}
- Min match score: ${icp.min_match_score_threshold ?? 60}%

Steps:
1. Search for brands/sellers in the ${input.sector} sector matching this profile
2. Visit their websites to gather info (name, website, LinkedIn, emails)
3. When done, output ONLY a JSON array like:
[{"name":"...","website_url":"...","description":"...","sector":"${input.sector}","linkedin_url":null,"current_marketplaces":[],"contacts":[{"first_name":"...","last_name":"...","title":"...","email":"...","linkedin_url":null}]}]`
}

// ── Main agent loop ───────────────────────────────────────────────────────────

export async function runScrapingAgent(
  input: CreateCampaignInput,
  onProgress?: (message: string) => void
): Promise<AgentSeller[]> {
  // Pure JSON objects — sent verbatim to Mistral API via raw fetch
  const messages: unknown[] = [
    { role: 'system', content: buildSystemPrompt(input) },
    {
      role: 'user',
      content: `Start prospecting for campaign: "${input.name}". Use your tools, then return the JSON array of sellers.`,
    },
  ]

  const MAX_ITERATIONS = 12

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Small pause between iterations to stay well under rate limits
    if (i > 0) await sleep(2000)
    const choice = await mistralChat(messages)
    const msg = choice.message
    const rawToolCalls = msg.tool_calls ?? []

    // Normalize tool calls — guarantee non-null IDs
    const toolCalls: MistralToolCall[] = rawToolCalls.map((tc, idx) => ({
      id: tc.id && tc.id !== 'None' ? tc.id : `call_${i}_${idx}`,
      type: 'function' as const,
      function: {
        name: tc.function.name,
        arguments: typeof tc.function.arguments === 'string'
          ? tc.function.arguments
          : JSON.stringify(tc.function.arguments),
      },
    }))

    // Push assistant message as plain object Mistral understands
    if (toolCalls.length > 0) {
      messages.push({ role: 'assistant', content: msg.content ?? '', tool_calls: toolCalls })
    } else {
      messages.push({ role: 'assistant', content: msg.content ?? '' })
    }

    // Agent finished
    if (choice.finish_reason === 'stop' || toolCalls.length === 0) {
      const text = msg.content ?? ''
      onProgress?.(`Agent done after ${i + 1} iterations`)

      const jsonMatch = text.match(/```json\n?([\s\S]+?)\n?```/) || text.match(/(\[[\s\S]+\])/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          if (Array.isArray(parsed)) return parsed as AgentSeller[]
        } catch {
          console.warn('[agent] Failed to parse JSON')
        }
      }
      break
    }

    // Execute tool calls and push tool results
    for (const toolCall of toolCalls) {
      const fnName = toolCall.function.name
      const fnArgs = JSON.parse(toolCall.function.arguments) as Record<string, string>

      onProgress?.(`🔧 ${fnName}: ${JSON.stringify(fnArgs).slice(0, 80)}...`)
      console.log(`[agent] Tool: ${fnName}`, fnArgs)

      const result = await executeTool(fnName, fnArgs)

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: fnName,
        content: result,
      })
    }
  }

  return []
}
