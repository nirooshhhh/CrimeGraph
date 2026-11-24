import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Layers, Plus, ExternalLink, Calendar, Database } from 'lucide-react';
import { fetchSources, createSource, fetchCases } from '../api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/FormFields';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type { Source, CreateSourcePayload } from '../types';

export const SourcesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<CreateSourcePayload>({
    source_type: '',
    source_name: '',
    case_id: '',
    description: '',
    reference_code: '',
  });

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: fetchCases,
  });

  const caseMap = React.useMemo(() => {
    const map = new Map<string, string>();
    cases.forEach((c) => map.set(c.id, `${c.case_number} - ${c.title}`));
    return map;
  }, [cases]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateSourcePayload) => {
      const cleaned: CreateSourcePayload = {
        source_type: payload.source_type.trim(),
        source_name: payload.source_name.trim(),
      };
      if (payload.case_id?.trim()) cleaned.case_id = payload.case_id.trim();
      if (payload.description?.trim()) cleaned.description = payload.description.trim();
      if (payload.reference_code?.trim()) cleaned.reference_code = payload.reference_code.trim();
      return createSource(cleaned);
    },
    onSuccess: (newSource) => {
      queryClient.invalidateQueries({ queryKey: ['sources'] });
      success(`Source "${newSource.source_name}" registered successfully`);
      setIsModalOpen(false);
      setFormValues({
        source_type: '',
        source_name: '',
        case_id: '',
        description: '',
        reference_code: '',
      });
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to register source');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.source_type.trim() || !formValues.source_name.trim()) {
      toastError('Source type and source name are required');
      return;
    }
    createMutation.mutate(formValues);
  };

  const columns: Column<Source>[] = [
    {
      key: 'source_name',
      header: 'Source Origin',
      render: (row) => (
        <div>
          <div className="font-medium text-text-primary flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-accent" />
            {row.source_name}
          </div>
          {row.description && <div className="text-xs text-text-muted mt-0.5 max-w-md truncate">{row.description}</div>}
        </div>
      ),
    },
    {
      key: 'source_type',
      header: 'Type Category',
      render: (row) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-raised border border-border text-text-secondary">
          {row.source_type}
        </span>
      ),
    },
    {
      key: 'reference_code',
      header: 'Reference Code',
      render: (row) => (
        <span className="font-mono text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
          {row.reference_code || '—'}
        </span>
      ),
    },
    {
      key: 'case_id',
      header: 'Linked Case',
      render: (row) =>
        row.case_id ? (
          <Link
            to={`/cases/${row.case_id}`}
            className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
          >
            <span>{caseMap.get(row.case_id) || `${row.case_id.slice(0, 8)}...`}</span>
            <ExternalLink className="w-3 h-3 text-text-muted" />
          </Link>
        ) : (
          <span className="text-xs text-text-muted">Unlinked (Global)</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Registered Date',
      render: (row) => (
        <span className="text-xs text-text-muted tabular-nums">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Intelligence Sources</h2>
          <p className="text-sm text-text-secondary mt-1">
            Registered evidentiary data origins, telecom records providers, and investigative agencies.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Register Source
        </Button>
      </div>

      <DataTable
        data={sources}
        columns={columns}
        searchPlaceholder="Search sources by name, category, or ref code..."
        isLoading={isLoading}
        emptyTitle="No sources found"
        emptyDescription="Register intelligence sources to trace evidence originators."
        emptyAction={
          <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Register Source
          </Button>
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Intelligence Source"
        description="Add a new data origin or document provider record."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Source Type"
            required
            placeholder="e.g. Telecom CDR, Bank Records, Intercept, Informant, Surveillance"
            value={formValues.source_type}
            onChange={(e) => setFormValues({ ...formValues, source_type: e.target.value })}
            helperText="Free text per backend contract"
          />

          <Input
            label="Source Name"
            required
            placeholder="e.g. Jio CDR Gateway - Sector 4 Dump"
            value={formValues.source_name}
            onChange={(e) => setFormValues({ ...formValues, source_name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reference Code"
              placeholder="e.g. SRC-CDR-2026-09"
              value={formValues.reference_code || ''}
              onChange={(e) => setFormValues({ ...formValues, reference_code: e.target.value })}
            />
            <Select
              label="Associate with Investigation (Optional)"
              value={formValues.case_id || ''}
              onChange={(e) => setFormValues({ ...formValues, case_id: e.target.value })}
            >
              <option value="">-- Global / Unlinked --</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} - {c.title}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Description / Custody Details"
            rows={2}
            placeholder="Officer in charge, authorization warrant, acquisition notes..."
            value={formValues.description || ''}
            onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Register Source
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
