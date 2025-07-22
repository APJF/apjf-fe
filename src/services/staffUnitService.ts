import axios from '../api/axios'
import type { ApiResponse } from '../types/api'
import type { UnitDetail, CreateUnitRequest, UpdateUnitRequest } from '../types/staffCourse'

export const StaffUnitService = {
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

  // Tạo bài học mới
  createUnit: async (unitData: CreateUnitRequest): Promise<ApiResponse<UnitDetail>> => {
    try {
      const response = await axios.post('/units', unitData)
      return response.data
    } catch (error) {
      console.error('Error creating unit:', error)
      throw error
    }
  },

  // Cập nhật bài học
  updateUnit: async (unitId: string, unitData: UpdateUnitRequest): Promise<ApiResponse<UnitDetail>> => {
    try {
      const response = await axios.put(`/units/${unitId}`, unitData)
      return response.data
    } catch (error) {
      console.error('Error updating unit:', error)
      throw error
    }
  },
  
  // Xóa bài học
  deleteUnit: async (unitId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await axios.delete(`/units/${unitId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting unit:', error)
      throw error
    }
  }
}
