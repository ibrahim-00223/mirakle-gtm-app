// ── Enum types ────────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'generating' | 'ready' | 'active' | 'paused' | 'completed'
export type CampaignMode = 'marketplace' | 'icp'
export type CatalogSize = 'small' | 'medium' | 'large'
export type EmailTone = 'consultative' | 'direct' | 'educational' | 'luxury'
export type CompanyStatus = 'pending' | 'qualified' | 'disqualified'
export type OutreachStatus =
  | 'pending'
  | 'draft'
  | 'review'
  | 'approved'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'bounced'
/** @deprecated Use OutreachStatus */
export type MailStatus = 'pending' | 'sent' | 'opened' | 'replied'
export type MarketplaceType = 'mirakl' | 'external'

// ── Core entities ─────────────────────────────────────────────────────────────

export interface Marketplace {
  id: string
  name: string
  marketplace_type: MarketplaceType
  description: string | null
  website_url: string | null
  categories: string[]
  regions: string[]
  country_code: string | null
  gmv_range: string | null
  estimated_gmv_eur: number | null
  seller_count_approx: number | null
  commission_rate_pct: number | null
  is_active: boolean
  scraped_at: string | null
  source_url: string | null
  raw_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  mode: CampaignMode
  sector: string
  source_marketplace_id: string | null
  source_marketplace_name: string | null
  catalog_size: CatalogSize
  tone: EmailTone
  target_regions: string[]
  status: CampaignStatus
  sdr_user_id: string | null
  company_count: number
  contact_count: number
  qualified_count: number
  avg_match_score: number | null
  launched_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

/** @deprecated Use Campaign — counts are now denormalized columns */
export interface CampaignWithStats extends Campaign {}

export interface CampaignIcp {
  id: string
  campaign_id: string
  target_marketplace_criteria: Record<string, unknown>
  target_seller_criteria: Record<string, unknown>
  min_match_score_threshold: number
  geography_filter: string[]
  revenue_range_min_eur: number | null
  revenue_range_max_eur: number | null
  employee_count_min: number | null
  employee_count_max: number | null
  preferred_categories: string[]
  excluded_categories: string[]
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  website_url: string | null
  domain: string | null
  sector: string | null
  country_code: string | null
  city: string | null
  catalog_size: CatalogSize | null
  sku_count_approx: number | null
  current_marketplaces: string[]
  current_marketplace_ids: string[]
  revenue_range_label: string | null
  revenue_eur_min: number | null
  revenue_eur_max: number | null
  employee_count_approx: number | null
  employee_range_label: string | null
  linkedin_url: string | null
  description: string | null
  tech_stack: string[]
  founded_year: number | null
  is_enriched: boolean
  enriched_at: string | null
  enrichment_source: string | null
  raw_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CampaignCompany {
  id: string
  campaign_id: string
  company_id: string
  match_score: number | null
  match_rationale: string | null
  top_match_marketplace_id: string | null
  top_match_marketplace_name: string | null
  status: CompanyStatus
  qualified_at: string | null
  disqualified_at: string | null
  disqualification_reason: string | null
  sdr_notes: string | null
  scoring_version: string | null
  scoring_metadata: Record<string, unknown>
  added_at: string
  updated_at: string
}

/** Company enriched with its campaign-specific context */
export interface CompanyWithCampaignContext extends Company {
  campaign_company_id: string
  campaign_id: string
  match_score: number | null
  match_rationale: string | null
  top_match_marketplace_name: string | null
  status: CompanyStatus
}

export interface Contact {
  id: string
  company_id: string
  first_name: string
  last_name: string
  title: string | null
  department: string | null
  seniority: string | null
  is_decision_maker: boolean
  email: string | null
  email_verified: boolean
  phone: string | null
  linkedin_url: string | null
  twitter_url: string | null
  country_code: string | null
  language: string | null
  enriched_at: string | null
  enrichment_source: string | null
  raw_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CampaignContact {
  id: string
  campaign_id: string
  contact_id: string
  company_id: string
  outreach_status: OutreachStatus
  sequence_step: number
  email_subject_draft: string | null
  email_body_draft: string | null
  email_subject_final: string | null
  email_body_final: string | null
  ai_generation_context: Record<string, unknown>
  ai_model_version: string | null
  draft_generated_at: string | null
  review_started_at: string | null
  approved_at: string | null
  approved_by_user_id: string | null
  sent_at: string | null
  opened_at: string | null
  open_count: number
  clicked_at: string | null
  click_count: number
  replied_at: string | null
  bounced_at: string | null
  bounce_type: string | null
  email_provider_message_id: string | null
  sdr_notes: string | null
  created_at: string
  updated_at: string
}

/** Contact enriched with its campaign outreach context */
export interface ContactWithOutreachContext extends Contact {
  campaign_contact_id: string
  campaign_id: string
  outreach_status: OutreachStatus
  sequence_step: number
  email_subject_draft: string | null
  email_body_draft: string | null
  email_subject_final: string | null
  email_body_final: string | null
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  replied_at: string | null
  // Legacy field aliases for backwards compat with existing UI components
  mail_status: OutreachStatus
  mail_sent_at: string | null
  mail_opened_at: string | null
  mail_replied_at: string | null
}

export interface ScrapingJob {
  id: string
  campaign_id: string | null
  job_type: 'find_sellers' | 'find_marketplaces' | 'enrich_company' | 'find_contacts'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  n8n_workflow_id: string | null
  n8n_execution_id: string | null
  query_params: Record<string, unknown>
  result_count: number | null
  new_records_created: number
  existing_records_updated: number
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface EmailSequence {
  id: string
  campaign_id: string
  step_number: number
  name: string
  delay_days: number
  subject_template: string
  body_template: string
  tone: EmailTone | null
  is_active: boolean
  send_on_weekdays_only: boolean
  min_send_hour_utc: number
  max_send_hour_utc: number
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  event_type: string
  entity_type: string
  entity_id: string
  campaign_id: string | null
  actor_user_id: string | null
  actor_type: string
  summary: string
  metadata: Record<string, unknown>
  created_at: string
}

// ── Input types ───────────────────────────────────────────────────────────────

export interface CreateCampaignInput {
  name: string
  sector: string
  mode: CampaignMode
  // marketplace mode
  source_marketplace_name?: string
  source_marketplace_id?: string
  // common
  catalog_size: CatalogSize
  tone: EmailTone
  target_regions?: string[]
  // icp mode
  icp?: Omit<CampaignIcp, 'id' | 'campaign_id' | 'created_at' | 'updated_at'>
}

export interface UpdateCompanyStatusInput {
  status: CompanyStatus
  disqualification_reason?: string
}

// ── API / UI helpers ──────────────────────────────────────────────────────────

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

/** @deprecated Use Marketplace */
export interface MirakleMarketplace {
  id: string
  name: string
  description: string
  categories: string[]
}
