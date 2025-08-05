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

export interface Material {
  id: string
  description: string
  fileUrl: string
  type: MaterialType
}

export type MaterialType = 'KANJI' | 'GRAMMAR' | 'VOCAB' | 'LISTENING' | 'READING' | 'WRITING'

export interface CreateMaterialRequest {
  id: string
  description: string
  fileUrl: string
  type: MaterialType
}

export interface UpdateMaterialRequest {
  id: string
  description: string
  fileUrl: string
  type: MaterialType
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: number
}

export const MaterialService = {
  // Lấy danh sách tài liệu theo unitId
  getMaterialsByUnit: async (unitId: string): Promise<ApiResponse<Material[]>> => {
    try {
      const response = await axios.get(`/units/${unitId}/materials`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching materials by unit:', error)
      throw error
    }
  },

  // Lấy chi tiết tài liệu theo materialId
  getMaterialDetail: async (materialId: string): Promise<ApiResponse<Material>> => {
    try {
      const response = await axios.get(`/materials/${materialId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error fetching material detail:', error)
      throw error
    }
  },

  // Tạo tài liệu mới
  createMaterial: async (materialData: CreateMaterialRequest): Promise<ApiResponse<Material>> => {
    try {
      const response = await axios.post('/materials', materialData, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error creating material:', error)
      throw error
    }
  },

  // Cập nhật tài liệu
  updateMaterial: async (materialId: string, materialData: UpdateMaterialRequest): Promise<ApiResponse<Material>> => {
    try {
      const response = await axios.put(`/materials/${materialId}`, materialData, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error updating material:', error)
      throw error
    }
  },

  // Xóa tài liệu
  deleteMaterial: async (materialId: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await axios.delete(`/materials/${materialId}`, {
        headers: getAuthHeaders()
      })
      return response.data
    } catch (error) {
      console.error('Error deleting material:', error)
      throw error
    }
  }
}

export default MaterialService
