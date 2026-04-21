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
    draft: 'text-[#30373E]/70 bg-[#03182F]/5 border-[#03182F]/10',
    generating: 'text-[#770031] bg-[#FFE7EC] border-[#F22E75]/30',
    ready: 'text-[#2764FF] bg-[rgba(39,100,255,0.08)] border-[rgba(39,100,255,0.2)]',
    active: 'text-[#2764FF] bg-[rgba(39,100,255,0.12)] border-[rgba(39,100,255,0.25)]',
    completed: 'text-[#03182F] bg-[#F2F8FF] border-[#03182F]/20',
    paused: 'text-[#30373E]/60 bg-[#03182F]/5 border-[#03182F]/10',
  }
  return colors[status]
}

export function getCompanyStatusColor(status: CompanyStatus): string {
  const colors: Record<CompanyStatus, string> = {
    qualified: 'text-[#2764FF] bg-[rgba(39,100,255,0.08)] border-[rgba(39,100,255,0.2)]',
    disqualified: 'text-[#770031] bg-[#FFE7EC] border-[#F22E75]/30',
    pending: 'text-[#30373E]/60 bg-[#03182F]/5 border-[#03182F]/10',
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
    pending: 'text-[#30373E]/60 bg-[#03182F]/5 border-[#03182F]/10',
    sent: 'text-[#2764FF] bg-[rgba(39,100,255,0.08)] border-[rgba(39,100,255,0.2)]',
    opened: 'text-[#770031] bg-[#FFE7EC] border-[#F22E75]/30',
    replied: 'text-[#2764FF] bg-[rgba(39,100,255,0.12)] border-[rgba(39,100,255,0.25)]',
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
