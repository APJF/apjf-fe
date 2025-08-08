import { useState, useEffect, useMemo } from "react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Avatar } from "../components/ui/Avatar"
import { Alert } from "../components/ui/Alert"
import { StaffNavigation } from "../components/layout/StaffNavigation"
import { useAuth } from "../hooks/useAuth"
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Filter, 
  TrendingUp, 
  Calendar,
  RefreshCw,
  FileText,
  Layers,
  BookOpen
} from "lucide-react"
import { approvalRequestService } from "../services/approvalRequestService"
import type { ApprovalRequest } from "../types/approvalRequest"

export function StaffRequestsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Use useAuth hook to get user info properly
  const { user } = useAuth()

  // Fetch requests data
  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (!user?.id) {
        throw new Error('Không tìm thấy thông tin người dùng')
      }

      // Sử dụng API mới với createdBy filter
      const response = await approvalRequestService.getStaffRequests(user.id.toString())
      console.log('📋 API Response:', response)
      console.log('📋 Request Data:', response.data)
      
      // Validate data structure
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((item, index) => {
          console.log(`Request ${index}:`, {
            id: item.id,
            targetTitle: item.targetTitle,
            targetId: item.targetId,
            createdBy: item.createdBy,
            hasAllRequiredFields: !!(item.targetTitle && item.targetId && item.createdBy)
          })
        })
      }
      
      setRequests(response.data)
    } catch (err) {
      console.error('Error fetching requests:', err)
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setIsLoading(false)
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

      const matchesType = typeFilter === "all" || item.targetType === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })

    // Sort by time
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      
      if (sortBy === "newest") {
        return dateB - dateA // Newest first
      } else {
        return dateA - dateB // Oldest first
      }
    })

    return filtered
  }, [requests, searchTerm, statusFilter, typeFilter, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

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

  const getRequestTypeText = (requestType: string) => {
    switch (requestType) {
      case "CREATE":
        return "Tạo mới"
      case "UPDATE":
        return "Cập nhật"
      case "DELETE":
        return "Xóa"
      default:
        return requestType
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getManagerInitials = (name: string | null) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!user) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
          <Alert className="max-w-md">
            <XCircle className="h-4 w-4" />
            <h3 className="font-semibold">Chưa đăng nhập</h3>
            <p className="mt-2 text-sm">Vui lòng đăng nhập để xem danh sách yêu cầu.</p>
          </Alert>
        </div>
      </StaffNavigation>
    )
  }

  if (error) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
          <Alert className="max-w-md">
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
      </StaffNavigation>
    )
  }

  return (
    <StaffNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-blue-900">My Requests</h1>
                  <p className="text-blue-600 font-medium mt-1">
                    Xem phản hồi và quyết định của manager về các yêu cầu của bạn
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
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-blue-900">Bộ lọc và tìm kiếm</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <Input
                    placeholder="Tìm kiếm request..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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

                <div></div>

                <div className="text-right">
                  <span className="text-sm text-blue-600 bg-blue-100 px-3 py-2 rounded-full font-medium">
                    Tìm thấy {filteredData.length} request
                  </span>
                </div>
              </div>
            </div>
          </Card>

        {/* Requests Table */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="p-0">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium">
                <div className="col-span-1">STT</div>
                <div className="col-span-2">ID / Loại</div>
                <div className="col-span-2">Tiêu đề</div>
                <div className="col-span-1">Hành động</div>
                <div className="col-span-2">Người duyệt</div>
                <div className="col-span-2">Thời gian</div>
                <div className="col-span-1">Trạng thái</div>
                <div className="col-span-1">Chi tiết</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-blue-100">
              {isLoading && (
                <div className="px-6 py-12 text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
                  <p className="text-blue-600">Đang tải dữ liệu...</p>
                </div>
              )}
              
              {!isLoading && currentData.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <div className="text-blue-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2 text-blue-700">Không tìm thấy request</p>
                    <p className="text-sm text-blue-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </div>
                </div>
              )}
              
              {!isLoading && currentData.length > 0 && (
                currentData.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="col-span-1 text-sm text-blue-900 font-medium">
                      {startIndex + index + 1}
                    </div>
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <Badge variant="outline" className="border-blue-300 text-blue-700 font-mono text-xs">
                          {item.targetId}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getTargetTypeIcon(item.targetType)}
                          <span className="text-xs text-blue-600">
                            {getTargetTypeText(item.targetType)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm font-medium text-blue-900 line-clamp-2">
                        {item.targetTitle}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs border-purple-300 text-purple-700"
                      >
                        {getRequestTypeText(item.requestType)}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      {item.reviewedBy ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border-2 border-blue-200">
                            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                              {getManagerInitials(item.reviewedBy)}
                            </div>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-blue-900 line-clamp-1">
                              {item.reviewedBy}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Chưa có</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Calendar className="h-3 w-3" />
                          Tạo: {formatDate(item.createdAt)}
                        </div>
                        {item.reviewedAt && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Calendar className="h-3 w-3" />
                            Duyệt: {formatDate(item.reviewedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <div className="flex items-center gap-2">
                        {getDecisionIcon(item.decision)}
                        <Badge className={`${getDecisionColor(item.decision)} text-xs font-medium`}>
                          {getDecisionText(item.decision)}
                        </Badge>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && (
              <div className="bg-blue-50/50 border-t border-blue-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-700 font-medium">
                    Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredData.length)} trong tổng số{" "}
                    {filteredData.length} request
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      Trước
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "text-blue-600 border-blue-300 hover:bg-blue-100"
                          }
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
    </StaffNavigation>
  )
}

export default StaffRequestsPage
