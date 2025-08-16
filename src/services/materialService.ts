import api from '../api/axios'

import type { Material, MaterialType } from '@/types/material'
import type { ApiResponse } from '@/types/api'

// Re-export types for easier import
export type { Material, MaterialType } from '@/types/material'

export const MaterialService = {
  // Lấy danh sách tài liệu theo unitId
  getMaterialsByUnit: async (unitId: string): Promise<ApiResponse<Material[]>> => {
    try {
      const response = await api.get(`/units/${unitId}/materials`)
      return response.data
    } catch (error) {
      console.error('Error fetching materials by unit:', error)
      throw error
    }
  },

  // Lấy chi tiết tài liệu theo materialId
  getMaterialDetail: async (materialId: string): Promise<ApiResponse<Material>> => {
    try {
      const response = await api.get(`/materials/${materialId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching material detail:', error)
      throw error
    }
  },

  // Tạo tài liệu mới
  createMaterial: async (materialData: {
    id: string
    fileUrl: string
    type: MaterialType
    script: string
    translation: string
    unitId: string
  }): Promise<ApiResponse<Material>> => {
    try {
      const response = await api.post('/materials', materialData)
      return response.data
    } catch (error) {
      console.error('Error creating material:', error)
      throw error
    }
  },

  // Cập nhật tài liệu
  updateMaterial: async (materialId: string, materialData: {
    id: string
    fileUrl: string
    type: MaterialType
    script: string
    translation: string
    unitId: string
  }): Promise<ApiResponse<Material>> => {
    try {
      const response = await api.put(`/materials/${materialId}`, materialData)
      return response.data
    } catch (error) {
      console.error('Error updating material:', error)
      throw error
    }
  },

  // Xóa tài liệu
  deleteMaterial: async (materialId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await api.delete(`/materials/${materialId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting material:', error)
      throw error
    }
  }
}

export default MaterialService
