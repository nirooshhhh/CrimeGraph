import { apiClient, extractData } from './apiClient'
import { CallRecord } from '../types'

export const callRecordsService = {
  async getCallRecords(): Promise<CallRecord[]> {
    const res = await apiClient.get('/api/call-records')
    return extractData<CallRecord[]>(res, [])
  },

  async createCallRecord(payload: {
    case_id: string
    caller_number: string
    receiver_number: string
    call_timestamp: string
    duration_seconds: number
    call_type?: string
    cell_tower_location?: string
    caller_entity_id?: string
    receiver_entity_id?: string
  }): Promise<CallRecord> {
    const res = await apiClient.post('/api/call-records', payload)
    return extractData<CallRecord>(res, res.data)
  },
}
