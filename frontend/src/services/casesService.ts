import { apiClient, extractData } from './apiClient'
import { Case } from '../types'

export const casesService = {
  async getCases(): Promise<Case[]> {
    const res = await apiClient.get('/api/cases')
    return extractData<Case[]>(res, [])
  },

  async getCaseById(id: string): Promise<Case> {
    const res = await apiClient.get(`/api/cases/${encodeURIComponent(id)}`)
    return extractData<Case>(res, {} as Case)
  },

  async createCase(payload: {
    case_number?: string
    title: string
    description?: string
    category: string
    priority?: string
    status?: string
    lead_investigator?: string
  }): Promise<Case> {
    const res = await apiClient.post('/api/cases', payload)
    return extractData<Case>(res, res.data)
  },
}
