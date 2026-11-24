import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, ArrowRight, Calendar, User, ShieldAlert } from 'lucide-react';
import { fetchCases, createCase } from '../api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input, Textarea } from '../components/common/FormFields';
import { StatusBadge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type { Case, CreateCasePayload } from '../types';

export const InvestigationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<CreateCasePayload>({
    case_number: '',
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    created_by: '',
  });

  const {
    data: cases = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCasePayload) => {
      // Omit blank optional fields
      const cleaned: CreateCasePayload = {
        case_number: payload.case_number.trim(),
        title: payload.title.trim(),
      };
      if (payload.description?.trim()) cleaned.description = payload.description.trim();
      if (payload.status?.trim()) cleaned.status = payload.status.trim();
      if (payload.priority?.trim()) cleaned.priority = payload.priority.trim();
      if (payload.created_by?.trim()) cleaned.created_by = payload.created_by.trim();
      return createCase(cleaned);
    },
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success(`Investigation ${newCase.case_number} created successfully`);
      setIsModalOpen(false);
      setFormValues({
        case_number: '',
        title: '',
        description: '',
        status: 'open',
        priority: 'medium',
        created_by: '',
      });
      navigate(`/cases/${newCase.id}`);
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to create investigation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.case_number.trim() || !formValues.title.trim()) {
      toastError('Case number and title are required');
      return;
    }
    createMutation.mutate(formValues);
  };

  const columns: Column<Case>[] = [
    {
      key: 'case_number',
      header: 'Case Number',
      render: (row) => (
        <span className="font-mono font-semibold text-accent flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-text-muted" />
          {row.case_number}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title & Summary',
      render: (row) => (
        <div className="max-w-md">
          <div className="font-medium text-text-primary truncate">{row.title}</div>
          {row.description && (
            <div className="text-xs text-text-muted truncate mt-0.5">{row.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-surface-raised border border-border text-text-secondary">
          {row.priority || 'standard'}
        </span>
      ),
    },
    {
      key: 'created_by',
      header: 'Lead Analyst',
      render: (row) => (
        <span className="text-xs text-text-secondary flex items-center gap-1">
          <User className="w-3 h-3 text-text-muted" />
          {row.created_by || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Opened Date',
      render: (row) => (
        <span className="text-xs text-text-muted tabular-nums">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      align: 'right',
      render: () => (
        <span className="text-xs text-accent flex items-center gap-1 justify-end font-medium">
          Open Case <ArrowRight className="w-3.5 h-3.5" />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Investigations</h2>
          <p className="text-sm text-text-secondary mt-1">
            Active criminal cases, intelligence dossiers, and cross-source investigations.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Investigation
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={cases}
        columns={columns}
        searchPlaceholder="Search cases by number, title, lead analyst..."
        onRowClick={(row) => navigate(`/cases/${row.id}`)}
        isLoading={isLoading}
        emptyTitle="No investigations registered"
        emptyDescription="Create your first investigation case to link suspects, evidence files, and intelligence sources."
        emptyAction={
          <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Create Investigation
          </Button>
        }
      />

      {/* New Investigation Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Open New Investigation"
        description="Register a new case file in the CrimeGraph intelligence repository."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Case Number"
              required
              placeholder="e.g. CR-2026-0842"
              value={formValues.case_number}
              onChange={(e) => setFormValues({ ...formValues, case_number: e.target.value })}
            />
            <Input
              label="Lead Analyst / Created By"
              placeholder="e.g. Agent R. Sharma"
              value={formValues.created_by || ''}
              onChange={(e) => setFormValues({ ...formValues, created_by: e.target.value })}
            />
          </div>

          <Input
            label="Investigation Title"
            required
            placeholder="e.g. Cyber Extortion & Syndicate Money Laundering"
            value={formValues.title}
            onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
          />

          <Textarea
            label="Description / Case Brief"
            placeholder="Key facts, suspected activities, and operational objectives..."
            rows={3}
            value={formValues.description || ''}
            onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Status"
              placeholder="e.g. open, in_progress, under_review"
              value={formValues.status || ''}
              onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
              helperText="Allowed values free-text per backend contract"
            />
            <Input
              label="Priority"
              placeholder="e.g. low, medium, high, critical"
              value={formValues.priority || ''}
              onChange={(e) => setFormValues({ ...formValues, priority: e.target.value })}
              helperText="Allowed values free-text per backend contract"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Case File
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
