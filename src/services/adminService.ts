import api from '../api/axios'

export interface AdminUser {
  id: number
  email: string
  username: string
  phone: string | null
  avatar: string
  enabled: boolean
  emailVerified: boolean
  authorities: string[]
}

export interface Authority {
  id: number
  name: string
  authority: string
}

export interface UpdateAuthoritiesRequest {
  userId: number
  authorityIds: string[]
}

export interface UpdateUserStatusRequest {
  userId: number
  enabled: boolean
  reason?: string
}

export interface AdminUsersResponse {
  success: boolean
  message: string
  data: AdminUser[]
  timestamp: number
}

export interface AuthoritiesResponse {
  success: boolean
  message: string
  data: Authority[]
  timestamp: number
}

export interface ApiResponse {
  success: boolean
  message: string
  timestamp: number
}

// Helper function to ensure token is included in headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('Access token not found. Please login again.')
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export const AdminService = {
  // Lấy danh sách tất cả users
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      const response = await api.get<AdminUsersResponse>('/admin/users', {
        headers: getAuthHeaders()
      })
      
      // Log response để debug
      console.log('Raw API response:', response.data)
      
      if (response.data.success === false) {
        throw new Error(response.data.message || 'API returned success: false')
      }
      
      return response.data.data || []
    } catch (error: any) {
      console.error('AdminService.getAllUsers error:', error)
      
      // Check if it's the enum error
      if (error.response?.data?.message?.includes('No enum constant')) {
        throw new Error(`Backend enum error: ${error.response.data.message}. Vui lòng liên hệ admin để sửa dữ liệu.`)
      }
      
      throw error
    }
  },

  // Lấy danh sách tất cả quyền hạn
  async getAllAuthorities(): Promise<Authority[]> {
    const response = await api.get<AuthoritiesResponse>('/admin/authorities', {
      headers: getAuthHeaders()
    })
    return response.data.data
  },

  // Cập nhật quyền hạn cho user
  async updateUserAuthorities(data: UpdateAuthoritiesRequest): Promise<void> {
    await api.patch<ApiResponse>('/admin/authorities', data, {
      headers: getAuthHeaders()
    })
  },

  // Cập nhật trạng thái user (ban/unban)
  async updateUserStatus(data: UpdateUserStatusRequest): Promise<void> {
    await api.patch<ApiResponse>('/admin/status', data, {
      headers: getAuthHeaders()
    })
  }
}
