import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  ArrowLeftRight,
  Search,
  Filter,
  Plus,
  TrendingUp,
  AlertTriangle,
  Coins,
  Shield,
  Layers,
  CheckCircle2,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { transactionsService } from '../services/transactionsService'
import { DEMO_TRANSACTIONS, DEMO_CASES } from '../data/demoData'
import { Transaction, Case } from '../types'
import { formatDate, formatCurrency, formatRelativeTime } from '../lib/utils'

export const TransactionsPage: React.FC = () => {
  const { cases, activeCaseId, isLiveApi } = useOutletContext<{
    cases: Case[]
    activeCaseId: string
    isLiveApi: boolean
  }>()

  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // New Transaction Form
  const [senderAccount, setSenderAccount] = useState('')
  const [receiverAccount, setReceiverAccount] = useState('')
  const [amount, setAmount] = useState(250000)
  const [currency, setCurrency] = useState('USD')
  const [txType, setTxType] = useState('SWIFT_WIRE')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [isFlagged, setIsFlagged] = useState(false)
  const [formCaseId, setFormCaseId] = useState(cases[0]?.id || 'case-001')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      if (isLiveApi) {
        const data = await transactionsService.getTransactions()
        if (data && data.length > 0) setTransactions(data)
      }
    } catch (err) {
      console.warn('Failed loading transactions from live API', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [isLiveApi])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!senderAccount.trim() || !receiverAccount.trim() || !amount) return

    setIsSubmitting(true)
    try {
      const payload = {
        case_id: formCaseId,
        sender_account: senderAccount.trim(),
        receiver_account: receiverAccount.trim(),
        amount: Number(amount),
        currency: currency.toUpperCase(),
        transaction_timestamp: new Date().toISOString(),
        transaction_type: txType,
        reference_number: referenceNumber.trim() || `TX-${Date.now()}`,
        flagged: isFlagged,
      }

      if (isLiveApi) {
        const created = await transactionsService.createTransaction(payload)
        setTransactions((prev) => [created, ...prev])
      } else {
        const synthetic: Transaction = {
          id: `tx-${Date.now()}`,
          case_id: payload.case_id,
          sender_account: payload.sender_account,
          receiver_account: payload.receiver_account,
          amount: payload.amount,
          currency: payload.currency,
          transaction_timestamp: payload.transaction_timestamp,
          transaction_type: payload.transaction_type,
          reference_number: payload.reference_number,
          flagged: payload.flagged,
          status: 'COMPLETED',
        }
        setTransactions((prev) => [synthetic, ...prev])
      }

      setIsModalOpen(false)
      setSenderAccount('')
      setReceiverAccount('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.sender_account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.receiver_account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reference_number &&
        t.reference_number.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = typeFilter === 'all' || t.transaction_type === typeFilter
    const matchesFlag = !flaggedOnly || t.flagged
    const matchesCase = activeCaseId === 'all' || t.case_id === activeCaseId

    return matchesSearch && matchesType && matchesFlag && matchesCase
  })

  // Aggregate stats
  const totalAmount = filteredTransactions.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const flaggedCount = filteredTransactions.filter((t) => t.flagged).length

  // Chart data aggregated by type
  const chartData = Object.entries(
    filteredTransactions.reduce<Record<string, number>>((acc, curr) => {
      const key = (curr.transaction_type || 'OTHER').replace(/_/g, ' ')
      acc[key] = (acc[key] || 0) + curr.amount
      return acc
    }, {})
  ).map(([name, total]) => ({
    name,
    amount: total,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Financial Transaction Forensics
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Audit ledger of fund transfers, SWIFT messages, crypto escrows, and suspicious structuring patterns.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="font-mono text-xs font-semibold"
        >
          Record Transaction Entry
        </Button>
      </div>

      {/* KPI Cards & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          <Card className="p-4 bg-bg-secondary/80 border-border-subtle">
            <span className="text-[11px] font-mono uppercase text-text-muted">Total Flow Analyzed</span>
            <p className="text-2xl font-bold font-mono text-amber-forensic mt-1">
              {formatCurrency(totalAmount, 'USD')}
            </p>
            <p className="text-[10px] text-text-muted font-mono mt-0.5">
              Across {filteredTransactions.length} recorded transfers
            </p>
          </Card>

          <Card className="p-4 bg-bg-secondary/80 border-border-subtle">
            <span className="text-[11px] font-mono uppercase text-text-muted">Flagged Anomaly Wires</span>
            <p className="text-2xl font-bold font-mono text-rose-400 mt-1">
              {flaggedCount} Flagged
            </p>
            <p className="text-[10px] text-text-muted font-mono mt-0.5">
              Exceeding SAR threshold or smurfing profile
            </p>
          </Card>
        </div>

        {/* Breakdown by Type Chart */}
        <Card className="lg:col-span-2 p-4 bg-bg-secondary/80 border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-text-primary">Transfer Volume by Rail</h3>
            <span className="text-[10px] font-mono text-text-muted">Aggregate Volume ($)</span>
          </div>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#6B7685" fontSize={10} tickLine={false} />
                <YAxis stroke="#6B7685" fontSize={10} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{
                    backgroundColor: '#171D24',
                    borderColor: '#2D3844',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="amount" fill="#F2A900" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 bg-bg-secondary/80 border-border-subtle">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by sender account, recipient, or reference number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              <option value="all">All Rail Types</option>
              <option value="SWIFT_WIRE">SWIFT Wire</option>
              <option value="INTERNAL_BOOK_TRANSFER">Book Transfer</option>
              <option value="SEPA_TRANSFER">SEPA (EUR)</option>
              <option value="CRYPTO_BLOCKCHAIN">Crypto Blockchain</option>
              <option value="ACH_COMMERCIAL">Commercial ACH</option>
            </select>

            <button
              onClick={() => setFlaggedOnly(!flaggedOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                flaggedOnly
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold'
                  : 'bg-bg-elevated text-text-secondary border-border-subtle'
              }`}
            >
              Flagged Only
            </button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="p-0 bg-bg-secondary/90 border-border-subtle overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No transaction records match the specified filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-elevated/40 text-text-muted uppercase font-mono">
                  <th className="py-3 px-4">Status / Alert</th>
                  <th className="py-3 px-4">Sender Account</th>
                  <th className="py-3 px-4">Beneficiary Account</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 font-mono">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="py-3 px-4">
                      {tx.flagged ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                          FLAGGED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-bg-elevated text-text-muted border border-border-subtle">
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-primary truncate max-w-[200px]">
                      {tx.sender_account}
                    </td>
                    <td className="py-3 px-4 text-text-secondary truncate max-w-[200px]">
                      {tx.receiver_account}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-forensic">
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td className="py-3 px-4 text-text-muted font-sans text-xs">
                      {formatDate(tx.transaction_timestamp)}
                    </td>
                    <td className="py-3 px-4 text-[10px] text-text-secondary">
                      {tx.transaction_type}
                    </td>
                    <td className="py-3 px-4 text-text-muted text-[10px] truncate max-w-[140px]">
                      {tx.reference_number || tx.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: New Transaction Entry */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Financial Transaction"
        subtitle="POST /api/transactions — Ingest audited fund transfer record into case ledger."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">
              Investigation Dossier
            </label>
            <select
              value={formCaseId}
              onChange={(e) => setFormCaseId(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_number} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sender Account / Wallet"
              placeholder="Apex Global (CH-8921-USD)"
              value={senderAccount}
              onChange={(e) => setSenderAccount(e.target.value)}
              required
            />
            <Input
              label="Beneficiary Account / Wallet"
              placeholder="Blackwood Trust (KY-3199-USD)"
              value={receiverAccount}
              onChange={(e) => setReceiverAccount(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Transfer Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>
            <Input
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Payment Rail</label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              >
                <option value="SWIFT_WIRE">SWIFT Wire</option>
                <option value="CRYPTO_BLOCKCHAIN">Crypto Blockchain</option>
                <option value="INTERNAL_BOOK_TRANSFER">Book Transfer</option>
                <option value="SEPA_TRANSFER">SEPA</option>
                <option value="ACH_COMMERCIAL">ACH</option>
              </select>
            </div>
            <Input
              label="Reference / Wire ID"
              placeholder="SWIFT-2024-99120"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="flagCheck"
              checked={isFlagged}
              onChange={(e) => setIsFlagged(e.target.checked)}
              className="rounded bg-bg-elevated border-border text-amber-forensic focus:ring-amber-forensic"
            />
            <label htmlFor="flagCheck" className="text-xs text-text-primary font-medium cursor-pointer">
              Flag as suspicious anomaly (Requires SAR review)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Commit Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
