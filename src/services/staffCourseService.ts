import axios from '../api/axios'

import type { Course, CourseApiResponse as CoursesResponse, CreateCourseRequest, UpdateCourseRequest } from '@/types/course'
import type { ApiResponse } from '@/types/api'
import type { Topic } from '@/types/topic'
import type { Chapter } from '@/types/chapter'

// Re-export types for easier import
export type { Course, CreateCourseRequest, UpdateCourseRequest } from '@/types/course'

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

// Helper function để extract image filename từ URL
const extractImageFilename = (imageUrl: string | null): string => {
  if (!imageUrl) return ''
  
  try {
    // Extract filename từ URL như: https://domain.com/course-image/course_image_6ddd7d93-785a-4307-949e-81d1c184c0ca?...
    const urlParts = imageUrl.split('/')
    const lastPart = urlParts[urlParts.length - 1]
    const filename = lastPart.split('?')[0] // Remove query parameters
    return filename
  } catch (error) {
    console.error('Error extracting image filename:', error)
    return ''
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

  // Lấy danh sách tất cả khóa học không phân trang (cho dropdown)
  getAllCoursesForSelection: async (): Promise<ApiResponse<Course[]>> => {
    try {
      const response = await axios.get('/courses', {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching all courses for selection:', error)
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
  getCourseWithChapters: async (courseId: string): Promise<ApiResponse<Course & { chapters: Chapter[] }>> => {
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
        const axiosError = error as { response?: { status: number, data?: unknown, headers?: unknown } }
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
  },

  // Deactivate khóa học (chuyển status về INACTIVE bằng cách update)
  deactivateCourse: async (courseId: string): Promise<ApiResponse<Course>> => {
    try {
      // Lấy thông tin khóa học hiện tại
      const currentCourseResponse = await axios.get(`/courses/${courseId}`, {
        headers: getAuthHeaders()
      })
      
      if (!currentCourseResponse.data.success) {
        throw new Error('Failed to get current course data')
      }
      
      const currentCourse = currentCourseResponse.data.data
      
      // Chuẩn bị data để update, giữ nguyên tất cả giá trị cũ nhưng đổi status thành INACTIVE
      const updateData: UpdateCourseRequest = {
        id: currentCourse.id,
        title: currentCourse.title,
        description: currentCourse.description ?? '',
        duration: currentCourse.duration,
        level: currentCourse.level,
        image: extractImageFilename(currentCourse.image), // Extract filename từ URL
        requirement: currentCourse.requirement ?? '',
        status: 'INACTIVE', // Chỉ thay đổi status
        prerequisiteCourseId: currentCourse.prerequisiteCourseId,
        topicIds: currentCourse.topics?.map((topic: Topic) => topic.id.toString()) || []
      }
      
      console.log('🔧 Deactivating course with data:', {
        originalImage: currentCourse.image,
        extractedImage: extractImageFilename(currentCourse.image),
        updateData
      })
      
      // Gọi API update
      const response = await axios.put(`/courses/${courseId}`, updateData, {
        headers: getAuthHeaders()
      })
      
      return response.data
    } catch (error) {
      console.error('Error deactivating course:', error)
      throw error
    }
  },

  // Activate khóa học (chuyển status về ACTIVE bằng cách update)
  activateCourse: async (courseId: string): Promise<ApiResponse<Course>> => {
    try {
      // Lấy thông tin khóa học hiện tại
      const currentCourseResponse = await axios.get(`/courses/${courseId}`, {
        headers: getAuthHeaders()
      })
      
      if (!currentCourseResponse.data.success) {
        throw new Error('Failed to get current course data')
      }
      
      const currentCourse = currentCourseResponse.data.data
      
      // Chuẩn bị data để update, giữ nguyên tất cả giá trị cũ nhưng đổi status thành ACTIVE
      const updateData: UpdateCourseRequest = {
        id: currentCourse.id,
        title: currentCourse.title,
        description: currentCourse.description ?? '',
        duration: currentCourse.duration,
        level: currentCourse.level,
        image: extractImageFilename(currentCourse.image), // Extract filename từ URL
        requirement: currentCourse.requirement ?? '',
        status: 'ACTIVE', // Chỉ thay đổi status
        prerequisiteCourseId: currentCourse.prerequisiteCourseId,
        topicIds: currentCourse.topics?.map((topic: Topic) => topic.id.toString()) || []
      }
      
      console.log('🔧 Activating course with data:', {
        originalImage: currentCourse.image,
        extractedImage: extractImageFilename(currentCourse.image),
        updateData
      })
      
      // Gọi API update
      const response = await axios.put(`/courses/${courseId}`, updateData, {
        headers: getAuthHeaders()
      })
      
      return response.data
    } catch (error) {
      console.error('Error activating course:', error)
      throw error
    }
  }
}
