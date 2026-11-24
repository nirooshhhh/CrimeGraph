import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Filter, Search, Calendar, User, Code, Info, ShieldCheck } from 'lucide-react';
import { fetchAuditLogs, fetchAuditLogsByTable, fetchAuditLogsByUser } from '../api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Card } from '../components/common/Card';
import type { AuditLog } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [selectedTableName, setSelectedTableName] = useState('');
  const [userIdSearch, setUserIdSearch] = useState('');
  const [activeUserFilter, setActiveUserFilter] = useState('');

  // Selected log for JSON details viewer modal
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<AuditLog | null>(null);

  // Dedicated endpoints when table name or user id filter is set per prompt:
  // "filter by table name and user id (use the dedicated endpoints when set)"
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', selectedTableName, activeUserFilter],
    queryFn: () => {
      if (selectedTableName) {
        return fetchAuditLogsByTable(selectedTableName);
      }
      if (activeUserFilter) {
        return fetchAuditLogsByUser(activeUserFilter);
      }
      return fetchAuditLogs();
    },
  });

  const handleApplyUserFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedTableName('');
    setActiveUserFilter(userIdSearch.trim());
  };

  const handleResetFilters = () => {
    setSelectedTableName('');
    setUserIdSearch('');
    setActiveUserFilter('');
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'action',
      header: 'Action Taken',
      render: (row) => {
        const action = row.action?.toUpperCase() || 'UNKNOWN';
        let badgeColor = 'bg-surface-raised text-text-secondary border-border';
        if (action.includes('CREATE') || action.includes('INSERT')) {
          badgeColor = 'bg-status-success/15 text-status-success border-status-success/30';
        } else if (action.includes('UPDATE') || action.includes('REVIEW')) {
          badgeColor = 'bg-accent/15 text-accent border-accent/30';
        } else if (action.includes('DELETE')) {
          badgeColor = 'bg-status-error/15 text-status-error border-status-error/30';
        }

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold border ${badgeColor}`}>
            {action}
          </span>
        );
      },
    },
    {
      key: 'table_name',
      header: 'Target Table',
      render: (row) => (
        <span className="font-mono text-xs text-text-primary px-2 py-0.5 rounded bg-surface-raised border border-border">
          {row.table_name}
        </span>
      ),
    },
    {
      key: 'record_id',
      header: 'Record Identifier',
      render: (row) => (
        <span className="font-mono text-xs text-text-muted">{row.record_id || '—'}</span>
      ),
    },
    {
      key: 'user_id',
      header: 'User / Identity',
      render: (row) => (
        <span className="text-xs text-text-secondary flex items-center gap-1">
          <User className="w-3 h-3 text-text-muted" />
          {row.user_id || 'System Process'}
        </span>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      render: (row) => (
        <span className="font-mono text-xs text-text-muted">{row.ip_address || '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (row) => (
        <span className="text-xs text-text-muted tabular-nums">
          {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Payload Details',
      sortable: false,
      align: 'right',
      render: (row) =>
        row.details && Object.keys(row.details).length > 0 ? (
          <button
            onClick={() => setSelectedLogForDetails(row)}
            className="text-xs text-accent hover:underline flex items-center gap-1 font-mono justify-end"
          >
            <Code className="w-3.5 h-3.5" />
            <span>View JSON</span>
          </button>
        ) : (
          <span className="text-xs text-text-muted">None</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">System Audit Trail</h2>
          <p className="text-sm text-text-secondary mt-1">
            Read-only immutable activity trail of administrative actions and data operations.
          </p>
        </div>
      </div>

      {/* Honest Empty State / Limitation Banner per prompt */}
      <div className="p-3.5 rounded-lg bg-surface-raised border border-border-subtle flex items-start gap-3 text-xs text-text-secondary">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-primary">Audit Policy Note:</strong> The backend does not write audit logs
          automatically by itself, so this repository table may be sparse or empty unless explicit audit actions are
          triggered by backend services. This page is strictly read-only.
        </div>
      </div>

      {/* Filter Bar with Dedicated Endpoints per prompt */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Filter by Table Name */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-muted">Table:</span>
              <select
                value={selectedTableName}
                onChange={(e) => {
                  setActiveUserFilter('');
                  setUserIdSearch('');
                  setSelectedTableName(e.target.value);
                }}
                className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">All Tables</option>
                <option value="cases">cases</option>
                <option value="entities">entities</option>
                <option value="documents">documents</option>
                <option value="relationships">relationships</option>
                <option value="alerts">alerts</option>
                <option value="sources">sources</option>
                <option value="call_records">call_records</option>
                <option value="transactions">transactions</option>
              </select>
            </div>

            {/* Filter by User ID */}
            <form onSubmit={handleApplyUserFilter} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Filter by User ID..."
                value={userIdSearch}
                onChange={(e) => setUserIdSearch(e.target.value)}
                className="bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent w-40"
              />
              <Button type="submit" size="sm" variant="secondary">
                Filter User
              </Button>
            </form>

            {(selectedTableName || activeUserFilter) && (
              <Button size="sm" variant="ghost" onClick={handleResetFilters}>
                Reset Filter
              </Button>
            )}
          </div>

          <div className="text-xs text-text-muted font-mono tabular-nums">
            {auditLogs.length} audit events recorded
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <DataTable
        data={auditLogs}
        columns={columns}
        searchPlaceholder="Search logs by action, table, or user..."
        isLoading={isLoading}
        emptyTitle="No audit logs recorded"
        emptyDescription="Audit logging is not automatic in the backend; logs will appear here when recorded."
      />

      {/* Details JSON Viewer Modal */}
      <Modal
        isOpen={!!selectedLogForDetails}
        onClose={() => setSelectedLogForDetails(null)}
        title="Audit Event Details (JSON)"
        description={`Record action: ${selectedLogForDetails?.action} on table: ${selectedLogForDetails?.table_name}`}
      >
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-bg-canvas border border-border font-mono text-xs text-text-primary overflow-x-auto max-h-96">
            <pre>{JSON.stringify(selectedLogForDetails?.details, null, 2)}</pre>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setSelectedLogForDetails(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
