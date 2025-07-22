export interface DashboardStats {
  totalCourses: number
  totalLessons: number
  totalExams: number
  activeStudents: number
  completionRate: number
  avgExamScore: number
  thisMonthLessons: number
  thisMonthExams: number
  pendingRequests: number
  feedbackCount: number
}

export interface RecentActivity {
  id: number
  type: "lesson_created" | "exam_created" | "feedback_received" | "student_completed" | "exam_review_needed"
  title: string
  description: string
  timestamp: string
  status?: "success" | "pending" | "warning"
}

export interface QuickAction {
  id: number
  title: string
  description: string
  icon: any
  color: string
  action: string
}

export interface DashboardResponse {
  success: boolean
  message: string
  stats: DashboardStats
  activities: RecentActivity[]
}
