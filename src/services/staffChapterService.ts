import axios from '../api/axios'
import type { ApiResponse } from '../types/api'
import type { ChapterDetail, CreateChapterRequest } from '../types/staffCourse'

export const StaffChapterService = {
  // Lấy chi tiết chương
  getChapterDetail: async (chapterId: string): Promise<ApiResponse<ChapterDetail>> => {
    const response = await axios.get(`/chapters/${chapterId}`)
    return response.data
  },

  // Tạo chương mới
  createChapter: async (chapterData: CreateChapterRequest): Promise<ApiResponse<ChapterDetail>> => {
    const response = await axios.post('/chapters', chapterData)
    return response.data
  },

  // Cập nhật chương
  updateChapter: async (chapterId: string, chapterData: CreateChapterRequest): Promise<ApiResponse<ChapterDetail>> => {
    const response = await axios.put(`/chapters/${chapterId}`, chapterData)
    return response.data
  },
  
  // Xóa chương
  deleteChapter: async (chapterId: string): Promise<ApiResponse<void>> => {
    const response = await axios.delete(`/chapters/${chapterId}`)
    return response.data
  }
}
