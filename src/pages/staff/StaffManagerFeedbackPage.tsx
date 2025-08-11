import { useState, useEffect, useMemo } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { StaffNavigation } from '../../components/layout/StaffNavigation'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  Calendar,
  RefreshCw,
  FileText,
  Layers,
  BookOpen,
  Package,
  MessageCircle,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { ApprovalRequestService } from '../../services/approvalRequestService'
import { CourseService } from '../../services/courseService'
import { StaffChapterService } from '../../services/staffChapterService'
import { StaffUnitService } from '../../services/staffUnitService'
import { MaterialService } from '../../services/materialService'
import type { ApprovalRequest } from '../../types/approvalRequest'
import type { Course } from '../../types/course'
import type { Chapter } from '../../types/chapter'
import type { UnitDetail } from '../../types/unit'

// Material type definition from API
interface Material {
  id: string
  description: string
  type: string
  fileUrl: string
}

export function StaffManagerFeedbackPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState("all")
  const [unitMaterials, setUnitMaterials] = useState<Material[]>([])
  
  // State để lưu thông tin chi tiết
  const [targetDetails, setTargetDetails] = useState<{
    course?: Course
    chapter?: Chapter
    unit?: UnitDetail
  }>({})
  const [isLoadingTargetDetails, setIsLoadingTargetDetails] = useState(false)
  const [courseImageError, setCourseImageError] = useState(false)
  
  const itemsPerPage = 6

  const { user } = useAuth()
  const { showToast } = useToast()

  // Fetch requests data for current user
  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error('Không tìm thấy thông tin người dùng')
      }

      const response = await ApprovalRequestService.getRequestsByCreator(String(user.id))
      console.log('📋 Staff API Response:', response)
      setRequests(response)
    } catch (err) {
      console.error('Error fetching requests:', err)
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch target details based on targetType and targetId
  const fetchCourseDetails = async (targetId: string) => {
    try {
      const courseResponse = await CourseService.getCourseDetail(targetId)
      if (courseResponse.success) {
        setTargetDetails(prev => ({ ...prev, course: courseResponse.data }))
      }
    } catch (error) {
      console.error('Error fetching course details:', error)
    }
  }

  const fetchChapterDetails = async (targetId: string) => {
    try {
      const chapterResponse = await StaffChapterService.getChapterDetail(targetId)
      if (chapterResponse.success) {
        setTargetDetails(prev => ({ ...prev, chapter: chapterResponse.data }))
      }
    } catch (error) {
      console.error('Error fetching chapter details:', error)
    }
  }

  const fetchUnitDetails = async (targetId: string) => {
    try {
      const [unitResponse, materialsResponse] = await Promise.all([
        StaffUnitService.getUnitDetail(targetId),
        MaterialService.getMaterialsByUnit(targetId)
      ])
      
      if (unitResponse.success) {
        setTargetDetails(prev => ({ ...prev, unit: unitResponse.data }))
      }
      
      if (materialsResponse.success) {
        setUnitMaterials(materialsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching unit details:', error)
    }
  }

  const fetchTargetDetails = async (targetType: string, targetId: string) => {
    try {
      setIsLoadingTargetDetails(true)
      setTargetDetails({}) // Reset previous details
      setCourseImageError(false) // Reset image error
      
      switch (targetType) {
        case 'COURSE':
          await fetchCourseDetails(targetId)
          break
        case 'CHAPTER':
          await fetchChapterDetails(targetId)
          break
        case 'UNIT':
          await fetchUnitDetails(targetId)
          break
        default:
          console.warn('Unknown targetType:', targetType)
      }
    } catch (error) {
      console.error('Error fetching target details:', error)
      showToast('error', 'Không thể tải thông tin chi tiết')
    } finally {
      setIsLoadingTargetDetails(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchRequests()
    }
  }, [user?.id])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = requests.length
    const pending = requests.filter((item) => item.decision === "PENDING").length
    const approved = requests.filter((item) => item.decision === "APPROVED").length
    const rejected = requests.filter((item) => item.decision === "REJECTED").length

    return { total, pending, approved, rejected }
  }, [requests])

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = requests.filter((item) => {
      const matchesSearch =
        (item.targetTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.targetId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.createdBy?.toLowerCase() || '').includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "PENDING" && item.decision === "PENDING") ||
        (statusFilter === "APPROVED" && item.decision === "APPROVED") ||
        (statusFilter === "REJECTED" && item.decision === "REJECTED")

      let matchesType = true
      if (typeFilter !== "all") {
        if (currentTab !== "all") {
          const typeMap = { 
            subjects: "COURSE", 
            chapters: "CHAPTER", 
            units: "UNIT" 
          }
          matchesType = item.targetType === typeMap[currentTab as keyof typeof typeMap]
        } else {
          matchesType = item.targetType === typeFilter
        }
      }

      // Tab filtering
      if (currentTab !== "all") {
        const typeMap = { 
          subjects: "COURSE", 
          chapters: "CHAPTER", 
          units: "UNIT" 
        }
        const tabMatches = item.targetType === typeMap[currentTab as keyof typeof typeMap]
        return matchesSearch && matchesStatus && matchesType && tabMatches
      }

      return matchesSearch && matchesStatus && matchesType
    })

    // Sort by time
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      
      if (sortBy === "newest") {
        return dateB - dateA
      } else {
        return dateA - dateB
      }
    })

    return filtered
  }, [requests, searchTerm, statusFilter, typeFilter, sortBy, currentTab])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, typeFilter, currentTab])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  // Helper functions
  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDecisionText = (decision: string) => {
    switch (decision) {
      case "APPROVED":
        return "Đã duyệt"
      case "REJECTED":
        return "Từ chối"
      case "PENDING":
        return "Chờ duyệt"
      default:
        return decision
    }
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "PENDING":
        return <Clock className="h-4 w-4 text-amber-600" />
      default:
        return null
    }
  }

  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case "COURSE":
        return <BookOpen className="h-4 w-4" />
      case "CHAPTER":
        return <Layers className="h-4 w-4" />
      case "UNIT":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTargetTypeText = (targetType: string) => {
    switch (targetType) {
      case "COURSE":
        return "Khóa học"
      case "CHAPTER":
        return "Chương"
      case "UNIT":
        return "Bài học"
      default:
        return targetType
    }
  }

  const handleRowClick = async (request: ApprovalRequest) => {
    setSelectedRequest(request)
    setIsDetailDialogOpen(true)
    
    // Fetch target details based on targetType and targetId
    await fetchTargetDetails(request.targetType, request.targetId)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <Alert className="max-w-md">
          <XCircle className="h-4 w-4" />
          <h3 className="font-semibold">Chưa đăng nhập</h3>
          <p className="mt-2 text-sm">Vui lòng đăng nhập để xem phản hồi từ manager.</p>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <XCircle className="h-4 w-4" />
          <h3 className="font-semibold">Có lỗi xảy ra</h3>
          <p className="mt-2 text-sm">{error}</p>
          <Button 
            onClick={fetchRequests} 
            className="mt-4"
            size="sm"
          >
            Thử lại
          </Button>
        </Alert>
      </div>
    )
  }

  return (
    <StaffNavigation>
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl shadow-lg">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-blue-900">My Requests</h1>
                  <p className="text-blue-600 font-medium mt-1">
                    Xem các phản hồi và trạng thái yêu cầu của bạn
                  </p>
                </div>
              </div>
              <Button
                onClick={fetchRequests}
                disabled={isLoading}
                className="flex items-center gap-2"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-600 font-medium text-sm">Tổng yêu cầu</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-amber-600 font-medium text-sm">Chờ duyệt</p>
                    <p className="text-3xl font-bold text-amber-900">{stats.pending}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-emerald-600 font-medium text-sm">Đã duyệt</p>
                    <p className="text-3xl font-bold text-emerald-900">{stats.approved}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl shadow-lg">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-red-600 font-medium text-sm">Từ chối</p>
                    <p className="text-3xl font-bold text-red-900">{stats.rejected}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-8">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-blue-900">Bộ lọc và tìm kiếm</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <Input
                    placeholder="Tìm kiếm yêu cầu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-blue-300 focus:border-blue-500 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="COURSE">Khóa học</option>
                  <option value="CHAPTER">Chương</option>
                  <option value="UNIT">Bài học</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                  className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>

                <div className="text-right">
                  <span className="text-sm text-blue-600 bg-blue-100 px-3 py-2 rounded-full font-medium">
                    Tìm thấy {filteredData.length} yêu cầu
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <div className="p-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-blue-600 font-medium">Đang tải dữ liệu...</p>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && currentData.length === 0 && (
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <div className="p-12 text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {filteredData.length === 0 && requests.length === 0
                    ? "Chưa có yêu cầu nào"
                    : "Không tìm thấy kết quả"
                  }
                </h3>
                <p className="text-gray-500 mb-6">
                  {filteredData.length === 0 && requests.length === 0
                    ? "Bạn chưa gửi yêu cầu nào cho manager."
                    : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                  }
                </p>
                {filteredData.length === 0 && requests.length > 0 && (
                  <Button
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setTypeFilter("all")
                      setCurrentTab("all")
                    }}
                    variant="outline"
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Requests Table */}
          {!isLoading && currentData.length > 0 && (
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-8">
              <div className="p-0">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium">
                    <div className="col-span-1">STT</div>
                    <div className="col-span-2">ID / Loại</div>
                    <div className="col-span-3">Tiêu đề</div>
                    <div className="col-span-2">Thời gian</div>
                    <div className="col-span-2">Người duyệt</div>
                    <div className="col-span-1">Trạng thái</div>
                    <div className="col-span-1">Chi tiết</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-blue-100">
                  {currentData.map((request, index) => (
                    <button
                      key={request.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors cursor-pointer w-full text-left"
                      onClick={() => handleRowClick(request)}
                    >
                      {/* STT */}
                      <div className="col-span-1 flex items-center">
                        <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {startIndex + index + 1}
                        </span>
                      </div>

                      {/* ID / Loại */}
                      <div className="col-span-2 flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {getTargetTypeIcon(request.targetType)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getTargetTypeText(request.targetType)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            ID: {request.targetId}
                          </div>
                        </div>
                      </div>

                      {/* Tiêu đề */}
                      <div className="col-span-3 flex items-center">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {request.targetTitle || 'Không có tiêu đề'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Tạo bởi: {request.createdBy}
                          </div>
                        </div>
                      </div>

                      {/* Thời gian */}
                      <div className="col-span-2 flex items-center">
                        <div>
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleTimeString('vi-VN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Người duyệt */}
                      <div className="col-span-2 flex items-center">
                        <div>
                          <div className="text-sm text-gray-900">
                            {request.reviewedBy || 'Chưa có'}
                          </div>
                          {request.reviewedAt && (
                            <div className="text-xs text-gray-500">
                              {new Date(request.reviewedAt).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Trạng thái */}
                      <div className="col-span-1 flex items-center">
                        <Badge className={`flex items-center gap-1 ${getDecisionColor(request.decision)}`}>
                          {getDecisionIcon(request.decision)}
                          <span className="hidden sm:inline">{getDecisionText(request.decision)}</span>
                        </Badge>
                      </div>

                      {/* Chi tiết */}
                      <div className="col-span-1 flex items-center">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full flex items-center justify-center gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRowClick(request)
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          <span className="hidden sm:inline">Chi tiết</span>
                        </Button>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-blue-50/50 border-t border-blue-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredData.length)} của {filteredData.length} kết quả
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Trước
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber
                            if (totalPages <= 5) {
                              pageNumber = i + 1
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1
                            } else if (currentPage > totalPages - 3) {
                              pageNumber = totalPages - 4 + i
                            } else {
                              pageNumber = currentPage - 2 + i
                            }

                            return (
                              <Button
                                key={pageNumber}
                                onClick={() => setCurrentPage(pageNumber)}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0 flex items-center justify-center"
                              >
                                {pageNumber}
                              </Button>
                            )
                          })}
                        </div>

                        <Button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          Sau
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredData.length)} của {filteredData.length} kết quả
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Trước
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="min-w-[2.5rem]"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Detail Dialog */}
        {isDetailDialogOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 bg-white">
              <div className="p-6">
                {/* Dialog Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {getTargetTypeIcon(selectedRequest.targetType)}
                    <h2 className="text-2xl font-bold text-gray-900">
                      Chi tiết yêu cầu {getTargetTypeText(selectedRequest.targetType)}
                    </h2>
                  </div>
                  <Button
                    onClick={() => {
                      setIsDetailDialogOpen(false)
                      setSelectedRequest(null)
                      setTargetDetails({})
                      setUnitMaterials([])
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>

                {/* Request Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Thông tin yêu cầu</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Trạng thái:</span>
                        <Badge className={`flex items-center gap-1 ${getDecisionColor(selectedRequest.decision)}`}>
                          {getDecisionIcon(selectedRequest.decision)}
                          {getDecisionText(selectedRequest.decision)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Ngày tạo:</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedRequest.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {selectedRequest.reviewedAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Ngày duyệt:</span>
                          <span className="text-sm font-medium">
                            {new Date(selectedRequest.reviewedAt).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      {selectedRequest.reviewedBy && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Người duyệt:</span>
                          <span className="text-sm font-medium">{selectedRequest.reviewedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Target Info</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Target ID:</span>
                        <p className="text-sm font-medium">{selectedRequest.targetId}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Target Title:</span>
                        <p className="text-sm font-medium">{selectedRequest.targetTitle || 'Không có tiêu đề'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback Section */}
                {selectedRequest.feedback && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Phản hồi từ Manager
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedRequest.feedback}
                      </p>
                    </div>
                  </div>
                )}

                {/* Target Details */}
                {isLoadingTargetDetails && (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-blue-600 font-medium">Đang tải thông tin chi tiết...</p>
                  </div>
                )}

                {/* Course Details */}
                {targetDetails.course && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Thông tin Khóa học
                    </h3>
                    <Card className="border border-gray-200">
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900 mb-3">
                              {targetDetails.course.title}
                            </h4>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Mô tả:</span> {targetDetails.course.description}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Cấp độ:</span> {targetDetails.course.level}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Thời gian:</span> {targetDetails.course.duration} phút
                              </p>
                            </div>
                          </div>
                          
                          {targetDetails.course.image && (
                            <div className="flex justify-center">
                              <div className="w-full max-w-sm">
                                {!courseImageError ? (
                                  <img
                                    src={targetDetails.course.image}
                                    alt={targetDetails.course.title}
                                    className="w-full h-48 object-cover rounded-lg shadow-md"
                                    onError={() => setCourseImageError(true)}
                                  />
                                ) : (
                                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                      <p className="text-sm text-gray-500">Không thể tải ảnh</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Chapter Details */}
                {targetDetails.chapter && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Thông tin Chương
                    </h3>
                    <Card className="border border-gray-200">
                      <div className="p-6">
                        <h4 className="font-semibold text-lg text-gray-900 mb-3">
                          {targetDetails.chapter.title}
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Mô tả:</span> {targetDetails.chapter.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Khóa học ID:</span> {targetDetails.chapter.courseId}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Unit Details */}
                {targetDetails.unit && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Thông tin Bài học
                    </h3>
                    <Card className="border border-gray-200">
                      <div className="p-6">
                        <h4 className="font-semibold text-lg text-gray-900 mb-3">
                          {targetDetails.unit.title}
                        </h4>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Mô tả:</span> {targetDetails.unit.description}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Chương ID:</span> {targetDetails.unit.chapterId}
                          </p>
                        </div>

                        {/* Materials */}
                        {unitMaterials.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Tài liệu ({unitMaterials.length})
                            </h5>
                            <div className="grid grid-cols-1 gap-3">
                              {unitMaterials.map((material) => (
                                <div key={material.id} className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <FileText className="h-4 w-4 text-gray-500 mt-1" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {material.description}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Loại: {material.type}
                                      </p>
                                      {material.fileUrl && (
                                        <a
                                          href={material.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                                        >
                                          Xem file
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </StaffNavigation>
  )
}
