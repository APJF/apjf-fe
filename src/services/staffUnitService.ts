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

import type { CreateUnitRequest, UpdateUnitRequest, Unit, UnitDetail } from '@/types/unit'
import type { ApiResponse } from '@/types/api'

// Re-export types for easier import
export type { CreateUnitRequest, UpdateUnitRequest, Unit, UnitDetail } from '@/types/unit'

export const StaffUnitService = {
  // Lấy danh sách bài học theo chapterId
  getUnitsByChapter: async (chapterId: string): Promise<ApiResponse<Unit[]>> => {
    try {
      const response = await axios.get(`/units/chapter/${chapterId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching units by chapter:', error)
      throw error
    }
  },

  // Lấy tất cả bài học trong chapter (cho dropdown prerequisite)
  getAllUnitsByChapter: async (chapterId: string): Promise<ApiResponse<Unit[]>> => {
    try {
      const response = await axios.get(`/units/chapter/${chapterId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching all units by chapter:', error)
      throw error
    }
  },

  // Lấy chi tiết bài học
  getUnitDetail: async (unitId: string): Promise<ApiResponse<UnitDetail>> => {
    try {
      const response = await axios.get(`/units/${unitId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching unit detail:', error)
      throw error
    }
  },

  // Tạo bài học mới
  createUnit: async (unitData: CreateUnitRequest): Promise<ApiResponse<UnitDetail>> => {
    try {
      const response = await axios.post('/units', unitData, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error creating unit:', error)
      throw error
    }
  },

  // Cập nhật bài học
  updateUnit: async (unitId: string, unitData: UpdateUnitRequest): Promise<ApiResponse<UnitDetail>> => {
    try {
      const response = await axios.put(`/units/${unitId}`, unitData, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error updating unit:', error)
      throw error
    }
  },

  // Deactivate bài học (chuyển status về INACTIVE)
  deactivateUnit: async (unitId: string): Promise<ApiResponse<UnitDetail>> => {
    try {
      const response = await axios.patch(`/units/${unitId}/deactivate`, {}, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error deactivating unit:', error)
      throw error
    }
  },

  // Lấy danh sách exams của unit
  getExamsByUnit: async (unitId: string): Promise<ApiResponse<any[]>> => {
    try {
      const response = await axios.get(`/units/${unitId}/exams`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching exams by unit:', error)
      throw error
    }
  },
  
  // Xóa bài học
  deleteUnit: async (unitId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await axios.delete(`/units/${unitId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error deleting unit:', error)
      throw error
    }
  }
}
