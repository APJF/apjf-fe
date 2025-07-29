export interface ApprovalRequest {
  id: number;
  targetType: 'COURSE' | 'CHAPTER' | 'UNIT';
  targetId: string;
  targetTitle: string;
  requestType: 'CREATE' | 'UPDATE' | 'DELETE';
  decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback: string | null;
  createdBy: string;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface ApprovalDecision {
  decision: 'APPROVED' | 'REJECTED';
  feedback?: string;
}

export interface ApprovalRequestResponse {
  success: boolean;
  message: string;
  data: ApprovalRequest[] | ApprovalRequest;
  timestamp: number;
}

export interface ApprovalRequestFilters {
  pending?: boolean;
  targetType?: 'COURSE' | 'CHAPTER' | 'UNIT';
  createdBy?: string;
  reviewedBy?: string;
}
