import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PhoneCall, Plus, ArrowRight, Clock, Phone, ExternalLink } from 'lucide-react';
import { fetchCallRecords, createCallRecord, fetchSources } from '../api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input, Select } from '../components/common/FormFields';
import { useEntityMap } from '../context/EntityMapContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type { CallRecord, CreateCallRecordPayload } from '../types';

export const CallRecordsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { entities, getEntityName, getEntity } = useEntityMap();
  const { success, error: toastError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCallTypeFilter, setSelectedCallTypeFilter] = useState('');
  const [formValues, setFormValues] = useState<{
    caller_entity_id: string;
    receiver_entity_id: string;
    call_time: string;
    duration_seconds: number;
    call_type: string;
    reference_code: string;
    source_id: string;
  }>({
    caller_entity_id: '',
    receiver_entity_id: '',
    call_time: new Date().toISOString().slice(0, 16),
    duration_seconds: 60,
    call_type: 'voice',
    reference_code: '',
    source_id: '',
  });

  const { data: callRecords = [], isLoading } = useQuery({
    queryKey: ['call-records'],
    queryFn: fetchCallRecords,
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
  });

  // Client filtering
  const filteredRecords = useMemo(() => {
    if (!selectedCallTypeFilter) return callRecords;
    return callRecords.filter(
      (r) => (r.call_type || '').toLowerCase() === selectedCallTypeFilter.toLowerCase()
    );
  }, [callRecords, selectedCallTypeFilter]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateCallRecordPayload) => {
      if (payload.caller_entity_id === payload.receiver_entity_id) {
        throw new Error('Caller and receiver entities must differ');
      }
      return createCallRecord(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-records'] });
      success('Call record logged successfully');
      setIsModalOpen(false);
      setFormValues({
        caller_entity_id: '',
        receiver_entity_id: '',
        call_time: new Date().toISOString().slice(0, 16),
        duration_seconds: 60,
        call_type: 'voice',
        reference_code: '',
        source_id: '',
      });
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to log call record');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.caller_entity_id || !formValues.receiver_entity_id) {
      toastError('Caller and receiver entities are required');
      return;
    }
    if (formValues.caller_entity_id === formValues.receiver_entity_id) {
      toastError('Caller and receiver must be different entities');
      return;
    }
    if (!formValues.call_time) {
      toastError('Call time is required');
      return;
    }

    const payload: CreateCallRecordPayload = {
      caller_entity_id: formValues.caller_entity_id,
      receiver_entity_id: formValues.receiver_entity_id,
      call_time: new Date(formValues.call_time).toISOString(),
      duration_seconds: Number(formValues.duration_seconds) || 0,
    };
    if (formValues.call_type) payload.call_type = formValues.call_type;
    if (formValues.reference_code) payload.reference_code = formValues.reference_code;
    if (formValues.source_id) payload.source_id = formValues.source_id;

    createMutation.mutate(payload);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const columns: Column<CallRecord>[] = [
    {
      key: 'caller_entity_id',
      header: 'Caller Entity',
      render: (row) => (
        <Link
          to={`/entities/${row.caller_entity_id}`}
          className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5 text-text-muted" />
          <span>{getEntityName(row.caller_entity_id)}</span>
          <ExternalLink className="w-3 h-3 text-text-muted opacity-0 hover:opacity-100" />
        </Link>
      ),
    },
    {
      key: 'direction',
      header: '',
      sortable: false,
      render: () => <ArrowRight className="w-3.5 h-3.5 text-text-muted" />,
    },
    {
      key: 'receiver_entity_id',
      header: 'Receiver Entity',
      render: (row) => (
        <Link
          to={`/entities/${row.receiver_entity_id}`}
          className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5 text-text-muted" />
          <span>{getEntityName(row.receiver_entity_id)}</span>
          <ExternalLink className="w-3 h-3 text-text-muted opacity-0 hover:opacity-100" />
        </Link>
      ),
    },
    {
      key: 'call_time',
      header: 'Call Timestamp',
      render: (row) => (
        <span className="text-xs text-text-muted tabular-nums">
          {new Date(row.call_time).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'duration_seconds',
      header: 'Duration',
      render: (row) => (
        <span className="text-xs font-mono tabular-nums text-text-primary flex items-center gap-1">
          <Clock className="w-3 h-3 text-text-muted" />
          {formatDuration(row.duration_seconds)}
          <span className="text-text-muted text-[10px]">({row.duration_seconds}s)</span>
        </span>
      ),
    },
    {
      key: 'call_type',
      header: 'Call Type',
      render: (row) => (
        <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-surface-raised border border-border text-text-secondary">
          {row.call_type || 'voice'}
        </span>
      ),
    },
    {
      key: 'reference_code',
      header: 'CDR Reference',
      render: (row) => (
        <span className="font-mono text-xs text-text-muted">{row.reference_code || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Call Detail Records (CDR)</h2>
          <p className="text-sm text-text-secondary mt-1">
            Telecommunication intercepts, call logs, duration timestamps, and phone identity linkages.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Log Call Record
        </Button>
      </div>

      <DataTable
        data={filteredRecords}
        columns={columns}
        searchPlaceholder="Search calls by entity names or ref code..."
        searchFilter={(item, q) => {
          const cName = getEntityName(item.caller_entity_id).toLowerCase();
          const rName = getEntityName(item.receiver_entity_id).toLowerCase();
          const ref = (item.reference_code || '').toLowerCase();
          return cName.includes(q) || rName.includes(q) || ref.includes(q);
        }}
        filterControls={
          <div className="flex items-center gap-2">
            <select
              value={selectedCallTypeFilter}
              onChange={(e) => setSelectedCallTypeFilter(e.target.value)}
              className="bg-surface-raised border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">All Call Types</option>
              <option value="voice">Voice</option>
              <option value="sms">SMS</option>
              <option value="voip">VoIP</option>
              <option value="video">Video</option>
            </select>
          </div>
        }
        isLoading={isLoading}
        emptyTitle="No call records logged"
        emptyDescription="Telecommunication call events linking caller and receiver entities will appear here."
        emptyAction={
          <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Log Call Record
          </Button>
        }
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Telecommunication Call Record"
        description="Record a direct call transmission between two known entities."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Caller Entity"
              required
              value={formValues.caller_entity_id}
              onChange={(e) => setFormValues({ ...formValues, caller_entity_id: e.target.value })}
            >
              <option value="">-- Select Caller --</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.canonical_name} ({e.entity_type})
                </option>
              ))}
            </Select>

            <Select
              label="Receiver Entity"
              required
              value={formValues.receiver_entity_id}
              onChange={(e) => setFormValues({ ...formValues, receiver_entity_id: e.target.value })}
            >
              <option value="">-- Select Receiver --</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.canonical_name} ({e.entity_type})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Call Timestamp"
              type="datetime-local"
              required
              value={formValues.call_time}
              onChange={(e) => setFormValues({ ...formValues, call_time: e.target.value })}
            />
            <Input
              label="Duration (Seconds)"
              type="number"
              min="0"
              required
              value={formValues.duration_seconds}
              onChange={(e) => setFormValues({ ...formValues, duration_seconds: parseInt(e.target.value, 10) || 0 })}
              helperText="Sent as integer JSON number"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Call Type"
              placeholder="e.g. voice, sms, voip"
              value={formValues.call_type}
              onChange={(e) => setFormValues({ ...formValues, call_type: e.target.value })}
            />
            <Input
              label="Reference Code"
              placeholder="e.g. CDR-TOWER-771"
              value={formValues.reference_code}
              onChange={(e) => setFormValues({ ...formValues, reference_code: e.target.value })}
            />
          </div>

          <Select
            label="Originating Source (Optional)"
            value={formValues.source_id}
            onChange={(e) => setFormValues({ ...formValues, source_id: e.target.value })}
          >
            <option value="">-- No Source Linked --</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.source_name} ({s.source_type})
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Save Call Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
