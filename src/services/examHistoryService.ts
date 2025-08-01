import axios from '../api/axios'
import type { ExamHistory, ExamHistoryFilter } from '../types/examHistory'

// Helper function để lấy headers với token
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token')
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  }
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: number
}

const API_BASE = '/v1/exam-history'

const isAxiosError = (error: unknown): error is { response?: { data?: { message?: string } } } => {
  return typeof error === 'object' && error !== null && 'response' in error
}

class ExamHistoryService {
  /**
   * Lấy lịch sử thi của user hiện tại
   */
  async getUserExamHistory(filter: ExamHistoryFilter): Promise<ExamHistory[]> {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Vui lòng đăng nhập để xem lịch sử thi')
    }

    // Mock data for development - remove this when API is ready
    const mockData: ExamHistory[] = [
      {
        examId: '1',
        examTitle: 'Thi N5 - Từ vựng cơ bản',
        courseId: 'course-1',
        courseTitle: 'Tiếng Nhật N5',
        level: 'N5',
        attemptId: 'attempt-1',
        attemptedAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T10:45:00Z',
        status: 'COMPLETED',
        score: 85.5,
        correctAnswers: 34,
        totalQuestions: 40,
        timeSpent: 2700 // 45 minutes
      },
      {
        examId: '2',
        examTitle: 'Thi N5 - Ngữ pháp',
        courseId: 'course-1',
        courseTitle: 'Tiếng Nhật N5',
        level: 'N5',
        attemptId: 'attempt-2',
        attemptedAt: '2024-01-10T14:30:00Z',
        completedAt: '2024-01-10T15:15:00Z',
        status: 'COMPLETED',
        score: 72.0,
        correctAnswers: 36,
        totalQuestions: 50,
        timeSpent: 2700
      },
      {
        examId: '3',
        examTitle: 'Thi N4 - Đọc hiểu',
        courseId: 'course-2',
        courseTitle: 'Tiếng Nhật N4',
        level: 'N4',
        attemptId: 'attempt-3',
        attemptedAt: '2024-01-20T09:00:00Z',
        completedAt: '2024-01-20T10:30:00Z',
        status: 'COMPLETED',
        score: 78.0,
        correctAnswers: 39,
        totalQuestions: 50,
        timeSpent: 5400 // 90 minutes
      },
      {
        examId: '4',
        examTitle: 'Thi N3 - Nghe hiểu',
        courseId: 'course-3',
        courseTitle: 'Tiếng Nhật N3',
        level: 'N3',
        attemptId: 'attempt-4',
        attemptedAt: '2024-01-25T16:00:00Z',
        completedAt: '2024-01-25T17:15:00Z',
        status: 'COMPLETED',
        score: 65.0,
        correctAnswers: 26,
        totalQuestions: 40,
        timeSpent: 4500 // 75 minutes
      },
      {
        examId: '5',
        examTitle: 'Thi N2 - Tổng hợp',
        courseId: 'course-4',
        courseTitle: 'Tiếng Nhật N2',
        level: 'N2',
        attemptId: 'attempt-5',
        attemptedAt: '2024-01-30T14:00:00Z',
        completedAt: '2024-01-30T16:30:00Z',
        status: 'COMPLETED',
        score: 45.0,
        correctAnswers: 18,
        totalQuestions: 40,
        timeSpent: 9000 // 150 minutes
      },
      {
        examId: '6',
        examTitle: 'Thi N1 - Kanji nâng cao',
        courseId: 'course-5',
        courseTitle: 'Tiếng Nhật N1',
        level: 'N1',
        attemptId: 'attempt-6',
        attemptedAt: '2024-02-05T10:00:00Z',
        completedAt: '2024-02-05T12:45:00Z',
        status: 'COMPLETED',
        score: 92.5,
        correctAnswers: 37,
        totalQuestions: 40,
        timeSpent: 9900 // 165 minutes
      }
    ]

    // Filter mock data by level instead of status
    let filteredData = mockData
    if (filter.level !== 'ALL') {
      filteredData = filteredData.filter(item => item.level === filter.level)
    }

    // Sort mock data
    filteredData.sort((a, b) => {
      const aValue = filter.sortBy === 'attemptedAt' ? new Date(a.attemptedAt).getTime() : a.score
      const bValue = filter.sortBy === 'attemptedAt' ? new Date(b.attemptedAt).getTime() : b.score
      
      if (filter.sortDirection === 'ASC') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return filteredData
  }

  /**
   * Lấy chi tiết một lần thi cụ thể
   */
  async getExamAttemptDetail(attemptId: string): Promise<ExamHistory> {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Vui lòng đăng nhập để xem chi tiết')
    }

    try {
      const response = await axios.get<ApiResponse<ExamHistory>>(
        `${API_BASE}/attempt/${attemptId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Không thể tải chi tiết lần thi')
      }

      return response.data.data
    } catch (error) {
      if (isAxiosError(error)) {
        const message = error.response?.data?.message || 'Có lỗi xảy ra khi tải chi tiết lần thi'
        throw new Error(message)
      }
      throw new Error('Có lỗi xảy ra khi tải chi tiết lần thi')
    }
  }

  /**
   * Xóa một lần thi khỏi lịch sử (chỉ với trạng thái ABANDONED)
   */
  async deleteExamAttempt(attemptId: string): Promise<void> {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Vui lòng đăng nhập để thực hiện thao tác')
    }

    try {
      const response = await axios.delete<ApiResponse<void>>(
        `${API_BASE}/attempt/${attemptId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Không thể xóa lần thi')
      }
    } catch (error) {
      if (isAxiosError(error)) {
        const message = error.response?.data?.message || 'Có lỗi xảy ra khi xóa lần thi'
        throw new Error(message)
      }
      throw new Error('Có lỗi xảy ra khi xóa lần thi')
    }
  }

  /**
   * Lấy thống kê thi của user
   */
  async getUserExamStats(): Promise<{
    totalAttempts: number
    completedAttempts: number
    averageScore: number
    bestScore: number
    totalTimeSpent: number
  }> {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Vui lòng đăng nhập để xem thống kê')
    }

    try {
      const response = await axios.get<ApiResponse<{
        totalAttempts: number
        completedAttempts: number
        averageScore: number
        bestScore: number
        totalTimeSpent: number
      }>>(
        `${API_BASE}/user/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || 'Không thể tải thống kê')
      }

      return response.data.data
    } catch (error) {
      if (isAxiosError(error)) {
        const message = error.response?.data?.message || 'Có lỗi xảy ra khi tải thống kê'
        throw new Error(message)
      }
      throw new Error('Có lỗi xảy ra khi tải thống kê')
    }
  }
}

export const examHistoryService = new ExamHistoryService()
