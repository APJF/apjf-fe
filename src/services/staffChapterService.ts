import axios from '../api/axios'

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

export interface Chapter {
  id: string
  title: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE'
  courseId: string
  prerequisiteChapterId: string | null
  exams: any[]
}

export interface CreateChapterRequest {
  id: string
  title: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
  courseId: string
  prerequisiteChapterId: string | null
  exams: any[]
}

export interface UpdateChapterRequest {
  id: string
  title: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
  courseId: string
  prerequisiteChapterId: string | null
  exams: any[]
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: number
}

export const StaffChapterService = {
  // Lấy danh sách chương theo courseId
  getChaptersByCourse: async (courseId: string): Promise<ApiResponse<Chapter[]>> => {
    try {
      const response = await axios.get(`/chapters/course/${courseId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching chapters by course:', error)
      throw error
    }
  },

  // Lấy tất cả chương trong course (cho dropdown prerequisite)
  getAllChaptersByCourse: async (courseId: string): Promise<ApiResponse<Chapter[]>> => {
    try {
      const response = await axios.get(`/chapters/course/${courseId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching all chapters by course:', error)
      throw error
    }
  },

  // Lấy chi tiết chương
  getChapterDetail: async (chapterId: string): Promise<ApiResponse<Chapter>> => {
    try {
      const response = await axios.get(`/chapters/${chapterId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching chapter detail:', error)
      throw error
    }
  },

  // Tạo chương mới
  createChapter: async (chapterData: CreateChapterRequest): Promise<ApiResponse<Chapter>> => {
    try {
      const response = await axios.post('/chapters', chapterData, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error creating chapter:', error)
      throw error
    }
  },

  // Cập nhật chương
  updateChapter: async (chapterId: string, chapterData: UpdateChapterRequest): Promise<ApiResponse<Chapter>> => {
    try {
      const response = await axios.put(`/chapters/${chapterId}`, chapterData, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error updating chapter:', error)
      throw error
    }
  },

  // Deactivate chương (chuyển status về INACTIVE)
  deactivateChapter: async (chapterId: string): Promise<ApiResponse<Chapter>> => {
    try {
      const response = await axios.patch(`/chapters/${chapterId}/deactivate`, {}, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error deactivating chapter:', error)
      throw error
    }
  },
  
  // Xóa chương
  deleteChapter: async (chapterId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await axios.delete(`/chapters/${chapterId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error deleting chapter:', error)
      throw error
    }
  }
}
