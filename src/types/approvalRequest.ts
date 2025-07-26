export interface ApprovalRequest {
  id: number
  targetType: 'COURSE' | 'CHAPTER' | 'UNIT'
  targetId: string
  targetTitle: string
  requestType: 'CREATE' | 'UPDATE' | 'DELETE'
  decision: 'PENDING' | 'APPROVED' | 'REJECTED'
  feedback: string | null
  createdBy: string
  createdAt: string
  reviewedBy: string | null
  reviewedAt: string | null
}

export interface ApprovalRequestsResponse {
  success: boolean
  message: string
  data: ApprovalRequest[]
  timestamp: number
}
