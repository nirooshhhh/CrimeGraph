import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BellRing,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Activity,
  Layers,
  Network,
  ExternalLink,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  fetchAlerts,
  createAlert,
  updateAlertStatus,
  fetchCases,
  analyzeGraphByCase,
} from '../api';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { Input, Select, Textarea } from '../components/common/FormFields';
import { SeverityBadge, StatusBadge } from '../components/common/Badge';
import { useEntityMap } from '../context/EntityMapContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type { Alert, AlertSeverity, AlertStatus, CreateAlertPayload } from '../types';

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { getEntityName } = useEntityMap();
  const { success, error: toastError } = useToast();

  // Filters state
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [caseFilter, setCaseFilter] = useState('');

  // Drawer / Modals
  const [selectedAlertForDrawer, setSelectedAlertForDrawer] = useState<Alert | null>(null);
  const [reviewerNameInput, setReviewerNameInput] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    alert_type: string;
    title: string;
    description: string;
    severity: AlertSeverity;
    case_id: string;
    reasonKey: string;
    reasonVal: string;
  }>({
    alert_type: '',
    title: '',
    description: '',
    severity: 'medium',
    case_id: '',
    reasonKey: 'trigger',
    reasonVal: '',
  });

  // Network Metrics Investigation Selector
  const [metricsCaseId, setMetricsCaseId] = useState('');

  // Queries
  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  const caseMap = useMemo(() => {
    const map = new Map<string, string>();
    cases.forEach((c) => map.set(c.id, `${c.case_number} - ${c.title}`));
    return map;
  }, [cases]);

  // Set default case for network metrics
  React.useEffect(() => {
    if (!metricsCaseId && cases.length > 0) {
      setMetricsCaseId(cases[0].id);
    }
  }, [cases, metricsCaseId]);

  // Query Network Metrics for selected case
  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['graph', 'case', metricsCaseId, 'analyze'],
    queryFn: () => analyzeGraphByCase(metricsCaseId),
    enabled: !!metricsCaseId,
    retry: 1,
  });

  // Client-side filtering
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter && a.severity.toLowerCase() !== severityFilter.toLowerCase()) return false;
      if (statusFilter && a.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (caseFilter && a.case_id !== caseFilter) return false;
      return true;
    });
  }, [alerts, severityFilter, statusFilter, caseFilter]);

  // Top 10 connected entities for metrics bar chart
  const topConnectedData = useMemo(() => {
    if (!metricsData?.connections) return [];
    return Object.entries(metricsData.connections)
      .map(([id, degree]) => ({
        id,
        name: getEntityName(id),
        degree,
      }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 10);
  }, [metricsData, getEntityName]);

  const isValidUuid = (val?: string) =>
    !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reviewer }: { id: string; status: AlertStatus; reviewer?: string }) => {
      return updateAlertStatus(id, {
        status,
        reviewed_by: isValidUuid(reviewer) ? reviewer?.trim() : undefined,
      });
    },
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success(`Alert status changed to "${updatedAlert.status}"`);
      if (selectedAlertForDrawer && selectedAlertForDrawer.id === updatedAlert.id) {
        setSelectedAlertForDrawer(updatedAlert);
      }
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Status update failed');
    },
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!createForm.alert_type.trim() || !createForm.title.trim() || !createForm.description.trim()) {
        throw new Error('Alert type, title, and description are required');
      }

      const payload: CreateAlertPayload = {
        alert_type: createForm.alert_type.trim(),
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        severity: createForm.severity,
      };
      if (createForm.case_id) payload.case_id = createForm.case_id;
      if (createForm.reasonKey.trim() && createForm.reasonVal.trim()) {
        payload.reason = {
          [createForm.reasonKey.trim()]: createForm.reasonVal.trim(),
        };
      }
      return createAlert(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success('Alert flagged successfully');
      setIsCreateOpen(false);
      setCreateForm({
        alert_type: '',
        title: '',
        description: '',
        severity: 'medium',
        case_id: '',
        reasonKey: 'trigger',
        reasonVal: '',
      });
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to create alert');
    },
  });

  const isMetricsServiceDown = metricsError && getErrorMessage(metricsError).includes('500');

  const columns: Column<Alert>[] = [
    {
      key: 'title',
      header: 'Alert Title',
      render: (row) => (
        <div>
          <div className="font-medium text-text-primary flex items-center gap-2">
            <BellRing className="w-3.5 h-3.5 text-accent" />
            {row.title}
          </div>
          <div className="text-xs text-text-muted mt-0.5 truncate max-w-md">{row.description}</div>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (row) => <SeverityBadge severity={row.severity} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'case_id',
      header: 'Investigation',
      render: (row) =>
        row.case_id ? (
          <Link
            to={`/cases/${row.case_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
          >
            <span>{caseMap.get(row.case_id) || `${row.case_id.slice(0, 8)}...`}</span>
            <ExternalLink className="w-3 h-3 text-text-muted" />
          </Link>
        ) : (
          <span className="text-xs text-text-muted">Unlinked</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Flagged Date',
      render: (row) => (
        <span className="text-xs text-text-muted tabular-nums">
          {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      align: 'right',
      render: (row) => (
        <button
          onClick={() => setSelectedAlertForDrawer(row)}
          className="text-xs text-accent hover:underline font-medium"
        >
          View Details →
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Alerts & Analytics</h2>
          <p className="text-sm text-text-secondary mt-1">
            Tactical priority flags, investigation triggers, and network metric analytics.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Flag New Alert
        </Button>
      </div>

      {/* Network Metrics Panel per prompt requirement */}
      <Card className="border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Investigation Network Metrics</CardTitle>
              <CardDescription>
                Calculated graph topology, cluster counts, and degree centrality metrics
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted whitespace-nowrap">Analyze Case:</span>
            <select
              value={metricsCaseId}
              onChange={(e) => setMetricsCaseId(e.target.value)}
              className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent min-w-[220px]"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metrics Body */}
        {isMetricsServiceDown ? (
          <div className="p-6 text-center text-status-error text-xs bg-status-error/10 border border-status-error/30 rounded-lg my-4 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Graph service unavailable (port 8001). Please ensure graph-service is running.</span>
          </div>
        ) : metricsLoading ? (
          <div className="py-12 text-center text-xs text-text-muted animate-pulse">
            Loading investigation graph metrics...
          </div>
        ) : (
          <div className="pt-4 space-y-6">
            {/* Top 3 KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-card bg-surface-raised border border-border">
                <div className="text-xs font-semibold uppercase text-text-muted">Total Nodes</div>
                <div className="text-3xl font-bold text-text-primary tabular-nums mt-1">
                  {metricsData?.node_count ?? 0}
                </div>
                <div className="text-[11px] text-text-muted mt-1">Entities in this investigation</div>
              </div>

              <div className="p-4 rounded-card bg-surface-raised border border-border">
                <div className="text-xs font-semibold uppercase text-text-muted">Total Edges</div>
                <div className="text-3xl font-bold text-text-primary tabular-nums mt-1">
                  {metricsData?.edge_count ?? 0}
                </div>
                <div className="text-[11px] text-text-muted mt-1">Verified relationships</div>
              </div>

              <div className="p-4 rounded-card bg-surface-raised border border-border">
                <div className="text-xs font-semibold uppercase text-text-muted">Connected Clusters</div>
                <div className="text-3xl font-bold text-text-primary tabular-nums mt-1">
                  {metricsData?.connected_group_count ?? 0}
                </div>
                <div className="text-[11px] text-text-muted mt-1">Independent network components</div>
              </div>
            </div>

            {/* Top 10 by Connections & Bar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Top 10 Ranked List */}
              <div className="lg:col-span-5 space-y-2">
                <div className="text-xs font-semibold uppercase text-text-muted mb-2">
                  Top 10 Entities by Connection Degree:
                </div>
                {topConnectedData.length === 0 ? (
                  <div className="text-xs text-text-muted py-6 text-center">
                    No connections registered for this case yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {topConnectedData.map((item, idx) => (
                      <Link
                        key={item.id}
                        to={`/entities/${item.id}`}
                        className="p-2.5 rounded-lg bg-surface-raised hover:bg-surface-raised/80 border border-border-subtle flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-surface border border-border text-text-muted flex items-center justify-center text-[10px] font-mono">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-text-primary truncate">{item.name}</span>
                        </div>
                        <span className="font-mono text-accent font-bold tabular-nums shrink-0 ml-2">
                          {item.degree} links
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Bar Chart of Top 10 */}
              <div className="lg:col-span-7 bg-surface-raised/40 p-4 rounded-card border border-border-subtle">
                <div className="text-xs font-semibold uppercase text-text-muted mb-3">
                  Connection Centrality Distribution
                </div>
                {topConnectedData.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-xs text-text-muted">
                    No data to chart.
                  </div>
                ) : (
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topConnectedData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                      >
                        <XAxis
                          dataKey="name"
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                        />
                        <YAxis
                          stroke="#64748B"
                          fontSize={11}
                          tickLine={false}
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
                          formatter={(val: number) => [`${val} connections`, 'Degree']}
                        />
                        <Bar dataKey="degree" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Note in UI per prompt */}
      <div className="p-3.5 rounded-lg bg-surface-raised border border-border-subtle flex items-start gap-3 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-primary">Note:</strong> Nothing creates alerts automatically in the backend.
          Alerts are user-created or manually flagged intelligence entries.
        </div>
      </div>

      {/* Alerts Table with Client-Side Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Active Intelligence Alerts</CardTitle>
          <CardDescription>
            Filter by severity, resolution status, or associated case file.
          </CardDescription>
        </CardHeader>

        <DataTable
          data={filteredAlerts}
          columns={columns}
          searchPlaceholder="Search alerts by title or description..."
          onRowClick={(row) => setSelectedAlertForDrawer(row)}
          filterControls={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-surface-raised border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface-raised border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>

              {/* Case Filter */}
              <select
                value={caseFilter}
                onChange={(e) => setCaseFilter(e.target.value)}
                className="bg-surface-raised border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent max-w-[200px]"
              >
                <option value="">All Investigations</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number}
                  </option>
                ))}
              </select>
            </div>
          }
          isLoading={alertsLoading}
          emptyTitle="No alerts matching filters"
          emptyDescription="There are no alerts matching the selected severity, status, or case criteria."
          emptyAction={
            <Button size="sm" onClick={() => setIsCreateOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
              Flag New Alert
            </Button>
          }
        />
      </Card>

      {/* Alert Detail Drawer */}
      <Drawer
        isOpen={!!selectedAlertForDrawer}
        onClose={() => setSelectedAlertForDrawer(null)}
        title="Alert Intelligence Dossier"
        description={selectedAlertForDrawer?.title}
      >
        {selectedAlertForDrawer && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={selectedAlertForDrawer.severity} />
              <StatusBadge status={selectedAlertForDrawer.status} />
              <span className="font-mono text-xs text-text-muted">
                Type: {selectedAlertForDrawer.alert_type}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-text-primary">{selectedAlertForDrawer.title}</h3>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                {selectedAlertForDrawer.description}
              </p>
            </div>

            {/* Associated Investigation */}
            {selectedAlertForDrawer.case_id && (
              <div className="p-3 rounded-lg bg-surface-raised border border-border text-xs">
                <span className="text-text-muted block mb-1">Associated Case:</span>
                <Link
                  to={`/cases/${selectedAlertForDrawer.case_id}`}
                  className="font-medium text-accent hover:underline flex items-center gap-1"
                >
                  <span>{caseMap.get(selectedAlertForDrawer.case_id) || selectedAlertForDrawer.case_id}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Reason Key/Value */}
            {selectedAlertForDrawer.reason && Object.keys(selectedAlertForDrawer.reason).length > 0 && (
              <div>
                <div className="text-xs font-semibold uppercase text-text-muted mb-2">Trigger Rationale:</div>
                <div className="space-y-1.5">
                  {Object.entries(selectedAlertForDrawer.reason).map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded bg-surface-raised border border-border text-xs">
                      <span className="font-mono text-text-muted font-medium">{k}: </span>
                      <span className="text-text-primary">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviewer info if reviewed */}
            {selectedAlertForDrawer.reviewed_by && (
              <div className="p-3 rounded-lg bg-surface-raised border border-border text-xs space-y-1">
                <div className="text-text-muted">
                  Reviewed by: <strong className="text-text-primary">{selectedAlertForDrawer.reviewed_by}</strong>
                </div>
                {selectedAlertForDrawer.reviewed_at && (
                  <div className="text-text-muted tabular-nums">
                    On {new Date(selectedAlertForDrawer.reviewed_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Status Change Actions per prompt */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="text-xs font-semibold uppercase text-text-muted">Update Alert Status:</div>

              <Input
                label="Reviewer Name (Optional)"
                placeholder="e.g. Lead Analyst Vance"
                value={reviewerNameInput}
                onChange={(e) => setReviewerNameInput(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={selectedAlertForDrawer.status === 'reviewing'}
                  isLoading={updateStatusMutation.isPending}
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: selectedAlertForDrawer.id,
                      status: 'reviewing',
                      reviewer: reviewerNameInput,
                    })
                  }
                >
                  Mark Reviewing
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  disabled={selectedAlertForDrawer.status === 'resolved'}
                  isLoading={updateStatusMutation.isPending}
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: selectedAlertForDrawer.id,
                      status: 'resolved',
                      reviewer: reviewerNameInput,
                    })
                  }
                >
                  Mark Resolved
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={selectedAlertForDrawer.status === 'dismissed'}
                  isLoading={updateStatusMutation.isPending}
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: selectedAlertForDrawer.id,
                      status: 'dismissed',
                      reviewer: reviewerNameInput,
                    })
                  }
                >
                  Dismiss Alert
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  disabled={selectedAlertForDrawer.status === 'new'}
                  isLoading={updateStatusMutation.isPending}
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: selectedAlertForDrawer.id,
                      status: 'new',
                      reviewer: reviewerNameInput,
                    })
                  }
                >
                  Reset to New
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Flag Alert Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Flag Investigation Alert"
        description="Register a tactical intelligence alert for analyst surveillance."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Alert Type"
              required
              placeholder="e.g. Flight Risk, Money Laundering, Phone Sighting"
              value={createForm.alert_type}
              onChange={(e) => setCreateForm({ ...createForm, alert_type: e.target.value })}
              helperText="Free text per backend contract"
            />
            <Select
              label="Severity Level"
              value={createForm.severity}
              onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value as AlertSeverity })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </div>

          <Input
            label="Alert Title"
            required
            placeholder="e.g. High-value international remittance detected"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
          />

          <Select
            label="Associate with Investigation Case (Optional)"
            value={createForm.case_id}
            onChange={(e) => setCreateForm({ ...createForm, case_id: e.target.value })}
          >
            <option value="">-- Global / Unlinked Alert --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} - {c.title}
              </option>
            ))}
          </Select>

          <Textarea
            label="Description / Intelligence Narrative"
            required
            rows={3}
            placeholder="Detailed trigger rationale and recommended actions..."
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reason Key (Optional)"
              placeholder="e.g. trigger_rule, threshold"
              value={createForm.reasonKey}
              onChange={(e) => setCreateForm({ ...createForm, reasonKey: e.target.value })}
            />
            <Input
              label="Reason Value (Optional)"
              placeholder="e.g. Transfer exceeded 500,000 INR"
              value={createForm.reasonVal}
              onChange={(e) => setCreateForm({ ...createForm, reasonVal: e.target.value })}
            />
          </div>

          <p className="text-[11px] text-text-muted">
            Note: Nothing creates alerts automatically in the backend.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Flag Alert
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
