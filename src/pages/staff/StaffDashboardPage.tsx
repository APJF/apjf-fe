import { useState, useEffect } from "react"
import { StaffNavigation } from "../../components/layout/StaffNavigation"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import {
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Calendar,
  Target,
  Award,
  Bell,
  Filter,
  Plus,
  BarChart3,
  PieChart,
  Activity,
  GraduationCap,
  Zap
} from "lucide-react"
import { useAuth } from "../../hooks/useAuth"

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

interface QuickAction {
  id: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  action: string
}

// Mock service function with Authorization
const getDashboardStats = async (): Promise<{
  stats: DashboardStats;
  activities: RecentActivity[];
}> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Lấy token từ localStorage theo convention
  const token = localStorage.getItem('access_token')
  
  if (!token) {
    throw new Error('Unauthorized - No access token')
  }

  // Trong thực tế, token sẽ được gửi trong header Authorization: Bearer {token}
  // và backend sẽ xác thực quyền STAFF
  console.log('Staff API called with token:', token.substring(0, 20) + '...')
  
  return {
    stats: {
      totalCourses: 15,
      totalLessons: 120,
      totalExams: 35,
      activeStudents: 1247,
      completionRate: 82,
      avgExamScore: 78.5,
      thisMonthLessons: 18,
      thisMonthExams: 8,
      pendingRequests: 3,
      feedbackCount: 6,
    },
    activities: [
      {
        id: 1,
        type: "lesson_created",
        title: "Bài học mới được tạo",
        description: "Đã tạo bài 'Kanji về gia đình' cho khóa N5",
        timestamp: "2 giờ trước",
        status: "success",
      },
      {
        id: 2,
        type: "exam_created",
        title: "Bài thi mới được tạo",
        description: "Tạo bài kiểm tra Hiragana cơ bản",
        timestamp: "4 giờ trước",
        status: "success",
      },
      {
        id: 3,
        type: "feedback_received",
        title: "Feedback từ Manager",
        description: "Bài học 'Katakana nâng cao' được phê duyệt",
        timestamp: "1 ngày trước",
        status: "success",
      },
      {
        id: 4,
        type: "student_completed",
        title: "Học viên hoàn thành khóa học",
        description: "85 học viên đã hoàn thành khóa 'N5 Cơ bản'",
        timestamp: "2 ngày trước",
        status: "success",
      },
      {
        id: 5,
        type: "exam_review_needed",
        title: "Cần review bài thi",
        description: "Bài thi N4 Kanji cần được kiểm tra lại",
        timestamp: "3 ngày trước",
        status: "warning",
      },
    ]
  }
}

function StaffDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [quickActions] = useState<QuickAction[]>([
    {
      id: 1,
      title: "Tạo bài học mới",
      description: "Tạo nội dung bài học cho khóa học",
      icon: Plus,
      color: "bg-blue-500",
      action: "create_lesson",
    },
    {
      id: 2,
      title: "Xem feedback",
      description: "Kiểm tra phản hồi từ manager",
      icon: MessageSquare,
      color: "bg-green-500",
      action: "view_feedback",
    },
    {
      id: 3,
      title: "Quản lý bài thi",
      description: "Tạo và chỉnh sửa bài thi",
      icon: GraduationCap,
      color: "bg-orange-500",
      action: "manage_exams",
    },
    {
      id: 4,
      title: "Thống kê chi tiết",
      description: "Xem báo cáo và phân tích",
      icon: BarChart3,
      color: "bg-purple-500",
      action: "view_analytics",
    },
  ])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboardStats()
        setDashboardData(data.stats)
        setRecentActivities(data.activities)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "lesson_created":
        return <BookOpen className="h-4 w-4 text-blue-600" />
      case "exam_created":
        return <GraduationCap className="h-4 w-4 text-green-600" />
      case "feedback_received":
        return <MessageSquare className="h-4 w-4 text-green-600" />
      case "student_completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "exam_review_needed":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "success":
        return "border-l-green-500"
      case "warning":
        return "border-l-yellow-500"
      case "pending":
        return "border-l-blue-500"
      default:
        return "border-l-gray-300"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <StaffNavigation>
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard Staff
            </h1>
            <p className="text-gray-600">
              Chào mừng {user?.username || "Staff"} trở lại! Đây là tổng quan hoạt động của bạn.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Tháng này</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>{dashboardData?.pendingRequests || 0}</span>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng khóa học</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {dashboardData?.totalCourses || 0}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2 tháng này
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng bài học</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {dashboardData?.totalLessons || 0}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <Plus className="h-3 w-3 mr-1" />
                    +{dashboardData?.thisMonthLessons || 0} tháng này
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Học viên hoạt động</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {dashboardData?.activeStudents?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    Đang học tập
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tỷ lệ hoàn thành</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {dashboardData?.completionRate || 0}%
                  </p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <Target className="h-3 w-3 mr-1" />
                    Khóa học
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Hành động nhanh</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <div
                      key={action.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer group hover:border-gray-300"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 ${action.color} rounded-lg`}>
                          <action.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Hiệu suất tháng này</span>
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Bộ lọc
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">
                        {dashboardData?.thisMonthLessons || 0}
                      </div>
                      <p className="text-sm text-gray-600">Bài học tạo</p>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-green-600">
                        {dashboardData?.thisMonthExams || 0}
                      </div>
                      <p className="text-sm text-gray-600">Bài thi tạo</p>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-orange-600">
                        {dashboardData?.avgExamScore || 0}
                      </div>
                      <p className="text-sm text-gray-600">Điểm TB</p>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-purple-600">
                        {dashboardData?.feedbackCount || 0}
                      </div>
                      <p className="text-sm text-gray-600">Feedback</p>
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Mục tiêu bài học tháng</span>
                        <span>{dashboardData?.thisMonthLessons || 0}/25</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ 
                            width: `${Math.min(((dashboardData?.thisMonthLessons || 0) / 25) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tỷ lệ hoàn thành khóa học</span>
                        <span>{dashboardData?.completionRate || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all" 
                          style={{ width: `${dashboardData?.completionRate || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Hoạt động gần đây</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-start space-x-3 p-3 border-l-4 ${getStatusColor(
                        activity.status,
                      )} bg-gray-50 rounded-r-lg`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    Xem tất cả hoạt động
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Cần xử lý</span>
                  </div>
                  <Badge variant="destructive">
                    {dashboardData?.pendingRequests || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Bài thi cần review</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    2 bài thi chờ phê duyệt
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Feedback mới</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    1 phản hồi từ manager
                  </p>
                </div>

                <Button className="w-full">
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>

            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Tiến độ khóa học</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">N5 - Cơ bản</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-4/5" />
                      </div>
                      <span className="text-xs text-gray-500">85%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">N4 - Sơ cấp</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full w-3/5" />
                      </div>
                      <span className="text-xs text-gray-500">65%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">N3 - Trung cấp</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full w-2/5" />
                      </div>
                      <span className="text-xs text-gray-500">40%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {dashboardData?.avgExamScore || 0}/100
                    </div>
                    <p className="text-sm text-gray-600">Điểm thi trung bình</p>
                    <div className="flex justify-center mt-1">
                      <Award className="h-4 w-4 text-yellow-400" />
                      <span className="text-xs text-gray-500 ml-1">Tốt</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Liên kết nhanh</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-left">
                  <FileText className="h-4 w-4 mr-2" />
                  Quản lý bài học
                </Button>
                <Button variant="ghost" className="w-full justify-start text-left">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Quản lý bài thi
                </Button>
                <Button variant="ghost" className="w-full justify-start text-left">
                  <Users className="h-4 w-4 mr-2" />
                  Danh sách học viên
                </Button>
                <Button variant="ghost" className="w-full justify-start text-left">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback & Đánh giá
                </Button>
                <Button variant="ghost" className="w-full justify-start text-left">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Báo cáo chi tiết
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </StaffNavigation>
  )
}

export default StaffDashboardPage
