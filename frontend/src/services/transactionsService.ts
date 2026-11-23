import { apiClient, extractData } from './apiClient'
import { Transaction } from '../types'

export const transactionsService = {
  async getTransactions(): Promise<Transaction[]> {
    const res = await apiClient.get('/api/transactions')
    return extractData<Transaction[]>(res, [])
  },

  async createTransaction(payload: {
    case_id: string
    sender_account: string
    receiver_account: string
    amount: number
    currency: string
    transaction_timestamp: string
    transaction_type?: string
    status?: string
    reference_number?: string
    flagged?: boolean
    sender_entity_id?: string
    receiver_entity_id?: string
  }): Promise<Transaction> {
    const res = await apiClient.post('/api/transactions', payload)
    return extractData<Transaction>(res, res.data)
  },
}
