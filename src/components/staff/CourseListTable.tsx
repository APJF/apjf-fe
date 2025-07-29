import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Badge } from "../ui/Badge"
import { 
  BookOpen, 
  Plus, 
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react"
import { CourseService } from "../../services/courseService"
import type { Course, CourseFilters } from "../../types/course"

interface CourseListTableProps {
  onCreateCourse?: () => void
  refreshTrigger?: number
}

export const CourseListTable: React.FC<CourseListTableProps> = ({ 
  onCreateCourse, 
  refreshTrigger 
}) => {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  // const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc") // mặc định là mới nhất (desc)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const itemsPerPage = 12
  const navigate = useNavigate()

  // Fetch courses from API
  const fetchCourses = async (page = 0) => {
    setIsLoading(true)
    setError(null)
    try {
      const filters: CourseFilters = {
        page,
        size: itemsPerPage,
        searchTitle: searchTerm.trim() || undefined,
        level: selectedLevel !== "all" ? selectedLevel : undefined
        // sortBy: "createdAt", // Sắp xếp theo thời gian tạo
        // sortDirection: sortOrder // desc: mới nhất, asc: cũ nhất
      }

      const response = await CourseService.getAllCoursesForStaff(filters)
      
      if (response.success && response.data?.content) {
        setCourses(response.data.content)
        setTotalPages(response.data.totalPages)
        setTotalElements(response.data.totalElements)
      } else {
        throw new Error(response.message || "Không thể tải danh sách khóa học")
      }
    } catch (err) {
      console.error("Error fetching courses:", err)
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tải dữ liệu")
      setCourses([])
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load and when filters change
  useEffect(() => {
    fetchCourses(0)
    setCurrentPage(1)
  }, [searchTerm, selectedLevel, selectedStatus, refreshTrigger]) // added refreshTrigger

  // When page changes
  useEffect(() => {
    fetchCourses(currentPage - 1)
  }, [currentPage])

  // Get unique levels and statuses for filters
  const uniqueLevels = useMemo(() => {
    return Array.from(new Set(courses.map(course => course.level).filter(Boolean)))
  }, [courses])

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(courses.map(course => course.status).filter(Boolean)))
  }, [courses])

  // Filter courses for table display (client-side filtering for status)
  const filteredCourses = useMemo(() => {
    if (selectedStatus === "all") return courses
    return courses.filter(course => course.status === selectedStatus)
  }, [courses, selectedStatus])

  const getLevelColor = (level: string) => {
    switch (level) {
      case "N5": return "bg-green-200 text-green-800 border-green-300"
      case "N4": return "bg-blue-200 text-blue-800 border-blue-300"
      case "N3": return "bg-orange-200 text-orange-800 border-orange-300"
      case "N2": return "bg-red-200 text-red-800 border-red-300"
      case "N1": return "bg-purple-200 text-purple-800 border-purple-300"
      default: return "bg-gray-200 text-gray-800 border-gray-300"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "bg-green-500 text-white border-green-600"
      case "DRAFT": return "bg-yellow-400 text-yellow-900 border-yellow-500"
      case "ARCHIVED": return "bg-red-200 text-red-700 border-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "Đã xuất bản"
      case "DRAFT": return "Nháp"
      case "ARCHIVED": return "Đã lưu trữ"
      default: return status
    }
  }

  const handleCreateCourse = () => {
    if (onCreateCourse) {
      onCreateCourse()
    } else {
      navigate('/staff/create-course')
    }
  }

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <div className="px-6 py-16 text-center">
          <div className="text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium mb-2">Đang tải dữ liệu...</p>
            <p className="text-sm">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      )
    }

    if (filteredCourses.length === 0) {
      return (
        <div className="px-6 py-16 text-center">
          <div className="text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Không tìm thấy khóa học</p>
            <p className="text-sm mb-4">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <Button onClick={handleCreateCourse} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tạo khóa học mới
            </Button>
          </div>
        </div>
      )
    }

    return filteredCourses.map((course, index) => (
      <div key={course.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center">
        <div className="col-span-1 text-sm font-medium text-gray-900">
          {((currentPage - 1) * itemsPerPage) + index + 1}
        </div>
        <div className="col-span-2 text-sm font-bold text-blue-600">
          {course.id}
        </div>
        <div className="col-span-3">
          <div className="text-sm font-medium text-gray-900 line-clamp-2">
            {course.title}
          </div>
          {course.description && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
              {course.description}
            </div>
          )}
        </div>
        <div className="col-span-2">
          <Badge className={`rounded-full px-3 py-1 text-xs font-medium border ${getLevelColor(course.level)}`}>
            {course.level}
          </Badge>
        </div>
        <div className="col-span-2">
          <Badge className={`rounded-full px-3 py-1 text-xs font-medium border ${getStatusColor(course.status)}`}>
            {getStatusText(course.status)}
          </Badge>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/staff/courses/${course.id}`)}
            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/staff/courses/${course.id}/edit`)}
            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
            title="Chỉnh sửa"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            // onClick={() => handleDeleteCourse(course.id)}
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
            title="Xóa"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ))
  }

  return (
    <div className="space-y-6 px-6 py-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Tìm kiếm khóa học theo tên hoặc ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả mức độ</option>
              {uniqueLevels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>{getStatusText(status)}</option>
              ))}
            </select>
          </div>

          {/* Time Order Filter */}
          {/* <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">Mới nhất trước</option>
              <option value="asc">Cũ nhất trước</option>
            </select>
          </div> */}
        </div>
        
        <div className="mt-4 text-right">
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            Tìm thấy {filteredCourses.length} khóa học
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Có lỗi xảy ra</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button 
                onClick={() => fetchCourses(currentPage - 1)} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Course Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium text-gray-900">
            <div className="col-span-1">STT</div>
            <div className="col-span-2">ID</div>
            <div className="col-span-3">Tên khóa học</div>
            <div className="col-span-2">Mức độ</div>
            <div className="col-span-2">Trạng thái</div>
            <div className="col-span-2">Thao tác</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {renderTableContent()}
        </div>

        {/* Pagination */}
        {filteredCourses.length > 0 && totalPages > 1 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalElements)} trong tổng số {totalElements} khóa học
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseListTable
