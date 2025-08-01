import axios from '../api/axios'

export interface Course {
  id: string
  title: string
  description: string | null
  duration: number
  level: string
  image: string | null
  requirement: string | null
  status: 'INACTIVE' | 'ACTIVE'
  prerequisiteCourseId: string | null
  topics: any[]
  exams: any[]
  averageRating: number | null
}

export interface CoursesResponse {
  content: Course[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalElements: number
  totalPages: number
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  first: boolean
  numberOfElements: number
  empty: boolean
}

export interface CreateCourseRequest {
  id: string
  title: string
  description: string
  duration: number
  level: string
  image: string
  requirement: string
  status: 'INACTIVE' | 'ACTIVE'
  prerequisiteCourseId: string
  topicIds: string[]
  examIds: string[]
}

export interface UpdateCourseRequest {
  id: string
  title: string
  description: string
  duration: number
  level: string
  image: string
  requirement: string
  status: 'INACTIVE' | 'ACTIVE'
  prerequisiteCourseId: string
  topicIds: string[]
  examIds: string[]
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: number
}

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

export const StaffCourseService = {
  // Lấy danh sách tất cả khóa học với phân trang
  getAllCourses: async (page: number = 0, size: number = 12): Promise<ApiResponse<CoursesResponse>> => {
    try {
      const response = await axios.get(`/courses?page=${page}&size=${size}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching courses:', error)
      throw error
    }
  },

  // Lấy thông tin chi tiết của khóa học
  getCourseDetail: async (courseId: string): Promise<ApiResponse<Course>> => {
    try {
      const response = await axios.get(`/courses/${courseId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching course detail:', error)
      throw error
    }
  },

  // Lấy thông tin khóa học với danh sách chương
  getCourseWithChapters: async (courseId: string): Promise<ApiResponse<Course & { chapters: any[] }>> => {
    try {
      // Lấy thông tin course
      const courseResponse = await axios.get(`/courses/${courseId}`, {
        headers: getAuthHeaders()
      })

      // Lấy danh sách chapters
      const chaptersResponse = await axios.get(`/chapters/course/${courseId}`, {
        headers: getAuthHeaders()
      })

      if (courseResponse.data.success && chaptersResponse.data.success) {
        return {
          success: true,
          message: 'Course with chapters loaded successfully',
          data: {
            ...courseResponse.data.data,
            chapters: chaptersResponse.data.data
          },
          timestamp: Date.now()
        }
      }
      
      throw new Error('Failed to load course with chapters')
    } catch (error) {
      console.error('Error fetching course with chapters:', error)
      throw error
    }
  },

  // Tạo khóa học mới
  createCourse: async (courseData: CreateCourseRequest): Promise<ApiResponse<Course>> => {
    try {
      const headers = getAuthHeaders()
      
      console.log('🔧 StaffCourseService.createCourse:', {
        url: '/courses',
        headers: headers,
        hasAuth: !!headers.Authorization,
        authPreview: headers.Authorization ? `${headers.Authorization.substring(0, 20)}...` : 'No Auth',
        data: courseData
      })
      
      const response = await axios.post('/courses', courseData, { headers })
      
      console.log('✅ Create course success:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error creating course:', error)
      
      // Log response details for debugging
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number, data?: any, headers?: any } }
        console.error('📥 Response error details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          responseHeaders: axiosError.response?.headers
        })
      }
      
      throw error
    }
  },

  // Cập nhật khóa học
  updateCourse: async (courseId: string, courseData: UpdateCourseRequest): Promise<ApiResponse<Course>> => {
    try {
      const response = await axios.put(`/courses/${courseId}`, courseData, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error updating course:', error)
      throw error
    }
  }
}
