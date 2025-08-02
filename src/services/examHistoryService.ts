import axios from '../api/axios'
import type { ExamHistory, ExamHistoryFilter } from '../types/examHistory'

export class ExamHistoryService {
  private static getHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  static async getExamHistory(filters?: ExamHistoryFilter): Promise<ExamHistory[]> {
    try {
      const response = await axios.get('/exam-history', { 
        headers: this.getHeaders(),
        params: filters 
      })
      return response.data
    } catch (error) {
      console.error('Error fetching exam history:', error)
      throw error
    }
  }

  static async getExamHistoryById(id: string): Promise<ExamHistory> {
    try {
      const response = await axios.get(`/exam-history/${id}`, { 
        headers: this.getHeaders() 
      })
      return response.data
    } catch (error) {
      console.error('Error fetching exam history by id:', error)
      throw error
    }
  }
}
