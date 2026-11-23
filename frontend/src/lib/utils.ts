import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    return dateString
  }
}

export function formatTimeOnly(dateString?: string): string {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    return dateString
  }
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    const diffMs = Date.now() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}h ago`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 30) return `${diffDay}d ago`
    return formatDate(dateString)
  } catch {
    return dateString
  }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$${amount.toLocaleString()}`
  }
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

export function capitalize(str?: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

export function truncate(str: string, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

/**
 * Visual styling configuration according to CrimeGraph design requirements:
 * - People: amber
 * - Phone numbers: blue
 * - Vehicles: teal
 * - Locations: violet
 * - Organizations: muted gold
 */
export const ENTITY_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  person: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    hex: '#F2A900', // Amber
  },
  phone: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    hex: '#38BDF8', // Icy Blue
  },
  vehicle: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    hex: '#2DD4BF', // Muted Teal
  },
  location: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/30',
    hex: '#A78BFA', // Violet
  },
  organization: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    hex: '#EAB308', // Muted Gold
  },
}

export const SEVERITY_BADGES: Record<string, string> = {
  critical: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  high: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  medium: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  low: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
}

export const STATUS_BADGES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  under_review: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  investigating: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  further_review: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  dismissed: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  closed: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  archived: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
}
