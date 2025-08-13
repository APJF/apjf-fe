import api from '../api/axios'
import type { ExamHistoryItem } from '../types/exam'

export class ExamHistoryService {
  /**
   * Extract array from API response that might be wrapped
   */
  private static extractArrayFromResponse(data: unknown): ExamHistoryItem[] {
    if (!data || typeof data !== 'object') return []
    
    if (Array.isArray(data)) return data
    
    const dataObj = data as Record<string, unknown>
    if (dataObj.data && Array.isArray(dataObj.data)) {
      console.log('📦 Found data in response.data.data')
      return dataObj.data
    }
    if (dataObj.content && Array.isArray(dataObj.content)) {
      console.log('📦 Found data in response.data.content')
      return dataObj.content
    }
    if (dataObj.items && Array.isArray(dataObj.items)) {
      console.log('📦 Found data in response.data.items')
      return dataObj.items
    }
    
    console.warn('⚠️ Response data is not an array, returning empty array')
    return []
  }

  /**
   * Lấy lịch sử thi của học viên - API mới
   * GET /api/student/exams
   */
  static async getStudentExamHistory(): Promise<ExamHistoryItem[]> {
    try {
      console.log('🔍 Fetching student exam history...')
      const response = await api.get('/student/exams')
      console.log('✅ Student exam history response:', response.data)
      console.log('Response data type:', typeof response.data)
      console.log('Is response.data array:', Array.isArray(response.data))
      console.log('Response keys:', response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'not object')
      
      return this.extractArrayFromResponse(response.data)
    } catch (error) {
      console.error('❌ Error fetching student exam history:', error)
      throw error
    }
  }

  /**
   * Lấy chi tiết lịch sử thi theo ID
   */
  static async getExamHistoryById(id: string): Promise<ExamHistoryItem> {
    try {
      console.log('🔍 Fetching exam history by ID:', id)
      const response = await api.get(`/student/exams/${id}`)
      console.log('✅ Exam history detail:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error fetching exam history by ID:', error)
      throw error
    }
  }

  /**
   * Backward compatibility - alias for getStudentExamHistory
   * @deprecated Use getStudentExamHistory instead
   */
  static async getExamHistory(): Promise<ExamHistoryItem[]> {
    return this.getStudentExamHistory()
  }
}
