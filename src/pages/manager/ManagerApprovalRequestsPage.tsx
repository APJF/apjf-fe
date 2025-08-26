import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Textarea } from '../../components/ui/Textarea'
import { Alert } from '../../components/ui/Alert'
import { ManagerNavigation } from '../../components/layout/ManagerNavigation'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
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
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { ApprovalRequestService } from '../../services/approvalRequestService'
import { CourseService } from '../../services/courseService'
import { StaffChapterService } from '../../services/staffChapterService'
import { StaffUnitService } from '../../services/staffUnitService'
import { MaterialService, type Material } from '../../services/materialService'
import type { ApprovalRequest } from '../../types/approvalRequest'
import type { Course } from '../../types/course'
import type { Chapter } from '../../types/chapter'
import type { UnitDetail } from '../../types/unit'

// Extended interfaces for nested requests
interface ChapterWithRequests {
  id: string
  title: string
  description?: string
  courseId: string
  latestRequest?: ApprovalRequest
  units?: UnitWithRequest[]
  expanded?: boolean
}

interface UnitWithRequest {
  id: string
  title: string
  latestRequest?: ApprovalRequest
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
  
  // State for nested requests
  const [courseChapters, setCourseChapters] = useState<ChapterWithRequests[]>([])
  const [chapterUnits, setChapterUnits] = useState<UnitWithRequest[]>([])
  const [isLoadingNestedRequests, setIsLoadingNestedRequests] = useState(false)
 
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


  // Fetch nested requests for course details
  const fetchCourseNestedRequests = async (courseId: string) => {
    try {
      setIsLoadingNestedRequests(true)
      
      // Get chapters in course
      const chaptersResponse = await CourseService.getChaptersByCourseId(courseId)
      if (!chaptersResponse.success) {
        throw new Error('Failed to fetch chapters')
      }

      const chapters = chaptersResponse.data
      const chaptersWithRequests: ChapterWithRequests[] = []

      // For each chapter, get latest request and units
      for (const chapter of chapters) {
        const chapterWithRequests: ChapterWithRequests = {
          id: chapter.id,
          title: chapter.title,
          description: chapter.description || undefined,
          courseId: chapter.courseId,
          expanded: false
        }

        // Find latest request for this chapter
        const chapterRequests = requests.filter(req => 
          req.targetType === 'CHAPTER' && req.targetId === chapter.id.toString()
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        if (chapterRequests.length > 0) {
          chapterWithRequests.latestRequest = chapterRequests[0]
        }

        // Get units in chapter
        try {
          const unitsResponse = await CourseService.getUnitsByChapterId(chapter.id.toString())
          if (unitsResponse.success) {
            const unitsWithRequests: UnitWithRequest[] = []
            
            for (const unit of unitsResponse.data) {
              const unitRequests = requests.filter(req => 
                req.targetType === 'UNIT' && req.targetId === unit.id.toString()
              ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              
              unitsWithRequests.push({
                id: unit.id.toString(),
                title: unit.title,
                latestRequest: unitRequests.length > 0 ? unitRequests[0] : undefined
              })
            }
            
            chapterWithRequests.units = unitsWithRequests
          }
        } catch (error) {
          console.error(`Error fetching units for chapter ${chapter.id}:`, error)
          chapterWithRequests.units = []
        }

        chaptersWithRequests.push(chapterWithRequests)
      }

      setCourseChapters(chaptersWithRequests)
    } catch (error) {
      console.error('Error fetching course nested requests:', error)
      showToast('error', 'Không thể tải danh sách chapter và unit')
    } finally {
      setIsLoadingNestedRequests(false)
    }
  }

  // Fetch nested requests for chapter details
  const fetchChapterNestedRequests = async (chapterId: string) => {
    try {
      setIsLoadingNestedRequests(true)
      
      // Get units in chapter
      const unitsResponse = await CourseService.getUnitsByChapterId(chapterId)
      if (!unitsResponse.success) {
        throw new Error('Failed to fetch units')
      }

      const unitsWithRequests: UnitWithRequest[] = []
      
      for (const unit of unitsResponse.data) {
        const unitRequests = requests.filter(req => 
          req.targetType === 'UNIT' && req.targetId === unit.id.toString()
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        unitsWithRequests.push({
          id: unit.id.toString(),
          title: unit.title,
          latestRequest: unitRequests.length > 0 ? unitRequests[0] : undefined
        })
      }

      setChapterUnits(unitsWithRequests)
    } catch (error) {
      console.error('Error fetching chapter nested requests:', error)
      showToast('error', 'Không thể tải danh sách unit')
    } finally {
      setIsLoadingNestedRequests(false)
    }
  }

  // Fetch target details based on targetType and targetId
  const fetchTargetDetails = async (targetType: string, targetId: string) => {
    try {
      setIsLoadingTargetDetails(true)
      setTargetDetails({}) // Reset previous details
     
      switch (targetType) {
        case 'COURSE':
          try {
            const courseResponse = await CourseService.getCourseDetail(targetId)
            if (courseResponse.success) {
              setTargetDetails(prev => ({ ...prev, course: courseResponse.data }))
            }
          } catch (error) {
            console.error('Error fetching course details:', error)
          }
          break
         
        case 'CHAPTER':
          try {
            const chapterResponse = await StaffChapterService.getChapterDetail(targetId)
            if (chapterResponse.success) {
              setTargetDetails(prev => ({ ...prev, chapter: chapterResponse.data }))
            }
          } catch (error) {
            console.error('Error fetching chapter details:', error)
          }
          break
         
        case 'UNIT':
          try {
            setIsLoadingMaterials(true)
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
          } finally {
            setIsLoadingMaterials(false)
          }
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


  const handleRowClick = async (request: ApprovalRequest) => {
    setSelectedRequest(request)
    setIsDetailDialogOpen(true)
   
    // Reset previous data
    setCourseChapters([])
    setChapterUnits([])
   
    // Fetch target details based on targetType and targetId
    await fetchTargetDetails(request.targetType, request.targetId)
    
    // Fetch nested requests based on target type
    if (request.targetType === 'COURSE') {
      await fetchCourseNestedRequests(request.targetId)
    } else if (request.targetType === 'CHAPTER') {
      await fetchChapterNestedRequests(request.targetId)
    }
  }


  const handleRejectClick = (request: ApprovalRequest) => {
    setRejectingRequest(request)
    setRejectFeedback("")
    setIsRejectDialogOpen(true)
  }

  // Helper functions for nested requests
  const toggleChapterExpand = (chapterId: string) => {
    setCourseChapters(prev => prev.map(chapter => 
      chapter.id.toString() === chapterId 
        ? { ...chapter, expanded: !chapter.expanded }
        : chapter
    ))
  }

  const handleNestedRequestAction = async (request: ApprovalRequest, action: 'approve' | 'reject', feedback?: string) => {
    try {
      setIsActionLoading(true)
      
      if (action === 'approve') {
        await ApprovalRequestService.approveRequest(request.id, feedback)
        showToast('success', 'Yêu cầu đã được phê duyệt thành công!')
      } else if (action === 'reject' && feedback) {
        await ApprovalRequestService.rejectRequest(request.id, feedback)
        showToast('success', 'Yêu cầu đã được từ chối')
      }

      // Update the request in global state
      setRequests(prev => prev.map(req =>
        req.id === request.id
          ? { 
              ...req, 
              decision: action === 'approve' ? "APPROVED" : "REJECTED",
              feedback: feedback || req.feedback,
              reviewedAt: new Date().toISOString(),
              reviewedBy: user?.username || 'Manager'
            }
          : req
      ))

      // Update nested data based on target type
      if (selectedRequest?.targetType === 'COURSE') {
        await fetchCourseNestedRequests(selectedRequest.targetId)
      } else if (selectedRequest?.targetType === 'CHAPTER') {
        await fetchChapterNestedRequests(selectedRequest.targetId)
      }

    } catch (error) {
      console.error(`Error ${action}ing nested request:`, error)
      showToast('error', `Có lỗi xảy ra khi ${action === 'approve' ? 'phê duyệt' : 'từ chối'} yêu cầu`)
    } finally {
      setIsActionLoading(false)
    }
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
                  <div className="col-span-2">Hành động</div>
                  <div className="col-span-2">Người tạo</div>
                  <div className="col-span-2">Thời gian</div>
                  <div className="col-span-2">Trạng thái</div>
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
                    <button
                      key={item.id}
                      type="button"
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors cursor-pointer text-left w-full border-0 bg-transparent"
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
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          {getDecisionIcon(item.decision)}
                          <Badge className={`${getDecisionColor(item.decision)} text-xs font-medium`}>
                            {getDecisionText(item.decision)}
                          </Badge>
                        </div>
                      </div>
                      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                      <div
                        className="col-span-1 flex gap-1 items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                              className="h-8 w-8 p-0 group relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
                              title="Từ chối"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <X className="h-4 w-4 relative z-10 drop-shadow-sm" />
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
                    </button>
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


                    {/* Target Details Section */}
                    {isLoadingTargetDetails ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-3 text-gray-600">Đang tải thông tin chi tiết...</span>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Thông tin chi tiết {getTargetTypeText(selectedRequest.targetType).toLowerCase()}
                        </h4>
                       
                        {/* Course Details */}
                        {selectedRequest.targetType === 'COURSE' && targetDetails.course && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                            {/* Course Image */}
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-medium overflow-hidden flex-shrink-0">
                                {targetDetails.course.image && !courseImageError ? (
                                  <img
                                    src={targetDetails.course.image}
                                    alt={targetDetails.course.title || 'Course'}
                                    className="w-full h-full rounded-lg object-cover"
                                    onError={() => setCourseImageError(true)}
                                    onLoad={() => setCourseImageError(false)}
                                  />
                                ) : (
                                  <BookOpen className="h-8 w-8" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h5 className="text-lg font-semibold text-blue-900 mb-1">
                                  {targetDetails.course.title}
                                </h5>
                                <p className="text-blue-700 text-sm">Thông tin chi tiết khóa học</p>
                              </div>
                            </div>
                           
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-medium text-gray-600">Mã khóa học:</span>
                                <p className="text-gray-900 font-mono">{targetDetails.course.id}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Trình độ:</span>
                                <p className="text-gray-900">{targetDetails.course.level}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Thời lượng:</span>
                                <p className="text-gray-900">{targetDetails.course.duration} giờ</p>
                              </div>
                            </div>
                            {targetDetails.course.description && (
                              <div>
                                <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                                <p className="text-gray-900 mt-1">{targetDetails.course.description}</p>
                              </div>
                            )}
                            {targetDetails.course.requirement && (
                              <div>
                                <span className="text-sm font-medium text-gray-600">Yêu cầu:</span>
                                <p className="text-gray-900 mt-1">{targetDetails.course.requirement}</p>
                              </div>
                            )}
                            {targetDetails.course.averageRating && (
                              <div>
                                <span className="text-sm font-medium text-gray-600">Đánh giá trung bình:</span>
                                <p className="text-gray-900">{targetDetails.course.averageRating}/5 ⭐</p>
                              </div>
                            )}
                          </div>
                        )}


                        {/* Chapter Details */}
                        {selectedRequest.targetType === 'CHAPTER' && targetDetails.chapter && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-medium text-gray-600">Mã chương:</span>
                                <p className="text-gray-900 font-mono">{targetDetails.chapter.id}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Thuộc khóa học:</span>
                                <p className="text-gray-900 font-mono">{targetDetails.chapter.courseId}</p>
                              </div>
                              {targetDetails.chapter.prerequisiteChapterId && (
                                <div>
                                  <span className="text-sm font-medium text-gray-600">Chương tiên quyết:</span>
                                  <p className="text-gray-900 font-mono">{targetDetails.chapter.prerequisiteChapterId}</p>
                                </div>
                              )}
                            </div>
                            {targetDetails.chapter.description && (
                              <div>
                                <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                                <p className="text-gray-900 mt-1">{targetDetails.chapter.description}</p>
                              </div>
                            )}
                          </div>
                        )}


                        {/* Unit Details */}
                        {selectedRequest.targetType === 'UNIT' && targetDetails.unit && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-medium text-gray-600">Mã bài học:</span>
                                <p className="text-gray-900 font-mono">{targetDetails.unit.id}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Thuộc chương:</span>
                                <p className="text-gray-900 font-mono">{targetDetails.unit.chapterId}</p>
                              </div>
                              {targetDetails.unit.prerequisiteUnitId && (
                                <div>
                                  <span className="text-sm font-medium text-gray-600">Bài học tiên quyết:</span>
                                  <p className="text-gray-900 font-mono">{targetDetails.unit.prerequisiteUnitId}</p>
                                </div>
                              )}
                            </div>
                            {targetDetails.unit.description && (
                              <div>
                                <span className="text-sm font-medium text-gray-600">Mô tả:</span>
                                <p className="text-gray-900 mt-1">{targetDetails.unit.description}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}


                    {/* Materials Section - Only show for UNIT requests (Read-only, no approval needed) */}
                    {selectedRequest.targetType === 'UNIT' && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Danh sách Materials
                        </h4>
                       
                        {isLoadingMaterials ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            <span className="ml-3 text-gray-600">Đang tải materials...</span>
                          </div>
                        ) : (
                          <>
                            {unitMaterials.length > 0 ? (
                              <div className="space-y-3">
                                {unitMaterials.map((material) => (
                                  <div key={material.id} className="bg-gray-50 border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge variant="outline" className="text-xs">
                                            {material.type}
                                          </Badge>
                                          <span className="text-xs text-gray-500 font-mono">
                                            ID: {material.id}
                                          </span>
                                        </div>
                                        {material.script && (
                                          <div className="mb-2">
                                            <span className="text-sm font-medium text-gray-600">Nội dung:</span>
                                            <p className="text-sm text-gray-900">{material.script}</p>
                                          </div>
                                        )}
                                        {material.translation && (
                                          <div className="mb-2">
                                            <span className="text-sm font-medium text-gray-600">Bản dịch:</span>
                                            <p className="text-sm text-gray-900">{material.translation}</p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex gap-2 ml-4">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.open(material.fileUrl, '_blank')}
                                          className="text-xs"
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          Xem
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
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


                    {/* Course Chapters and Units Requests */}
                    {selectedRequest.targetType === 'COURSE' && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Layers className="h-5 w-5" />
                          Danh sách Chapter và Unit
                        </h4>
                        
                        {isLoadingNestedRequests ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            <span className="ml-3 text-gray-600">Đang tải danh sách...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {courseChapters.length > 0 ? (
                              courseChapters.map((chapter) => (
                                <div key={chapter.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                  {/* Chapter Header */}
                                  <div className="bg-gray-50 p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 flex-1">
                                        <button
                                          onClick={() => toggleChapterExpand(chapter.id)}
                                          className="text-gray-500 hover:text-gray-700"
                                        >
                                          {chapter.expanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )}
                                        </button>
                                        <Layers className="h-4 w-4 text-purple-600" />
                                        <div>
                                          <h5 className="font-medium text-gray-900">{chapter.title}</h5>
                                          <p className="text-xs text-gray-500">Chapter ID: {chapter.id}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        {chapter.latestRequest ? (
                                          <>
                                            <Badge className={getDecisionColor(chapter.latestRequest.decision)}>
                                              {getDecisionText(chapter.latestRequest.decision)}
                                            </Badge>
                                            {chapter.latestRequest.decision === "PENDING" && (
                                              <div className="flex gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => handleNestedRequestAction(chapter.latestRequest!, 'approve')}
                                                  disabled={isActionLoading}
                                                  className="h-7 w-7 p-0 hover:bg-green-100 text-green-600"
                                                  title="Phê duyệt"
                                                >
                                                  <Check className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    setRejectingRequest(chapter.latestRequest!)
                                                    setIsRejectDialogOpen(true)
                                                  }}
                                                  disabled={isActionLoading}
                                                  className="h-7 w-7 p-0 hover:bg-red-100 text-red-600"
                                                  title="Từ chối"
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleRowClick(chapter.latestRequest!)}
                                              className="h-7 w-7 p-0 hover:bg-blue-100 text-blue-600"
                                              title="Xem chi tiết"
                                            >
                                              <Eye className="h-3 w-3" />
                                            </Button>
                                          </>
                                        ) : (
                                          <span className="text-xs text-gray-400">Không có request</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Units List (when expanded) */}
                                  {chapter.expanded && chapter.units && (
                                    <div className="bg-white">
                                      {chapter.units.length > 0 ? (
                                        chapter.units.map((unit) => (
                                          <div key={unit.id} className="border-t border-gray-100 p-3 pl-12">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <FileText className="h-3 w-3 text-blue-600" />
                                                <div>
                                                  <span className="text-sm font-medium text-gray-900">{unit.title}</span>
                                                  <p className="text-xs text-gray-500">Unit ID: {unit.id}</p>
                                                </div>
                                              </div>
                                              
                                              <div className="flex items-center gap-2">
                                                {unit.latestRequest ? (
                                                  <>
                                                    <Badge className={getDecisionColor(unit.latestRequest.decision)}>
                                                      {getDecisionText(unit.latestRequest.decision)}
                                                    </Badge>
                                                    {unit.latestRequest.decision === "PENDING" && (
                                                      <div className="flex gap-1">
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          onClick={() => handleNestedRequestAction(unit.latestRequest!, 'approve')}
                                                          disabled={isActionLoading}
                                                          className="h-6 w-6 p-0 hover:bg-green-100 text-green-600"
                                                          title="Phê duyệt"
                                                        >
                                                          <Check className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          onClick={() => {
                                                            setRejectingRequest(unit.latestRequest!)
                                                            setIsRejectDialogOpen(true)
                                                          }}
                                                          disabled={isActionLoading}
                                                          className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                                                          title="Từ chối"
                                                        >
                                                          <X className="h-3 w-3" />
                                                        </Button>
                                                      </div>
                                                    )}
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => handleRowClick(unit.latestRequest!)}
                                                      className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-600"
                                                      title="Xem chi tiết"
                                                    >
                                                      <Eye className="h-3 w-3" />
                                                    </Button>
                                                  </>
                                                ) : (
                                                  <span className="text-xs text-gray-400">Không có request</span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="border-t border-gray-100 p-4 pl-12 text-center text-sm text-gray-500">
                                          Chưa có unit nào trong chapter này
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Layers className="h-12 w-12 mx-auto mb-4 opacity-40" />
                                <p>Không có chapter nào trong course này</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chapter Units Requests */}
                    {selectedRequest.targetType === 'CHAPTER' && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Danh sách Unit trong Chapter
                        </h4>
                        
                        {isLoadingNestedRequests ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            <span className="ml-3 text-gray-600">Đang tải danh sách unit...</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {chapterUnits.length > 0 ? (
                              chapterUnits.map((unit) => (
                                <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                      <div>
                                        <h5 className="font-medium text-gray-900">{unit.title}</h5>
                                        <p className="text-xs text-gray-500">Unit ID: {unit.id}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {unit.latestRequest ? (
                                        <>
                                          <Badge className={getDecisionColor(unit.latestRequest.decision)}>
                                            {getDecisionText(unit.latestRequest.decision)}
                                          </Badge>
                                          {unit.latestRequest.decision === "PENDING" && (
                                            <div className="flex gap-1">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleNestedRequestAction(unit.latestRequest!, 'approve')}
                                                disabled={isActionLoading}
                                                className="h-7 w-7 p-0 hover:bg-green-100 text-green-600"
                                                title="Phê duyệt"
                                              >
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                  setRejectingRequest(unit.latestRequest!)
                                                  setIsRejectDialogOpen(true)
                                                }}
                                                disabled={isActionLoading}
                                                className="h-7 w-7 p-0 hover:bg-red-100 text-red-600"
                                                title="Từ chối"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          )}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRowClick(unit.latestRequest!)}
                                            className="h-7 w-7 p-0 hover:bg-blue-100 text-blue-600"
                                            title="Xem chi tiết"
                                          >
                                            <Eye className="h-3 w-3" />
                                          </Button>
                                        </>
                                      ) : (
                                        <span className="text-xs text-gray-400">Không có request</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
                                <p>Không có unit nào trong chapter này</p>
                              </div>
                            )}
                          </div>
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
                  maxLength={255}
                  className="mb-4"
                />
                <p className={`text-xs mb-4 ${rejectFeedback.length > 200 ? 'text-red-600' : 'text-gray-500'}`}>
                  {rejectFeedback.length}/255 ký tự
                </p>
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
                    onClick={() => {
                      if (rejectingRequest) {
                        // Check if this is a nested request action
                        const isNestedRequest = 
                          (selectedRequest?.targetType === 'COURSE' && 
                           courseChapters.some(ch => ch.latestRequest?.id === rejectingRequest.id || 
                                                     ch.units?.some(u => u.latestRequest?.id === rejectingRequest.id))) ||
                          (selectedRequest?.targetType === 'CHAPTER' && 
                           chapterUnits.some(u => u.latestRequest?.id === rejectingRequest.id))
                        
                        if (isNestedRequest) {
                          handleNestedRequestAction(rejectingRequest, 'reject', rejectFeedback)
                        } else {
                          handleReject(rejectingRequest.id, rejectFeedback)
                        }
                      }
                    }}
                    disabled={!rejectFeedback.trim() || isActionLoading}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
                  >
                    <div className="flex items-center gap-2">
                      {isActionLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {isActionLoading ? 'Đang xử lý...' : 'Từ chối'}
                      </span>
                    </div>
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
