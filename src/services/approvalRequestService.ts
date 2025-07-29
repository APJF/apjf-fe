import axiosInstance from '../api/axios';
import type { ApprovalRequest, ApprovalDecision, ApprovalRequestResponse, ApprovalRequestFilters } from '../types/approvalRequest';
import mockApprovalRequests from './mockApprovalData';

export class ApprovalRequestService {
  private static readonly BASE_URL = '/approval-requests';
  private static readonly USE_MOCK_DATA = true; // Set to true for testing without backend

  // Helper function to get headers with authentication and user ID
  private static getHeaders() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('access_token');
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-User-Id': user.id || user.username || 'manager-01' // Fallback cho test
    };
  }

  // Helper function to apply filters to mock data
  private static applyFilters(data: ApprovalRequest[], filters?: ApprovalRequestFilters): ApprovalRequest[] {
    let filteredData = [...data];
    
    if (filters?.pending !== undefined) {
      filteredData = filteredData.filter(req => 
        filters.pending ? req.decision === 'PENDING' : req.decision !== 'PENDING'
      );
    }
    if (filters?.targetType) {
      filteredData = filteredData.filter(req => req.targetType === filters.targetType);
    }
    if (filters?.createdBy) {
      filteredData = filteredData.filter(req => req.createdBy === filters.createdBy);
    }
    if (filters?.reviewedBy) {
      filteredData = filteredData.filter(req => req.reviewedBy === filters.reviewedBy);
    }
    
    return filteredData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Helper function to build query parameters
  private static buildQueryParams(filters?: ApprovalRequestFilters): string {
    const params = new URLSearchParams();
    
    if (filters?.pending !== undefined) {
      params.append('pending', filters.pending.toString());
    }
    if (filters?.targetType) {
      params.append('targetType', filters.targetType);
    }
    if (filters?.createdBy) {
      params.append('createdBy', filters.createdBy);
    }
    if (filters?.reviewedBy) {
      params.append('reviewedBy', filters.reviewedBy);
    }

    return params.toString();
  }

  /**
   * Lấy danh sách tất cả approval requests với filters
   */
  static async getAllRequests(filters?: ApprovalRequestFilters): Promise<ApprovalRequest[]> {
    // Use mock data for testing
    if (this.USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.applyFilters(mockApprovalRequests, filters);
    }

    try {
      const queryString = this.buildQueryParams(filters);
      const url = queryString ? `${this.BASE_URL}?${queryString}` : this.BASE_URL;
      
      const response = await axiosInstance.get<ApprovalRequestResponse>(url, {
        headers: this.getHeaders()
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch approval requests');
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      
      // Fallback to mock data if API fails
      console.warn('API failed, using mock data as fallback');
      return this.applyFilters(mockApprovalRequests, filters);
    }
  }

  /**
   * Lấy chi tiết một approval request theo ID
   */
  static async getRequestById(id: number): Promise<ApprovalRequest> {
    try {
      const response = await axiosInstance.get<ApprovalRequestResponse>(`${this.BASE_URL}/${id}`, {
        headers: this.getHeaders()
      });

      if (response.data.success && !Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch approval request');
    } catch (error) {
      console.error('Error fetching approval request:', error);
      throw error;
    }
  }

  /**
   * Đưa ra quyết định cho approval request (approve/reject)
   */
  static async makeDecision(id: number, decision: ApprovalDecision): Promise<ApprovalRequest> {
    // Use mock data for testing
    if (this.USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Find and update the request in mock data
      const requestIndex = mockApprovalRequests.findIndex(req => req.id === id);
      if (requestIndex === -1) {
        throw new Error('Request not found');
      }
      
      const updatedRequest = {
        ...mockApprovalRequests[requestIndex],
        decision: decision.decision,
        feedback: decision.feedback || null,
        reviewedBy: 'manager-01',
        reviewedAt: new Date().toISOString(),
      };
      
      // Update the mock data
      mockApprovalRequests[requestIndex] = updatedRequest;
      
      return updatedRequest;
    }

    try {
      const response = await axiosInstance.put<ApprovalRequestResponse>(
        `${this.BASE_URL}/${id}/decision`,
        decision,
        {
          headers: this.getHeaders()
        }
      );

      if (response.data.success && !Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to process decision');
    } catch (error) {
      console.error('Error making decision:', error);
      
      // Fallback to mock simulation if API fails
      console.warn('API failed, simulating decision with mock data');
      const requestIndex = mockApprovalRequests.findIndex(req => req.id === id);
      if (requestIndex === -1) {
        throw new Error('Request not found');
      }
      
      const updatedRequest = {
        ...mockApprovalRequests[requestIndex],
        decision: decision.decision,
        feedback: decision.feedback || null,
        reviewedBy: 'manager-01',
        reviewedAt: new Date().toISOString(),
      };
      
      mockApprovalRequests[requestIndex] = updatedRequest;
      return updatedRequest;
    }
  }

  /**
   * Phê duyệt approval request
   */
  static async approveRequest(id: number, feedback?: string): Promise<ApprovalRequest> {
    return this.makeDecision(id, {
      decision: 'APPROVED',
      feedback: feedback || ''
    });
  }

  /**
   * Từ chối approval request
   */
  static async rejectRequest(id: number, feedback: string): Promise<ApprovalRequest> {
    if (!feedback.trim()) {
      throw new Error('Feedback is required when rejecting a request');
    }
    
    return this.makeDecision(id, {
      decision: 'REJECTED',
      feedback
    });
  }

  /**
   * Lấy danh sách requests đang chờ duyệt
   */
  static async getPendingRequests(): Promise<ApprovalRequest[]> {
    return this.getAllRequests({ pending: true });
  }

  /**
   * Lấy danh sách requests theo loại target
   */
  static async getRequestsByType(targetType: 'COURSE' | 'CHAPTER' | 'UNIT'): Promise<ApprovalRequest[]> {
    return this.getAllRequests({ targetType });
  }

  /**
   * Lấy danh sách requests được tạo bởi user
   */
  static async getRequestsByCreator(createdBy: string): Promise<ApprovalRequest[]> {
    return this.getAllRequests({ createdBy });
  }

  /**
   * Lấy danh sách requests đã được review bởi manager
   */
  static async getRequestsByReviewer(reviewedBy: string): Promise<ApprovalRequest[]> {
    return this.getAllRequests({ reviewedBy });
  }
}

// Giữ lại legacy service cho tương thích ngược
export const approvalRequestService = {
  // Lấy danh sách approval requests của staff
  getStaffRequests: async (staffId: string): Promise<any> => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('access_token');
    
    const response = await axiosInstance.get(`/approval-requests/by-staff/${staffId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-User-Id': user.id || ''
      }
    });
    return response.data;
  }
};

export default ApprovalRequestService;
