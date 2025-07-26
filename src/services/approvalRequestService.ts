import axiosInstance from '../api/axios'
import type { ApprovalRequestsResponse } from '../types/approvalRequest'

export const approvalRequestService = {
  // Lấy danh sách approval requests của staff
  getStaffRequests: async (staffId: string): Promise<ApprovalRequestsResponse> => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const token = localStorage.getItem('access_token')
    
    const response = await axiosInstance.get(`/approval-requests/by-staff/${staffId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-User-Id': user.id || ''
      }
    })
    return response.data
  }
}
