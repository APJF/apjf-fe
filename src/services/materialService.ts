import axios from '../api/axios'
import type { ApiResponse } from '../types/api'

export interface Material {
  id?: string
  description: string
  fileUrl: string
  type: MaterialType
  unitId: string
}

export type MaterialType = 'KANJI' | 'GRAMMAR' | 'VOCAB' | 'LISTENING' | 'READING' | 'WRITING'

export interface CreateMaterialRequest {
  id?: string
  description: string
  fileUrl: string
  type: MaterialType
  unitId: string
}

export const MaterialService = {
  // Lấy danh sách materials theo unitId
  getMaterialsByUnitId: async (unitId: string): Promise<ApiResponse<Material[]>> => {
    try {
      const response = await axios.get(`/materials/unit/${unitId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching materials:', error)
      throw error
    }
  },

  // Tạo material mới
  createMaterial: async (materialData: CreateMaterialRequest): Promise<ApiResponse<Material>> => {
    try {
      const response = await axios.post('/materials', materialData)
      return response.data
    } catch (error) {
      console.error('Error creating material:', error)
      throw error
    }
  },

  // Cập nhật material
  updateMaterial: async (materialId: string, materialData: CreateMaterialRequest): Promise<ApiResponse<Material>> => {
    try {
      const response = await axios.put(`/materials/${materialId}`, materialData)
      return response.data
    } catch (error) {
      console.error('Error updating material:', error)
      throw error
    }
  },

  // Xóa material
  deleteMaterial: async (materialId: string): Promise<ApiResponse<void>> => {
    try {
      console.log('Deleting material with ID:', materialId)
      
      // Get user info for header
      const userString = localStorage.getItem('user')
      const user = userString ? JSON.parse(userString) : null
      console.log('User info for delete:', user ? { id: user.id } : 'No user info')
      
      // Explicitly set headers
      const headers: { [key: string]: string } = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id.toString()
      }
      
      const response = await axios.delete(`/materials/${materialId}`, { headers })
      console.log('Delete material response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error deleting material:', error)
      throw error
    }
  }
}
