import api from "../api/axios"

interface DashboardStats {
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

interface RecentActivity {
  id: number
  type: "lesson_created" | "exam_created" | "feedback_received" | "student_completed" | "exam_review_needed"
  title: string
  description: string
  timestamp: string
  status?: "success" | "pending" | "warning"
}

interface DashboardResponse {
  success: boolean
  message: string
  stats: DashboardStats
  activities: RecentActivity[]
}

class StaffService {
  /**
   * Lấy thông tin dashboard cho staff
   * API này chỉ staff trở lên mới gọi được
   */
  async getDashboardStats(): Promise<DashboardResponse> {
    try {
      // Gọi API với Authorization header (đã được handle trong axios interceptor)
      const response = await api.get<DashboardResponse>("/staff/dashboard")
      return response.data
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      // Trả về mock data khi API chưa có hoặc lỗi
      throw new Error("Không thể tải dữ liệu dashboard")
    }
  }

  /**
   * Lấy danh sách hoạt động gần đây
   */
  async getRecentActivities(limit: number = 10) {
    try {
      const response = await api.get(`/staff/activities?limit=${limit}`)
      return response.data
    } catch (error) {
      console.error("Error fetching recent activities:", error)
      throw new Error("Không thể tải hoạt động gần đây")
    }
  }

  /**
   * Lấy thống kê hiệu suất tháng hiện tại
   */
  async getMonthlyPerformance() {
    try {
      const response = await api.get("/staff/performance/monthly")
      return response.data
    } catch (error) {
      console.error("Error fetching monthly performance:", error)
      throw new Error("Không thể tải thống kê hiệu suất")
    }
  }

  /**
   * Lấy danh sách công việc cần xử lý
   */
  async getPendingTasks() {
    try {
      const response = await api.get("/staff/tasks/pending")
      return response.data
    } catch (error) {
      console.error("Error fetching pending tasks:", error)
      throw new Error("Không thể tải công việc cần xử lý")
    }
  }

  // NOTE: Các API methods cho course management sẽ được thêm sau khi backend sẵn sàng
  // getAllCourses, createCourse, updateCourse, deleteCourse, getCourseDetails
}

export const staffService = new StaffService()
export const { getDashboardStats } = staffService
