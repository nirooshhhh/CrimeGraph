import { apiClient, extractData } from './apiClient'
import { DocumentItem, DocumentMention } from '../types'

export const documentsService = {
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await apiClient.get('/api/documents')
    return extractData<DocumentItem[]>(res, [])
  },

  async getDocumentsByCase(caseId: string): Promise<DocumentItem[]> {
    const res = await apiClient.get(`/api/documents/case/${encodeURIComponent(caseId)}`)
    return extractData<DocumentItem[]>(res, [])
  },

  /**
   * Uploads document using multipart/form-data with case_id and file per specification
   */
  async uploadDocument(caseId: string, file: File): Promise<DocumentItem> {
    const formData = new FormData()
    formData.append('case_id', caseId)
    formData.append('file', file)

    const res = await apiClient.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return extractData<DocumentItem>(res, res.data)
  },

  async createDocument(data: Partial<DocumentItem>): Promise<DocumentItem> {
    const res = await apiClient.post('/api/documents', data)
    return extractData<DocumentItem>(res, res.data)
  },

  async downloadDocument(id: string): Promise<Blob> {
    const res = await apiClient.get(`/api/documents/${encodeURIComponent(id)}/download`, {
      responseType: 'blob',
    })
    return res.data
  },

  async getDocumentMentions(id: string): Promise<DocumentMention[]> {
    const res = await apiClient.get(`/api/documents/${encodeURIComponent(id)}/mentions`)
    return extractData<DocumentMention[]>(res, [])
  },
}
