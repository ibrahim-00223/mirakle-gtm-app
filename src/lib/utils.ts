import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { CampaignStatus, CompanyStatus, MailStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'd MMM yyyy', { locale: fr })
}

export function formatRelativeDate(date: string | null | undefined): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return '—'
  return `${Math.round(score)}%`
}

export function getCampaignStatusLabel(status: CampaignStatus): string {
  const labels: Record<CampaignStatus, string> = {
    draft: 'Brouillon',
    generating: 'En génération...',
    ready: 'Prête à lancer',
    active: 'Active',
    completed: 'Terminée',
    paused: 'En pause',
  }
  return labels[status]
}

export function getCampaignStatusColor(status: CampaignStatus): string {
  const colors: Record<CampaignStatus, string> = {
    draft: 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20',
    generating: 'text-warning bg-warning/10 border-warning/20',
    ready: 'text-accent-blue bg-accent-blue/10 border-accent-blue/20',
    active: 'text-accent-teal bg-accent-teal/10 border-accent-teal/20',
    completed: 'text-success bg-success/10 border-success/20',
    paused: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20',
  }
  return colors[status]
}

export function getCompanyStatusColor(status: CompanyStatus): string {
  const colors: Record<CompanyStatus, string> = {
    qualified: 'text-[#00C2A8] bg-[rgba(0,194,168,0.12)] border-[rgba(0,194,168,0.2)]',
    disqualified: 'text-[#EF4444] bg-[rgba(239,68,68,0.12)] border-[rgba(239,68,68,0.2)]',
    pending: 'text-[#F59E0B] bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.2)]',
  }
  return colors[status]
}

export function getCompanyStatusLabel(status: CompanyStatus): string {
  const labels: Record<CompanyStatus, string> = {
    qualified: 'Qualifié',
    disqualified: 'Disqualifié',
    pending: 'En attente',
  }
  return labels[status]
}

export function getMailStatusColor(status: MailStatus): string {
  const colors: Record<MailStatus, string> = {
    pending: 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20',
    sent: 'text-[#0066FF] bg-[rgba(0,102,255,0.12)] border-[rgba(0,102,255,0.2)]',
    opened: 'text-[#F59E0B] bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.2)]',
    replied: 'text-[#10B981] bg-[rgba(16,185,129,0.12)] border-[rgba(16,185,129,0.2)]',
  }
  return colors[status]
}

export function getMailStatusLabel(status: MailStatus): string {
  const labels: Record<MailStatus, string> = {
    pending: 'Non envoyé',
    sent: 'Envoyé',
    opened: 'Ouvert',
    replied: 'Répondu',
  }
  return labels[status]
}

export function getSectorLabel(sector: string): string {
  const sectors: Record<string, string> = {
    electronics: 'Électronique',
    fashion: 'Mode',
    home: 'Maison & Déco',
    beauty: 'Beauté',
    sport: 'Sport',
    food: 'Alimentation',
    toys: 'Jouets',
    automotive: 'Auto',
  }
  return sectors[sector] || sector
}
