export type CampaignStatus =
  | 'draft'
  | 'generating'
  | 'ready'
  | 'active'
  | 'completed'
  | 'paused'

export type CompanyStatus = 'pending' | 'qualified' | 'disqualified'

export type MailStatus = 'pending' | 'sent' | 'opened' | 'replied'

export type CatalogSize = 'small' | 'medium' | 'large'

export type EmailTone = 'consultative' | 'direct' | 'educational' | 'luxury'

export interface Campaign {
  id: string
  name: string
  sector: string
  source_marketplace: string
  catalog_size: CatalogSize
  tone: EmailTone
  status: CampaignStatus
  created_at: string
}

export interface CampaignWithStats extends Campaign {
  company_count: number
  contact_count: number
  qualified_count: number
  avg_match_score?: number
}

export interface Company {
  id: string
  campaign_id: string
  name: string
  sector: string
  catalog_size: string
  marketplaces: string[]
  top_match_marketplace: string
  match_score: number
  match_rationale: string
  status: CompanyStatus
  enriched_at: string | null
}

export interface Contact {
  id: string
  company_id: string
  campaign_id: string
  first_name: string
  last_name: string
  title: string
  email: string | null
  linkedin_url: string | null
  mail_status: MailStatus
  mail_sent_at: string | null
  mail_opened_at: string | null
  mail_replied_at: string | null
}

export interface MirakleMarketplace {
  id: string
  name: string
  description: string
  categories: string[]
}

export interface CreateCampaignInput {
  name: string
  sector: string
  source_marketplace: string
  catalog_size: CatalogSize
  tone: EmailTone
}

export interface UpdateCompanyStatusInput {
  status: CompanyStatus
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface DashboardMetrics {
  total_sent: number
  open_rate: number
  reply_rate: number
  qualified_companies: number
  total_campaigns: number
  avg_match_score: number
}
