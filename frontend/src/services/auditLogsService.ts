import { apiClient, extractData } from './apiClient'
import { AuditLog } from '../types'

export const auditLogsService = {
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await apiClient.get('/api/audit-logs')
    return extractData<AuditLog[]>(res, [])
  },

  async createAuditLog(payload: {
    case_id?: string
    actor?: string
    action: string
    resource_type?: string
    resource_id?: string
    details?: Record<string, any>
  }): Promise<AuditLog> {
    const res = await apiClient.post('/api/audit-logs', payload)
    return extractData<AuditLog>(res, res.data)
  },
}
