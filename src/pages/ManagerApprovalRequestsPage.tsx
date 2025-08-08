import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Textarea } from '../components/ui/Textarea'
import { Alert } from '../components/ui/Alert'
import { ManagerNavigation } from '../components/layout/ManagerNavigation'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
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
  BookOpen,
  AlertCircle,
  Check,
  X,
  Package
} from 'lucide-react'
import { ApprovalRequestService } from '../services/approvalRequestService'
import type { ApprovalRequest } from '../types/approvalRequest'

// Material type definition
interface Material {
  id: string
  title: string
  type: string
  status: string
  url: string
}

export function ManagerApprovalRequestsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectingRequest, setRejectingRequest] = useState<ApprovalRequest | null>(null)
  const [rejectFeedback, setRejectFeedback] = useState("")
  const [currentTab, setCurrentTab] = useState("all")
  const [unitMaterials, setUnitMaterials] = useState<Material[]>([])
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)
  const itemsPerPage = 6

  const { user } = useAuth()
  const { showToast } = useToast()

  // Fetch requests data
  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await ApprovalRequestService.getAllRequests()
      console.log('📋 Manager API Response:', response)
      setRequests(response)
    } catch (err) {
      console.error('Error fetching requests:', err)
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch materials for a unit
  const fetchUnitMaterials = async (unitId: string) => {
    try {
      setIsLoadingMaterials(true)
      // Mock data for now - replace with actual API call
      console.log('Fetching materials for unit:', unitId)
      const materials = [
        {
          id: '1',
          title: 'Bài giảng: Giới thiệu về Hiragana',
          type: 'LESSON',
          status: 'PENDING',
          url: '/materials/hiragana-intro'
        },
        {
          id: '2',
          title: 'Video: Cách phát âm Hiragana',
          type: 'VIDEO',
          status: 'PENDING', 
          url: '/materials/hiragana-pronunciation'
        },
        {
          id: '3',
          title: 'Bài tập: Luyện viết Hiragana',
          type: 'EXERCISE',
          status: 'PENDING',
          url: '/materials/hiragana-exercise'
        }
      ]
      setUnitMaterials(materials)
    } catch (err) {
      console.error('Error fetching unit materials:', err)
      showToast('error', 'Không thể tải danh sách materials')
    } finally {
      setIsLoadingMaterials(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

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

  // Handle approval
  const handleApprove = async (requestId: number, feedback?: string) => {
    try {
      setIsActionLoading(true)
      setError(null)

      await ApprovalRequestService.approveRequest(requestId, feedback)
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, decision: "APPROVED", reviewedAt: new Date().toISOString(), reviewedBy: user?.username || 'Manager' }
          : req
      ))

      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest(prev => prev ? { 
          ...prev, 
          decision: "APPROVED", 
          reviewedAt: new Date().toISOString(),
          reviewedBy: user?.username || 'Manager'
        } : null)
      }

      showToast('success', 'Yêu cầu đã được phê duyệt thành công!')
    } catch (err) {
      console.error('Error approving request:', err)
      setError('Không thể phê duyệt yêu cầu. Vui lòng thử lại.')
      showToast('error', 'Có lỗi xảy ra khi phê duyệt yêu cầu')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Handle rejection
  const handleReject = async (requestId: number, feedback: string) => {
    if (!feedback.trim()) {
      showToast('error', 'Vui lòng nhập lý do từ chối')
      return
    }

    try {
      setIsActionLoading(true)
      setError(null)

      await ApprovalRequestService.rejectRequest(requestId, feedback)
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              decision: "REJECTED", 
              feedback,
              reviewedAt: new Date().toISOString(),
              reviewedBy: user?.username || 'Manager'
            }
          : req
      ))

      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest(prev => prev ? { 
          ...prev, 
          decision: "REJECTED", 
          feedback,
          reviewedAt: new Date().toISOString(),
          reviewedBy: user?.username || 'Manager'
        } : null)
      }

      setIsRejectDialogOpen(false)
      setRejectingRequest(null)
      setRejectFeedback("")
      showToast('success', 'Yêu cầu đã được từ chối')
    } catch (err) {
      console.error('Error rejecting request:', err)
      setError('Không thể từ chối yêu cầu. Vui lòng thử lại.')
      showToast('error', 'Có lỗi xảy ra khi từ chối yêu cầu')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Get material status badge class
  const getMaterialStatusClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const handleRowClick = async (request: ApprovalRequest) => {
    setSelectedRequest(request)
    setIsDetailDialogOpen(true)
    
    // Fetch materials for the unit if the request is for a unit
    if (request.targetType === 'UNIT') {
      await fetchUnitMaterials(request.targetId)
    }
  }

  const handleRejectClick = (request: ApprovalRequest) => {
    setRejectingRequest(request)
    setRejectFeedback("")
    setIsRejectDialogOpen(true)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <Alert className="max-w-md">
          <XCircle className="h-4 w-4" />
          <h3 className="font-semibold">Chưa đăng nhập</h3>
          <p className="mt-2 text-sm">Vui lòng đăng nhập để xem danh sách yêu cầu.</p>
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
    <ManagerNavigation>
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-blue-900">Manager Approval</h1>
                  <p className="text-blue-600 font-medium mt-1">
                    Quản lý và phê duyệt các yêu cầu của nhân viên
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

          {/* Tabs */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-8">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-blue-900">Phân loại yêu cầu</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Tất cả yêu cầu", icon: FileText },
                  { value: "subjects", label: "Khóa học", icon: BookOpen },
                  { value: "chapters", label: "Chương", icon: Layers },
                  { value: "units", label: "Bài học", icon: FileText }
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={currentTab === value ? "default" : "outline"}
                    onClick={() => {
                      setCurrentTab(value)
                      setCurrentPage(1)
                    }}
                    className={`flex items-center gap-2 ${
                      currentTab === value 
                        ? "bg-blue-600 text-white" 
                        : "border-blue-300 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Filters */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-8">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-blue-900">Bộ lọc và tìm kiếm</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <Input
                    placeholder="Tìm kiếm yêu cầu..."
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

                {currentTab === "all" && (
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
                )}

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
                    Tìm thấy {filteredData.length} yêu cầu
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Requests Table */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="p-0">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium">
                  <div className="col-span-1">STT</div>
                  <div className="col-span-2">ID / Loại</div>
                  <div className="col-span-2">Tiêu đề</div>
                  <div className="col-span-1">Hành động</div>
                  <div className="col-span-2">Người tạo</div>
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
                      <p className="text-lg font-medium mb-2 text-blue-700">Không tìm thấy yêu cầu</p>
                      <p className="text-sm text-blue-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </div>
                )}
                
                {!isLoading && currentData.length > 0 && (
                  currentData.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(item)}
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
                        <div className="text-sm font-medium text-blue-900">
                          {item.createdBy}
                        </div>
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
                      <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                        {item.decision === "PENDING" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApprove(item.id)}
                              disabled={isActionLoading}
                              className="h-8 w-8 p-0 hover:bg-green-100 text-green-600"
                              title="Phê duyệt"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRejectClick(item)}
                              disabled={isActionLoading}
                              className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                              title="Từ chối"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRowClick(item)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600 ml-1"
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
                      {filteredData.length} yêu cầu
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

        {/* Detail Dialog */}
        {isDetailDialogOpen && selectedRequest && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Chi tiết yêu cầu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDetailDialogOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Main Info */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant="outline" className="font-mono">
                          #{selectedRequest.id}
                        </Badge>
                        <Badge className={getDecisionColor(selectedRequest.decision)}>
                          {getDecisionText(selectedRequest.decision)}
                        </Badge>
                        <Badge variant="outline" className="border-purple-300 text-purple-700">
                          {getRequestTypeText(selectedRequest.requestType)}
                        </Badge>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedRequest.targetTitle}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        {getTargetTypeIcon(selectedRequest.targetType)}
                        <span>{getTargetTypeText(selectedRequest.targetType)}</span>
                      </div>
                    </div>

                    {selectedRequest.feedback && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Phản hồi:</h4>
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                          <p className="text-gray-700">{selectedRequest.feedback}</p>
                        </div>
                      </div>
                    )}

                    {/* Materials Section - Only show for UNIT requests */}
                    {selectedRequest.targetType === 'UNIT' && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Danh sách Materials
                        </h4>
                        
                        {isLoadingMaterials ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                          </div>
                        ) : (
                          <>
                            {unitMaterials.length > 0 ? (
                              <div className="space-y-3">
                                {unitMaterials.map((material) => (
                                  <div key={material.id} className="bg-gray-50 border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="font-medium text-gray-900 mb-1">{material.title}</h5>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Badge variant="outline" className="text-xs">
                                            {material.type}
                                          </Badge>
                                          <Badge className={getMaterialStatusClass(material.status)}>
                                            {material.status}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-4">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.open(material.url, '_blank')}
                                          className="text-xs"
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          Xem
                                        </Button>
                                        {material.status === 'PENDING' && (
                                          <>
                                            <Button
                                              size="sm"
                                              onClick={() => showToast('warning', 'Tính năng đang phát triển')}
                                              className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                            >
                                              <Check className="h-3 w-3 mr-1" />
                                              Duyệt
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="destructive" 
                                              onClick={() => showToast('warning', 'Tính năng đang phát triển')}
                                              className="text-xs"
                                            >
                                              <X className="h-3 w-3 mr-1" />
                                              Từ chối
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Bulk Actions for Unit Materials */}
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                                  <h5 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Thao tác hàng loạt cho materials
                                  </h5>
                                  <div className="flex gap-3">
                                    <Button
                                      size="sm"
                                      onClick={() => showToast('warning', 'Tính năng đang phát triển')}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Duyệt tất cả materials
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => showToast('warning', 'Tính năng đang phát triển')}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Từ chối tất cả materials
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
                                <p>Không có materials nào trong unit này</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {selectedRequest.decision === "PENDING" && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-amber-800 mb-2">Quyết định phê duyệt</h4>
                            <p className="text-amber-700 text-sm mb-4">
                              Hãy xem xét kỹ lưỡng trước khi đưa ra quyết định. Quyết định này sẽ được ghi lại trong hệ thống.
                            </p>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => handleApprove(selectedRequest.id)}
                                disabled={isActionLoading}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                {isActionLoading ? 'Đang xử lý...' : 'Phê duyệt'}
                              </Button>
                              <Button
                                onClick={() => {
                                  setRejectingRequest(selectedRequest)
                                  setIsRejectDialogOpen(true)
                                }}
                                disabled={isActionLoading}
                                variant="destructive"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Từ chối
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Metadata */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Thông tin yêu cầu</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-600">ID mục tiêu:</span>
                          <p className="font-mono text-gray-900">{selectedRequest.targetId}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Loại:</span>
                          <p className="font-medium text-gray-900">{getTargetTypeText(selectedRequest.targetType)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Hành động:</span>
                          <p className="font-medium text-gray-900">{getRequestTypeText(selectedRequest.requestType)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Người tạo yêu cầu</h4>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 mb-1">{selectedRequest.createdBy}</p>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Tạo: {formatDate(selectedRequest.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedRequest.reviewedBy && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Người duyệt</h4>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 mb-1">{selectedRequest.reviewedBy}</p>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>Duyệt: {formatDate(selectedRequest.reviewedAt)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Dialog */}
        {isRejectDialogOpen && rejectingRequest && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="bg-red-600 text-white px-6 py-4 rounded-t-xl">
                <h3 className="text-lg font-bold">Từ chối yêu cầu</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Vui lòng nhập lý do từ chối yêu cầu "{rejectingRequest.targetTitle}"
                </p>
                <Textarea
                  placeholder="Nhập lý do từ chối..."
                  value={rejectFeedback}
                  onChange={(e) => setRejectFeedback(e.target.value)}
                  rows={4}
                  className="mb-4"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsRejectDialogOpen(false)
                      setRejectingRequest(null)
                      setRejectFeedback("")
                    }}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(rejectingRequest.id, rejectFeedback)}
                    disabled={!rejectFeedback.trim() || isActionLoading}
                    className="flex-1"
                  >
                    {isActionLoading ? 'Đang xử lý...' : 'Từ chối'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagerNavigation>
  )
}

export default ManagerApprovalRequestsPage
