import { apiClient, extractData } from './apiClient'
import { Source } from '../types'

export const sourcesService = {
  async getSources(): Promise<Source[]> {
    const res = await apiClient.get('/api/sources')
    return extractData<Source[]>(res, [])
  },

  async getSourcesByCase(caseId: string): Promise<Source[]> {
    const res = await apiClient.get(`/api/sources/case/${encodeURIComponent(caseId)}`)
    return extractData<Source[]>(res, [])
  },

  async createSource(payload: {
    case_id?: string
    name: string
    type: string
    description?: string
    reliability_score?: number
  }): Promise<Source> {
    const res = await apiClient.post('/api/sources', payload)
    return extractData<Source>(res, res.data)
  },
}
