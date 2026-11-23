import { apiClient, extractData } from './apiClient'
import { Alert, AlertStatus } from '../types'

export const alertsService = {
  async getAlerts(): Promise<Alert[]> {
    const res = await apiClient.get('/api/alerts')
    return extractData<Alert[]>(res, [])
  },

  async getAlertById(id: string): Promise<Alert> {
    const res = await apiClient.get(`/api/alerts/${encodeURIComponent(id)}`)
    return extractData<Alert>(res, {} as Alert)
  },

  async getAlertsByCase(caseId: string): Promise<Alert[]> {
    const res = await apiClient.get(`/api/alerts/case/${encodeURIComponent(caseId)}`)
    return extractData<Alert[]>(res, [])
  },

  async createAlert(payload: {
    case_id: string
    title: string
    description?: string
    explanation?: string
    severity: string
    alert_type?: string
    related_entity_ids?: string[]
  }): Promise<Alert> {
    const res = await apiClient.post('/api/alerts', payload)
    return extractData<Alert>(res, res.data)
  },

  async updateAlertStatus(id: string, status: AlertStatus): Promise<Alert> {
    const res = await apiClient.patch(`/api/alerts/${encodeURIComponent(id)}/status`, {
      status,
    })
    return extractData<Alert>(res, res.data)
  },
}
