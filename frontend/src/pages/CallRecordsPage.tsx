import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  PhoneCall,
  Search,
  Filter,
  Plus,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Radio,
  Clock,
  ArrowUpDown,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { callRecordsService } from '../services/callRecordsService'
import { DEMO_CALL_RECORDS, DEMO_CASES } from '../data/demoData'
import { CallRecord, Case } from '../types'
import { formatDate, formatDuration } from '../lib/utils'

export const CallRecordsPage: React.FC = () => {
  const { cases, activeCaseId, isLiveApi } = useOutletContext<{
    cases: Case[]
    activeCaseId: string
    isLiveApi: boolean
  }>()

  const [records, setRecords] = useState<CallRecord[]>(DEMO_CALL_RECORDS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCase, setSelectedCase] = useState<string>(activeCaseId)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // New call record form
  const [callerNumber, setCallerNumber] = useState('')
  const [receiverNumber, setReceiverNumber] = useState('')
  const [durationSeconds, setDurationSeconds] = useState(120)
  const [callType, setCallType] = useState('outbound')
  const [cellLocation, setCellLocation] = useState('Pier 42 Terminal Mast A')
  const [formCaseId, setFormCaseId] = useState(cases[0]?.id || 'case-001')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCallRecords = async () => {
    setIsLoading(true)
    try {
      if (isLiveApi) {
        const data = await callRecordsService.getCallRecords()
        if (data && data.length > 0) setRecords(data)
      }
    } catch (e) {
      console.warn('Failed loading call records from live backend', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCallRecords()
  }, [isLiveApi])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!callerNumber.trim() || !receiverNumber.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        case_id: formCaseId,
        caller_number: callerNumber.trim(),
        receiver_number: receiverNumber.trim(),
        call_timestamp: new Date().toISOString(),
        duration_seconds: Number(durationSeconds),
        call_type: callType,
        cell_tower_location: cellLocation.trim(),
      }

      if (isLiveApi) {
        const created = await callRecordsService.createCallRecord(payload)
        setRecords((prev) => [created, ...prev])
      } else {
        const synthetic: CallRecord = {
          id: `call-${Date.now()}`,
          case_id: payload.case_id,
          caller_number: payload.caller_number,
          receiver_number: payload.receiver_number,
          call_timestamp: payload.call_timestamp,
          duration_seconds: payload.duration_seconds,
          call_type: payload.call_type as any,
          cell_tower_location: payload.cell_tower_location,
        }
        setRecords((prev) => [synthetic, ...prev])
      }

      setIsModalOpen(false)
      setCallerNumber('')
      setReceiverNumber('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.caller_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.receiver_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.cell_tower_location &&
        r.cell_tower_location.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = typeFilter === 'all' || r.call_type === typeFilter
    const matchesCase = activeCaseId === 'all' || r.case_id === activeCaseId

    return matchesSearch && matchesType && matchesCase
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            Call Detail Record (CDR) Telephony Workspace
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Interception logs, cell mast triangulation, burner subscribers, and call frequency correlation.
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          className="font-mono text-xs font-semibold"
        >
          Record CDR Entry
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 bg-bg-secondary/80 border-border-subtle">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Filter by caller number, recipient, or cell mast coordinates..."
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
              <option value="all">All Direction Types</option>
              <option value="outbound">Outbound Calls</option>
              <option value="inbound">Inbound Calls</option>
              <option value="missed">Missed / Unanswered</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Records Table */}
      <Card className="p-0 bg-bg-secondary/90 border-border-subtle overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            No telephony records matching current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-elevated/40 text-text-muted uppercase font-mono">
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Origin (Caller)</th>
                  <th className="py-3 px-4">Destination (Receiver)</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Cell Tower / Sector</th>
                  <th className="py-3 px-4">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 font-mono">
                {filteredRecords.map((c) => (
                  <tr key={c.id} className="hover:bg-bg-elevated/50 transition-colors">
                    <td className="py-3 px-4">
                      {c.call_type === 'inbound' ? (
                        <span className="flex items-center gap-1.5 text-teal-400">
                          <PhoneIncoming className="w-3.5 h-3.5" /> Inbound
                        </span>
                      ) : c.call_type === 'outbound' ? (
                        <span className="flex items-center gap-1.5 text-amber-forensic">
                          <PhoneOutgoing className="w-3.5 h-3.5" /> Outbound
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-400">
                          <PhoneMissed className="w-3.5 h-3.5" /> Missed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-sky-400">{c.caller_number}</td>
                    <td className="py-3 px-4 font-bold text-amber-300">{c.receiver_number}</td>
                    <td className="py-3 px-4 text-text-muted font-sans text-xs">
                      {formatDate(c.call_timestamp)}
                    </td>
                    <td className="py-3 px-4 text-text-primary">
                      {formatDuration(c.duration_seconds)}
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-sans text-xs">
                      {c.cell_tower_location || 'Sector Unknown'}
                    </td>
                    <td className="py-3 px-4 text-text-muted text-[11px]">{c.case_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Record CDR */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Telephony Interception Record"
        subtitle="POST /api/call-records — Attach raw call detail record to case investigation."
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
              label="Caller Number (MSISDN)"
              placeholder="+1 (555) 019-2834"
              value={callerNumber}
              onChange={(e) => setCallerNumber(e.target.value)}
              required
            />
            <Input
              label="Receiver Number (MSISDN)"
              placeholder="+44 20 7946 0912"
              value={receiverNumber}
              onChange={(e) => setReceiverNumber(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (Seconds)"
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Call Type</label>
              <select
                value={callType}
                onChange={(e) => setCallType(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-amber-forensic"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          </div>

          <Input
            label="Cell Mast / Sector Triangulation"
            placeholder="e.g., Red Hook Terminal Mast A"
            value={cellLocation}
            onChange={(e) => setCellLocation(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Commit Call Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
