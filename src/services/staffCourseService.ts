import axios from '../api/axios'
import type { 
  StaffCourseDetail, 
  ChapterDetail, 
  UnitDetail,
  CreateCourseRequest,
  UpdateCourseRequest,
  CreateChapterRequest,
  UpdateChapterRequest,
  CreateUnitRequest
} from '../types/staffCourse'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: number
}

export const StaffCourseService = {
  // Lấy thông tin cơ bản của khóa học
  getCourseDetail: async (courseId: string): Promise<ApiResponse<StaffCourseDetail>> => {
    try {
      const response = await axios.get(`/courses/${courseId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching course detail:', error)
      throw new Error('Không thể tải thông tin khóa học')
    }
  },

  // Lấy chi tiết chương
  getChapterDetail: async (chapterId: string): Promise<ApiResponse<ChapterDetail>> => {
    try {
      const response = await axios.get(`/chapters/${chapterId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching chapter detail:', error)
      throw new Error('Không thể tải thông tin chương')
    }
  },

  // Lấy chi tiết bài học
  getUnitDetail: async (unitId: string): Promise<ApiResponse<UnitDetail>> => {
    try {
      const response = await axios.get(`/units/${unitId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching unit detail:', error)
      throw new Error('Không thể tải thông tin bài học')
    }
  },

  // Tạo khóa học mới
  createCourse: async (courseData: CreateCourseRequest): Promise<ApiResponse<StaffCourseDetail>> => {
    try {
      const response = await axios.post('/courses', courseData)
      return response.data
    } catch (error) {
      console.error('Error creating course:', error)
      // Re-throw the original error to preserve server message
      throw error
    }
  },

  // Cập nhật khóa học
  updateCourse: async (courseId: string, courseData: UpdateCourseRequest): Promise<ApiResponse<StaffCourseDetail>> => {
    try {
      const response = await axios.put(`/courses/${courseId}`, courseData)
      return response.data
    } catch (error) {
      console.error('Error updating course:', error)
      throw error
    }
  },

  // Tạo chương mới
  createChapter: async (chapterData: CreateChapterRequest): Promise<ApiResponse<ChapterDetail>> => {
    try {
      const response = await axios.post('/chapters', chapterData)
      return response.data
    } catch (error) {
      console.error('Error creating chapter:', error)
      throw new Error('Không thể tạo chương')
    }
  },

  // Cập nhật chương
  updateChapter: async (chapterId: string, chapterData: UpdateChapterRequest): Promise<ApiResponse<ChapterDetail>> => {
    try {
      const response = await axios.put(`/chapters/${chapterId}`, chapterData)
      return response.data
    } catch (error) {
      console.error('Error updating chapter:', error)
      throw new Error('Không thể cập nhật chương')
    }
  },

  // Tạo bài học mới
  createUnit: async (unitData: CreateUnitRequest): Promise<ApiResponse<UnitDetail>> => {
    try {
      const response = await axios.post('/units', unitData)
      return response.data
    } catch (error) {
      console.error('Error creating unit:', error)
      throw new Error('Không thể tạo bài học')
    }
  },

  // Cập nhật bài học
  updateUnit: async (unitId: string, unitData: CreateUnitRequest): Promise<ApiResponse<UnitDetail>> => {
    try {
      const response = await axios.put(`/units/${unitId}`, unitData)
      return response.data
    } catch (error) {
      console.error('Error updating unit:', error)
      throw new Error('Không thể cập nhật bài học')
    }
  },

  // Lấy danh sách approval requests của staff
  getApprovalRequestsByStaff: async (staffId: number): Promise<ApiResponse<unknown[]>> => {
    try {
      const response = await axios.get(`/approval-requests/by-staff/${staffId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching approval requests:', error)
      throw new Error('Không thể tải danh sách approval requests')
    }
  }
}
