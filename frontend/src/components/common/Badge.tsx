import React from 'react';
import {
  User,
  Phone,
  Car,
  MapPin,
  Building2,
  CreditCard,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Shield,
} from 'lucide-react';
import type { EntityType, AlertSeverity, AlertStatus, CandidateStatus } from '../../types';

// Entity Type Badges
export const entityTypeConfig: Record<
  EntityType,
  { label: string; icon: React.ElementType; colorClass: string; bgClass: string; borderClass: string }
> = {
  person: {
    label: 'Person',
    icon: User,
    colorClass: 'text-[#A5B4FC]',
    bgClass: 'bg-[#4F46E5]/15',
    borderClass: 'border-[#6366F1]/30',
  },
  phone: {
    label: 'Phone',
    icon: Phone,
    colorClass: 'text-[#6EE7B7]',
    bgClass: 'bg-[#059669]/15',
    borderClass: 'border-[#10B981]/30',
  },
  vehicle: {
    label: 'Vehicle',
    icon: Car,
    colorClass: 'text-[#FDBA74]',
    bgClass: 'bg-[#EA580C]/15',
    borderClass: 'border-[#F97316]/30',
  },
  location: {
    label: 'Location',
    icon: MapPin,
    colorClass: 'text-[#7DD3FC]',
    bgClass: 'bg-[#0284C7]/15',
    borderClass: 'border-[#38BDF8]/30',
  },
  organization: {
    label: 'Organization',
    icon: Building2,
    colorClass: 'text-[#F0ABFC]',
    bgClass: 'bg-[#C026D3]/15',
    borderClass: 'border-[#E879F9]/30',
  },
  account: {
    label: 'Account',
    icon: CreditCard,
    colorClass: 'text-[#FDE047]',
    bgClass: 'bg-[#CA8A04]/15',
    borderClass: 'border-[#EAB308]/30',
  },
  other: {
    label: 'Other',
    icon: HelpCircle,
    colorClass: 'text-[#CBD5E1]',
    bgClass: 'bg-[#475569]/15',
    borderClass: 'border-[#64748B]/30',
  },
};

export const EntityTypeBadge: React.FC<{ type: EntityType | string; showIcon?: boolean }> = ({
  type,
  showIcon = true,
}) => {
  const normType = (type?.toLowerCase() || 'other') as EntityType;
  const cfg = entityTypeConfig[normType] || entityTypeConfig.other;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bgClass} ${cfg.colorClass} ${cfg.borderClass}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{cfg.label}</span>
    </span>
  );
};

// Severity Badges
export const severityConfig: Record<
  AlertSeverity,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  low: {
    label: 'Low',
    bgClass: 'bg-[#0C4A6E]/30',
    textClass: 'text-[#38BDF8]',
    borderClass: 'border-[#0284C7]/40',
  },
  medium: {
    label: 'Medium',
    bgClass: 'bg-[#78350F]/30',
    textClass: 'text-[#FBBF24]',
    borderClass: 'border-[#D97706]/40',
  },
  high: {
    label: 'High',
    bgClass: 'bg-[#7C2D12]/30',
    textClass: 'text-[#FB923C]',
    borderClass: 'border-[#EA580C]/40',
  },
  critical: {
    label: 'Critical',
    bgClass: 'bg-[#7F1D1D]/30',
    textClass: 'text-[#F87171]',
    borderClass: 'border-[#DC2626]/40',
  },
};

export const SeverityBadge: React.FC<{ severity: AlertSeverity | string }> = ({ severity }) => {
  const norm = (severity?.toLowerCase() || 'medium') as AlertSeverity;
  const cfg = severityConfig[norm] || severityConfig.medium;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} tabular-nums`}
    >
      {cfg.label}
    </span>
  );
};

// Status Badges
export const StatusBadge: React.FC<{ status?: string | null }> = ({ status }) => {
  if (!status) return null;
  const s = status.toLowerCase();

  let styles = 'bg-[#1E232D] text-text-secondary border-border';
  if (['resolved', 'accepted', 'completed', 'active', 'open'].includes(s)) {
    styles = 'bg-[#064E3B]/30 text-[#34D399] border-[#059669]/40';
  } else if (['reviewing', 'in_progress'].includes(s)) {
    styles = 'bg-[#1E3A8A]/30 text-[#60A5FA] border-[#2563EB]/40';
  } else if (['new'].includes(s)) {
    styles = 'bg-[#4C1D95]/30 text-[#A78BFA] border-[#6D28D9]/40';
  } else if (['pending', 'under_review'].includes(s)) {
    styles = 'bg-[#78350F]/30 text-[#FBBF24] border-[#D97706]/40';
  } else if (['rejected', 'error', 'failed'].includes(s)) {
    styles = 'bg-[#7F1D1D]/30 text-[#F87171] border-[#DC2626]/40';
  } else if (['dismissed', 'closed'].includes(s)) {
    styles = 'bg-[#27272A]/40 text-[#A1A1AA] border-[#3F3F46]/40';
  }

  const label = s.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} capitalize`}>
      {label}
    </span>
  );
};

// Verification Badge (displays raw string as neutral badge per prompt)
export const VerificationBadge: React.FC<{ status?: string | null }> = ({ status }) => {
  if (!status) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#1F242D] text-text-secondary border border-border">
      <Shield className="w-3 h-3 text-text-muted" />
      <span>{status}</span>
    </span>
  );
};
