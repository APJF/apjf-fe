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

export interface CreateUnitRequest {
  title: string
  description: string
  status: 'INACTIVE' | 'ACTIVE'
  chapterId: string
  prerequisiteUnitId: string | null
  examIds: string[]
}

export interface UpdateUnitRequest {
  id: string
  title: string
  description: string
  status: 'INACTIVE' | 'ACTIVE'
  chapterId: string
  prerequisiteUnitId: string | null
  examIds: string[]
}

export interface Unit {
  id: string
  title: string
  description: string | null
  status: 'INACTIVE' | 'ACTIVE'
  prerequisiteUnitId: string | null
}

export interface UnitDetail extends Unit {
  chapterId?: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: number
}

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
