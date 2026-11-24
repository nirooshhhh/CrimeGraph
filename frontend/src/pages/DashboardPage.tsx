import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Share2,
  FileText,
  BellRing,
  GitCompare,
  ArrowRight,
  TrendingUp,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  fetchDashboardStats,
  fetchEntities,
  fetchAlerts,
  fetchMatchCandidatesByStatus,
} from '../api';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { EntityTypeBadge, SeverityBadge, StatusBadge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorMessage } from '../components/common/ErrorMessage';
import type { EntityType } from '../types';

export const DashboardPage: React.FC = () => {
  // Fetch stats from /dashboard/stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  // Fetch entities to compute real entity_type distribution & latest entities
  const {
    data: entities = [],
    isLoading: entitiesLoading,
    error: entitiesError,
  } = useQuery({
    queryKey: ['entities'],
    queryFn: fetchEntities,
  });

  // Fetch alerts to compute severity & status distribution & latest alerts
  const {
    data: alerts = [],
    isLoading: alertsLoading,
    error: alertsError,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

  // Fetch pending match candidates count
  const {
    data: pendingCandidates = [],
    isLoading: pendingLoading,
  } = useQuery({
    queryKey: ['match-candidates', 'pending'],
    queryFn: () => fetchMatchCandidatesByStatus('pending'),
  });

  // Compute entities by entity_type from real entity records
  const entityTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ent of entities) {
      const t = ent.entity_type || 'other';
      counts[t] = (counts[t] || 0) + 1;
    }
    const colors: Record<string, string> = {
      person: '#818CF8',
      phone: '#34D399',
      vehicle: '#FB923C',
      location: '#38BDF8',
      organization: '#E879F9',
      account: '#FACC15',
      other: '#94A3B8',
    };
    return Object.entries(counts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      count,
      fill: colors[type] || '#94A3B8',
    }));
  }, [entities]);

  // Compute alerts by severity
  const alertSeverityData = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const a of alerts) {
      const s = (a.severity || 'medium').toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
      else counts[s] = 1;
    }
    const colors: Record<string, string> = {
      low: '#38BDF8',
      medium: '#FBBF24',
      high: '#FB923C',
      critical: '#F87171',
    };
    return Object.entries(counts).map(([severity, count]) => ({
      name: severity.toUpperCase(),
      severity,
      count,
      fill: colors[severity] || '#94A3B8',
    }));
  }, [alerts]);

  // Compute alerts by status
  const alertStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { new: 0, reviewing: 0, resolved: 0, dismissed: 0 };
    for (const a of alerts) {
      const s = (a.status || 'new').toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
      else counts[s] = 1;
    }
    return counts;
  }, [alerts]);

  // Latest entities (sorted newest first)
  const latestEntities = useMemo(() => {
    return [...entities].slice(0, 5);
  }, [entities]);

  // Latest alerts
  const latestAlerts = useMemo(() => {
    return [...alerts].slice(0, 5);
  }, [alerts]);

  if (statsError) {
    return (
      <ErrorMessage
        title="Failed to load dashboard metrics"
        message="Could not connect to the CrimeGraph backend gateway."
        onRetry={() => refetchStats()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">Intelligence Overview</h2>
        <p className="text-sm text-text-secondary mt-1">
          High-level operational metrics, entity distributions, and active investigation alerts.
        </p>
      </div>

      {/* Row of 5 KPI Cards from /dashboard/stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading ? (
          <CardSkeleton count={5} />
        ) : (
          <>
            <Link to="/cases" className="group">
              <Card className="h-full group-hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Investigations</span>
                  <Briefcase className="w-4 h-4 text-accent" />
                </div>
                <div className="text-3xl font-bold tracking-tight text-text-primary tabular-nums">
                  {stats?.totalCases ?? 0}
                </div>
                <div className="text-xs text-text-secondary mt-1.5 flex items-center justify-between">
                  <span>Active & archived cases</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                </div>
              </Card>
            </Link>

            <Link to="/entities" className="group">
              <Card className="h-full group-hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Entities</span>
                  <Users className="w-4 h-4 text-[#818CF8]" />
                </div>
                <div className="text-3xl font-bold tracking-tight text-text-primary tabular-nums">
                  {stats?.totalEntities ?? 0}
                </div>
                <div className="text-xs text-text-secondary mt-1.5 flex items-center justify-between">
                  <span>Extracted & manual records</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                </div>
              </Card>
            </Link>

            <Link to="/relationships" className="group">
              <Card className="h-full group-hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Relationships</span>
                  <Share2 className="w-4 h-4 text-[#34D399]" />
                </div>
                <div className="text-3xl font-bold tracking-tight text-text-primary tabular-nums">
                  {stats?.totalRelationships ?? 0}
                </div>
                <div className="text-xs text-text-secondary mt-1.5 flex items-center justify-between">
                  <span>Linked entity pairs</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                </div>
              </Card>
            </Link>

            <Link to="/documents" className="group">
              <Card className="h-full group-hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Documents</span>
                  <FileText className="w-4 h-4 text-[#FBBF24]" />
                </div>
                <div className="text-3xl font-bold tracking-tight text-text-primary tabular-nums">
                  {stats?.totalDocuments ?? 0}
                </div>
                <div className="text-xs text-text-secondary mt-1.5 flex items-center justify-between">
                  <span>Processed evidence files</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                </div>
              </Card>
            </Link>

            <Link to="/alerts" className="group">
              <Card className="h-full group-hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between text-text-muted mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Alerts</span>
                  <BellRing className="w-4 h-4 text-[#F87171]" />
                </div>
                <div className="text-3xl font-bold tracking-tight text-text-primary tabular-nums">
                  {stats?.totalAlerts ?? 0}
                </div>
                <div className="text-xs text-text-secondary mt-1.5 flex items-center justify-between">
                  <span>Flagged intelligence alerts</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                </div>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Two Column Layout: Left (Charts) & Right (Pending Matches & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Charts */}
        <div className="lg:col-span-7 space-y-6">
          {/* Chart 1: Entities by Entity Type */}
          <Card>
            <CardHeader
              action={
                <Link to="/entities" className="text-xs text-accent hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              <CardTitle>Entities by Type</CardTitle>
              <CardDescription>Breakdown of all identified entities across the database</CardDescription>
            </CardHeader>

            {entitiesLoading ? (
              <div className="h-64 flex items-center justify-center text-text-muted animate-pulse">
                Loading entity data...
              </div>
            ) : entityTypeData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-text-muted">
                No entities recorded yet.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={entityTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#262B35' }}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#262B35' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E232D',
                        borderColor: '#262B35',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                      formatter={(val: number) => [`${val} entities`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {entityTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Chart 2: Alerts by Severity and Status */}
          <Card>
            <CardHeader
              action={
                <Link to="/alerts" className="text-xs text-accent hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              <CardTitle>Alerts Distribution</CardTitle>
              <CardDescription>Alert counts classified by severity level and status</CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Severity Bar Chart */}
              <div>
                <div className="text-xs font-semibold uppercase text-text-muted mb-3">By Severity</div>
                {alertsLoading ? (
                  <div className="h-44 flex items-center justify-center text-text-muted animate-pulse">
                    Loading alerts...
                  </div>
                ) : (
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={alertSeverityData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <XAxis
                          dataKey="name"
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#262B35' }}
                        />
                        <YAxis
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#262B35' }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1E232D',
                            borderColor: '#262B35',
                            borderRadius: '8px',
                            color: '#F8FAFC',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {alertSeverityData.map((entry, index) => (
                            <Cell key={`sev-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Status Breakdown Indicators */}
              <div>
                <div className="text-xs font-semibold uppercase text-text-muted mb-3">By Workflow Status</div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised/50 border border-border-subtle">
                    <span className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#A78BFA]" />
                      New (Unassigned)
                    </span>
                    <span className="text-sm font-semibold text-text-primary tabular-nums">
                      {alertStatusCounts.new || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised/50 border border-border-subtle">
                    <span className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
                      Under Review
                    </span>
                    <span className="text-sm font-semibold text-text-primary tabular-nums">
                      {alertStatusCounts.reviewing || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised/50 border border-border-subtle">
                    <span className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#34D399]" />
                      Resolved
                    </span>
                    <span className="text-sm font-semibold text-text-primary tabular-nums">
                      {alertStatusCounts.resolved || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-raised/50 border border-border-subtle">
                    <span className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                      Dismissed
                    </span>
                    <span className="text-sm font-semibold text-text-primary tabular-nums">
                      {alertStatusCounts.dismissed || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Pending Candidates + Latest Alerts + Latest Entities */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Pending Match Candidates */}
          <Link to="/match-review" className="block group">
            <Card className="border-border group-hover:border-accent transition-colors bg-gradient-to-br from-surface to-surface-raised">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <GitCompare className="w-3.5 h-3.5 text-accent" />
                    Duplicate Entity Review
                  </div>
                  <div className="text-2xl font-bold text-text-primary tabular-nums mt-1">
                    {pendingCandidates.length}
                    <span className="text-sm font-normal text-text-secondary ml-2">pending candidates</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                    Review and resolve suspected duplicate entity pairs awaiting review.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-accent/15 border border-accent/25 text-accent shrink-0">
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Latest Alerts List */}
          <Card>
            <CardHeader
              action={
                <Link to="/alerts" className="text-xs text-accent hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              <CardTitle>Latest Alerts</CardTitle>
              <CardDescription>Most recent investigation alerts</CardDescription>
            </CardHeader>

            <div className="divide-y divide-border-subtle">
              {alertsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="py-3 animate-pulse space-y-2">
                    <div className="h-4 bg-surface-raised rounded w-3/4" />
                    <div className="h-3 bg-surface-raised rounded w-1/2" />
                  </div>
                ))
              ) : latestAlerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">No alerts flagged yet.</div>
              ) : (
                latestAlerts.map((alt) => (
                  <div key={alt.id} className="py-3 flex items-start justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">{alt.title}</div>
                      <div className="text-xs text-text-muted mt-0.5 truncate">{alt.description}</div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <SeverityBadge severity={alt.severity} />
                      <StatusBadge status={alt.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Latest Entities List */}
          <Card>
            <CardHeader
              action={
                <Link to="/entities" className="text-xs text-accent hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              <CardTitle>Recent Entities</CardTitle>
              <CardDescription>Newest entities recorded in intelligence bank</CardDescription>
            </CardHeader>

            <div className="divide-y divide-border-subtle">
              {entitiesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="py-3 animate-pulse space-y-2">
                    <div className="h-4 bg-surface-raised rounded w-3/4" />
                    <div className="h-3 bg-surface-raised rounded w-1/2" />
                  </div>
                ))
              ) : latestEntities.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">No entities recorded yet.</div>
              ) : (
                latestEntities.map((ent) => (
                  <Link
                    key={ent.id}
                    to={`/entities/${ent.id}`}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-surface-raised/40 px-2 -mx-2 rounded transition-colors first:pt-1 last:pb-1"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">{ent.canonical_name}</div>
                      <div className="text-[11px] text-text-muted font-mono truncate">
                        {ent.id.slice(0, 16)}...
                      </div>
                    </div>
                    <div className="shrink-0">
                      <EntityTypeBadge type={ent.entity_type} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
