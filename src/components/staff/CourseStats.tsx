import { useState, useEffect } from "react"
import { Card } from "../ui/Card"
import { 
  BookOpen,
  GraduationCap,
  FileText,
  BarChart3,
  RefreshCw
} from "lucide-react"
import { CourseService } from "../../services/courseService"

interface CourseStatsData {
  totalCourses: number
  activeCourses: number
  inactiveCourses: number
}

interface CourseStatsProps {
  refreshTrigger?: number
}

export const CourseStats: React.FC<CourseStatsProps> = ({ refreshTrigger = 0 }) => {
  const [stats, setStats] = useState<CourseStatsData>({
    totalCourses: 0,
    activeCourses: 0,
    inactiveCourses: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch course statistics
      const coursesResponse = await CourseService.getAllCoursesForStaff({
        size: 1000, // Get all courses for stats
        sortBy: "title",
        sortDirection: "asc"
      })

      if (coursesResponse.success && coursesResponse.data) {
        const courses = coursesResponse.data
        
        const totalCourses = courses.length
        const activeCourses = courses.filter(course => course.status === "ACTIVE").length
        const inactiveCourses = courses.filter(course => course.status === "INACTIVE").length

        setStats({
          totalCourses,
          activeCourses,
          inactiveCourses
        })
      } else {
        throw new Error("Không thể tải thống kê khóa học")
      }
    } catch (err) {
      console.error("Error fetching course stats:", err)
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tải thống kê")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [refreshTrigger])

  const statsCards = [
    {
      title: "Tổng khóa học",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Hoạt động",
      value: stats.activeCourses,
      icon: GraduationCap,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Không hoạt động",
      value: stats.inactiveCourses,
      icon: FileText,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600"
    }
  ]

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-400 mr-3">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Không thể tải thống kê</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Thống kê khóa học</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className={`${card.bgColor} border-none p-6 hover:shadow-lg transition-shadow duration-200`}>
              <div className="flex items-center">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <div className="flex items-center">
                    <p className={`text-2xl font-bold ${card.textColor}`}>
                      {isLoading ? (
                        <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse"></span>
                      ) : (
                        card.value.toLocaleString()
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Additional Stats */}
      {/* Đã xóa phần phân bổ trạng thái khóa học */}
    </div>
  )
}

export default CourseStats
