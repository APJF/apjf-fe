import axiosInstance from '../api/axios';
import type { ApprovalRequest, ApprovalDecision, ApprovalRequestResponse, ApprovalRequestFilters } from '../types/approvalRequest';

export class ApprovalRequestService {
  private static readonly BASE_URL = '/approval-requests';
  private static readonly VALID_TARGET_TYPES = ['COURSE', 'CHAPTER', 'UNIT'] as const;
  private static readonly VALID_DECISIONS = ['APPROVED', 'REJECTED'] as const;
  
  private static readonly ERROR_MESSAGES = {
    INVALID_ID: 'Invalid ID: must be a positive integer',
    DECISION_REQUIRED: 'Decision is required',
    INVALID_DECISION: 'Invalid decision',
    FEEDBACK_REQUIRED: 'Feedback is required for rejection',
    INVALID_TARGET_TYPE: 'Invalid target type',
    CREATOR_ID_REQUIRED: 'Creator ID is required',
    REVIEWER_ID_REQUIRED: 'Reviewer ID is required',
    STAFF_ID_REQUIRED: 'Staff ID is required'
  };

  private static getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Helper function to build query parameters
  private static buildQueryParams(filters?: ApprovalRequestFilters): string {
    if (!filters) return '';
    
    const params = new URLSearchParams();
    
    if (filters.pending !== undefined) {
      params.append('pending', filters.pending.toString());
    }
    if (filters.targetType) {
      params.append('targetType', filters.targetType);
    }
    if (filters.createdBy) {
      params.append('createdBy', filters.createdBy);
    }
    if (filters.reviewedBy) {
      params.append('reviewedBy', filters.reviewedBy);
    }

    return params.toString();
  }

  /**
   * Lấy danh sách tất cả approval requests với filters
   */
  static async getAllRequests(filters?: ApprovalRequestFilters): Promise<ApprovalRequest[]> {
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
      throw error;
    }
  }

  /**
   * Lấy chi tiết một approval request theo ID
   */
  static async getRequestById(id: number): Promise<ApprovalRequest> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(this.ERROR_MESSAGES.INVALID_ID);
    }

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
   * Đưa ra quyết định cho approval request (approve/reject) - Dành cho Manager
   */
  static async makeDecision(id: number, decision: ApprovalDecision): Promise<ApprovalRequest> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(this.ERROR_MESSAGES.INVALID_ID);
    }

    if (!decision?.decision) {
      throw new Error(this.ERROR_MESSAGES.DECISION_REQUIRED);
    }

    if (!this.VALID_DECISIONS.includes(decision.decision)) {
      throw new Error(`${this.ERROR_MESSAGES.INVALID_DECISION}. Must be one of: ${this.VALID_DECISIONS.join(', ')}`);
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
      throw error;
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
    if (!feedback?.trim()) {
      throw new Error(this.ERROR_MESSAGES.FEEDBACK_REQUIRED);
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
    if (!this.VALID_TARGET_TYPES.includes(targetType)) {
      throw new Error(`${this.ERROR_MESSAGES.INVALID_TARGET_TYPE}. Must be one of: ${this.VALID_TARGET_TYPES.join(', ')}`);
    }
    
    return this.getAllRequests({ targetType });
  }

  /**
   * Lấy danh sách requests được tạo bởi user (staff)
   */
  static async getRequestsByCreator(createdBy: string): Promise<ApprovalRequest[]> {
    if (!createdBy?.trim()) {
      throw new Error(this.ERROR_MESSAGES.CREATOR_ID_REQUIRED);
    }
    
    return this.getAllRequests({ createdBy: createdBy.trim() });
  }

  /**
   * Lấy danh sách requests đã được review bởi manager
   */
  static async getRequestsByReviewer(reviewedBy: string): Promise<ApprovalRequest[]> {
    if (!reviewedBy?.trim()) {
      throw new Error(this.ERROR_MESSAGES.REVIEWER_ID_REQUIRED);
    }
    
    return this.getAllRequests({ reviewedBy: reviewedBy.trim() });
  }
}

// Service cho staff requests - tương thích với trang StaffRequestsPage hiện tại
export const approvalRequestService = {
  // Lấy danh sách approval requests của staff theo user ID
  getStaffRequests: async (staffId: string): Promise<{ data: ApprovalRequest[] }> => {
    if (!staffId?.trim()) {
      throw new Error(ApprovalRequestService['ERROR_MESSAGES'].STAFF_ID_REQUIRED);
    }

    try {
      const requests = await ApprovalRequestService.getRequestsByCreator(staffId.trim());
      return { data: requests };
    } catch (error) {
      console.error('Error fetching staff requests:', error);
      throw error;
    }
  }
} as const;

export default ApprovalRequestService;
