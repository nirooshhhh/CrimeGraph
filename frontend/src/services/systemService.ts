import { apiClient } from './apiClient'
import { ApiHealthResponse } from '../types'

export const systemService = {
  async getHealth(): Promise<ApiHealthResponse> {
    const res = await apiClient.get('/api/health')
    return res.data
  },
}
