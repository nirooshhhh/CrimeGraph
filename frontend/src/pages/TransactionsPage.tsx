import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Plus, ArrowRight, DollarSign, ExternalLink, CreditCard } from 'lucide-react';
import { fetchTransactions, createTransaction, fetchSources } from '../api';
import { DataTable, Column } from '../components/common/DataTable';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input, Select } from '../components/common/FormFields';
import { Card } from '../components/common/Card';
import { useEntityMap } from '../context/EntityMapContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/client';
import type { Transaction, CreateTransactionPayload } from '../types';

export const TransactionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { entities, getEntityName } = useEntityMap();
  const { success, error: toastError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<{
    sender_entity_id: string;
    receiver_entity_id: string;
    amount: number;
    transaction_time: string;
    currency: string;
    transaction_type: string;
    transaction_reference: string;
    source_id: string;
  }>({
    sender_entity_id: '',
    receiver_entity_id: '',
    amount: 10000,
    transaction_time: new Date().toISOString().slice(0, 16),
    currency: 'INR',
    transaction_type: 'wire_transfer',
    transaction_reference: '',
    source_id: '',
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
  });

  // Totals per currency computed from real transaction rows
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of transactions) {
      const curr = (t.currency || 'INR').toUpperCase();
      totals[curr] = (totals[curr] || 0) + Number(t.amount || 0);
    }
    return totals;
  }, [transactions]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateTransactionPayload) => {
      if (payload.sender_entity_id === payload.receiver_entity_id) {
        throw new Error('Sender and receiver entities must differ');
      }
      return createTransaction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      success('Financial transaction recorded successfully');
      setIsModalOpen(false);
      setFormValues({
        sender_entity_id: '',
        receiver_entity_id: '',
        amount: 10000,
        transaction_time: new Date().toISOString().slice(0, 16),
        currency: 'INR',
        transaction_type: 'wire_transfer',
        transaction_reference: '',
        source_id: '',
      });
    },
    onError: (err) => {
      toastError(getErrorMessage(err), 'Failed to record transaction');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.sender_entity_id || !formValues.receiver_entity_id) {
      toastError('Sender and receiver entities are required');
      return;
    }
    if (formValues.sender_entity_id === formValues.receiver_entity_id) {
      toastError('Sender and receiver must be different entities');
      return;
    }
    if (Number(formValues.amount) < 0) {
      toastError('Amount must be non-negative');
      return;
    }

    const payload: CreateTransactionPayload = {
      sender_entity_id: formValues.sender_entity_id,
      receiver_entity_id: formValues.receiver_entity_id,
      amount: Number(formValues.amount),
      transaction_time: new Date(formValues.transaction_time).toISOString(),
      currency: formValues.currency || 'INR',
    };
    if (formValues.transaction_type) payload.transaction_type = formValues.transaction_type;
    if (formValues.transaction_reference) payload.transaction_reference = formValues.transaction_reference;
    if (formValues.source_id) payload.source_id = formValues.source_id;

    createMutation.mutate(payload);
  };

  const columns: Column<Transaction>[] = [
    {
      key: 'sender_entity_id',
      header: 'Sender Entity',
      render: (row) => (
        <Link
          to={`/entities/${row.sender_entity_id}`}
          className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1.5"
        >
          <CreditCard className="w-3.5 h-3.5 text-text-muted" />
          <span>{getEntityName(row.sender_entity_id)}</span>
          <ExternalLink className="w-3 h-3 text-text-muted opacity-0 hover:opacity-100" />
        </Link>
      ),
    },
    {
      key: 'arrow',
      header: '',
      sortable: false,
      render: () => <ArrowRight className="w-3.5 h-3.5 text-text-muted" />,
    },
    {
      key: 'receiver_entity_id',
      header: 'Beneficiary Entity',
      render: (row) => (
        <Link
          to={`/entities/${row.receiver_entity_id}`}
          className="font-medium text-text-primary hover:text-accent transition-colors flex items-center gap-1.5"
        >
          <CreditCard className="w-3.5 h-3.5 text-text-muted" />
          <span>{getEntityName(row.receiver_entity_id)}</span>
          <ExternalLink className="w-3 h-3 text-text-muted opacity-0 hover:opacity-100" />
        </Link>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className="font-mono font-semibold text-text-primary tabular-nums">
          {Number(row.amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          <span className="text-xs text-accent font-normal">{row.currency}</span>
        </span>
      ),
    },
    {
      key: 'transaction_time',
      header: 'Timestamp',
      render: (row) => (
        <span className="text-xs text-text-muted tabular-nums">
          {new Date(row.transaction_time).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'transaction_type',
      header: 'Method',
      render: (row) => (
        <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-surface-raised border border-border text-text-secondary">
          {row.transaction_type || 'transfer'}
        </span>
      ),
    },
    {
      key: 'transaction_reference',
      header: 'Ref / UTR',
      render: (row) => (
        <span className="font-mono text-xs text-text-muted">{row.transaction_reference || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary">Financial Transactions</h2>
          <p className="text-sm text-text-secondary mt-1">
            Bank transfers, hawala movements, account credits, and currency flow forensics.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Record Transaction
        </Button>
      </div>

      {/* Currency Totals Cards (computed from rows) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(totalsByCurrency).length === 0 ? (
          <Card className="col-span-full py-4 text-xs text-text-muted text-center">
            No transaction currency totals recorded yet.
          </Card>
        ) : (
          Object.entries(totalsByCurrency).map(([curr, total]) => (
            <Card key={curr}>
              <div className="text-xs font-semibold uppercase text-text-muted flex items-center justify-between">
                <span>Total Flow ({curr})</span>
                <DollarSign className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="text-2xl font-bold text-text-primary tabular-nums mt-1">
                {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-text-muted mt-1">Sum of recorded transfers</div>
            </Card>
          ))
        )}
      </div>

      {/* Table */}
      <DataTable
        data={transactions}
        columns={columns}
        searchPlaceholder="Search transactions by entity names, ref..."
        searchFilter={(item, q) => {
          const sName = getEntityName(item.sender_entity_id).toLowerCase();
          const rName = getEntityName(item.receiver_entity_id).toLowerCase();
          const ref = (item.transaction_reference || '').toLowerCase();
          return sName.includes(q) || rName.includes(q) || ref.includes(q);
        }}
        isLoading={isLoading}
        emptyTitle="No financial transactions recorded"
        emptyDescription="Record transfers and money flows between sender and beneficiary entities."
        emptyAction={
          <Button size="sm" onClick={() => setIsModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Record Transaction
          </Button>
        }
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Financial Transaction"
        description="Document a money transfer or financial trail between two entities."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Sender Entity"
              required
              value={formValues.sender_entity_id}
              onChange={(e) => setFormValues({ ...formValues, sender_entity_id: e.target.value })}
            >
              <option value="">-- Select Sender --</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.canonical_name} ({e.entity_type})
                </option>
              ))}
            </Select>

            <Select
              label="Beneficiary Entity"
              required
              value={formValues.receiver_entity_id}
              onChange={(e) => setFormValues({ ...formValues, receiver_entity_id: e.target.value })}
            >
              <option value="">-- Select Beneficiary --</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.canonical_name} ({e.entity_type})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount (≥ 0)"
              type="number"
              min="0"
              step="0.01"
              required
              value={formValues.amount}
              onChange={(e) => setFormValues({ ...formValues, amount: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Currency"
              required
              placeholder="e.g. INR, USD, EUR, AED"
              value={formValues.currency}
              onChange={(e) => setFormValues({ ...formValues, currency: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Transaction Time"
              type="datetime-local"
              required
              value={formValues.transaction_time}
              onChange={(e) => setFormValues({ ...formValues, transaction_time: e.target.value })}
            />
            <Input
              label="Transaction Type"
              placeholder="e.g. wire_transfer, cash, hawala, crypto"
              value={formValues.transaction_type}
              onChange={(e) => setFormValues({ ...formValues, transaction_type: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Reference / UTR / TxID"
              placeholder="e.g. UTR-20261124-9981"
              value={formValues.transaction_reference}
              onChange={(e) => setFormValues({ ...formValues, transaction_reference: e.target.value })}
            />
            <Select
              label="Originating Source (Optional)"
              value={formValues.source_id}
              onChange={(e) => setFormValues({ ...formValues, source_id: e.target.value })}
            >
              <option value="">-- No Source Linked --</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.source_name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Save Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
