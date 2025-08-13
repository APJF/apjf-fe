import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, Trophy, BookOpen, Eye, RefreshCw, Calendar, Award, AlertCircle, Loader2, ChevronDown, ChevronUp, History, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { ExamHistoryService } from "../../services/examHistoryService"
import type { ExamHistoryItem } from "../../types/exam"

/**
 * ExamHistoryPage - Trang lịch sử bài thi với API mới
 * API: GET /api/student/exams
 */
export function ExamHistoryPage() {
  const navigate = useNavigate()
  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set())
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)

  // Fetch exam history from API
  useEffect(() => {
    const fetchExamHistory = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("Fetching exam history...")
        
        const history = await ExamHistoryService.getStudentExamHistory()
        console.log("Exam history received:", history)
        console.log("History type:", typeof history)
        console.log("Is array:", Array.isArray(history))
        
        // Ensure history is an array
        const validHistory = Array.isArray(history) ? history : []
        setExamHistory(validHistory)
      } catch (err) {
        console.error("Error fetching exam history:", err)
        setError(err instanceof Error ? err.message : 'Không thể tải lịch sử bài thi')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExamHistory()
  }, [])

  // Lọc và chỉ hiển thị exam mới nhất cho mỗi examId (theo examResultId cao nhất)
  const uniqueExamHistory = useMemo(() => {
    if (!examHistory || !Array.isArray(examHistory) || examHistory.length === 0) return []

    // Group by examId và lấy exam mới nhất (theo examResultId cao nhất)
    const groupedByExamId = examHistory.reduce((acc, exam) => {
      const existingExam = acc[exam.examId]
      // So sánh theo examResultId (string comparison for safety)
      if (!existingExam || parseInt(exam.examResultId) > parseInt(existingExam.examResultId)) {
        acc[exam.examId] = exam
      }
      return acc
    }, {} as Record<string, ExamHistoryItem>)

    // Convert back to array và sort theo examResultId (mới nhất trước)
    return Object.values(groupedByExamId).sort((a, b) => {
      return parseInt(b.examResultId) - parseInt(a.examResultId)
    })
  }, [examHistory])

  // Filtered and searched exam history
  const filteredExamHistory = useMemo(() => {
    let filtered = uniqueExamHistory

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(exam => 
        exam.examTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.examId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(exam => exam.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== "ALL") {
      filtered = filtered.filter(exam => exam.type === typeFilter)
    }

    return filtered
  }, [uniqueExamHistory, searchTerm, statusFilter, typeFilter])

  // Paginated exam history
  const paginatedExamHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredExamHistory.slice(startIndex, endIndex)
  }, [filteredExamHistory, currentPage, itemsPerPage])

  // Total pages calculation
  const totalPages = Math.ceil(filteredExamHistory.length / itemsPerPage)

  // Đếm số lần làm cho mỗi examId
  const examAttemptCounts = useMemo(() => {
    if (!examHistory || !Array.isArray(examHistory)) return {}
    
    return examHistory.reduce((acc, exam) => {
      acc[exam.examId] = (acc[exam.examId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [examHistory])

  // Lấy tất cả attempts cho một examId cụ thể
  const getExamAttempts = (examId: string) => {
    if (!examHistory || !Array.isArray(examHistory)) return []
    
    return examHistory
      .filter(exam => exam.examId === examId)
      .sort((a, b) => parseInt(b.examResultId) - parseInt(a.examResultId)) // Mới nhất trước
  }

  const handleRetakeExam = (examId: string) => {
    console.log("Retaking exam:", examId)
    navigate(`/exam/${examId}/prepare`)
  }

  const handleViewDetails = (examResultId: string) => {
    console.log("Viewing details for result:", examResultId)
    navigate(`/exam-result/${examResultId}/review`)
  }

  const toggleExamHistory = (examId: string) => {
    setExpandedExams(prev => {
      const newSet = new Set(prev)
      if (newSet.has(examId)) {
        newSet.delete(examId)
      } else {
        newSet.add(examId)
      }
      return newSet
    })
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PASSED':
        return {
          text: 'Đã qua',
          color: 'bg-green-100 text-green-800',
          icon: Trophy
        }
      case 'FAILED':
        return {
          text: 'Chưa qua',
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle
        }
      default:
        return {
          text: status,
          color: 'bg-gray-100 text-gray-800',
          icon: Clock
        }
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-bold'
    if (score >= 60) return 'text-blue-600 font-bold'
    if (score >= 40) return 'text-yellow-600 font-bold'
    return 'text-red-600 font-bold'
  }

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'Trắc nghiệm'
      case 'ESSAY':
        return 'Tự luận'
      case 'MIXED':
        return 'Hỗn hợp'
      default:
        return type
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa hoàn thành'
    
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Đang tải lịch sử bài thi...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Có lỗi xảy ra</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử bài thi</h1>
              <p className="text-gray-600">Xem lại các bài thi đã thực hiện</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4" />
              <span>{filteredExamHistory.length} bài thi</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bài thi hoặc ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PASSED">Đã qua</option>
                <option value="FAILED">Chưa qua</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tất cả loại</option>
                <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                <option value="ESSAY">Tự luận</option>
                <option value="MIXED">Hỗn hợp</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Results Summary */}
          {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") && (
            <div className="mt-4 text-sm text-gray-600">
              Hiển thị {filteredExamHistory.length} kết quả
              {searchTerm && ` cho "${searchTerm}"`}
              {statusFilter !== "ALL" && ` - Trạng thái: ${statusFilter === "PASSED" ? "Đã qua" : "Chưa qua"}`}
              {typeFilter !== "ALL" && ` - Loại: ${getTypeDisplay(typeFilter)}`}
            </div>
          )}
        </div>

        {paginatedExamHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") 
                ? "Không tìm thấy bài thi nào" 
                : "Chưa có lịch sử bài thi"
              }
            </h3>
            <p className="text-gray-600 mb-6">
              {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") 
                ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc." 
                : "Bạn chưa thực hiện bài thi nào. Hãy bắt đầu với bài thi đầu tiên của bạn!"
              }
            </p>
            <button
              onClick={() => {
                if (searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") {
                  // Clear filters
                  setSearchTerm("")
                  setStatusFilter("ALL")
                  setTypeFilter("ALL")
                } else {
                  navigate('/courses')
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") 
                ? "Xóa bộ lọc" 
                : "Tìm bài thi"
              }
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedExamHistory.map((exam) => {
              const statusInfo = getStatusDisplay(exam.status)
              const StatusIcon = statusInfo.icon
              const attemptCount = examAttemptCounts[exam.examId]
              const hasMultipleAttempts = attemptCount > 1
              const isExpanded = expandedExams.has(exam.examId)
              const allAttempts = getExamAttempts(exam.examId)
              
              return (
                <div key={`${exam.examId}-${exam.examResultId}`} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Left Section - Exam Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {exam.examTitle}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3 inline mr-1" />
                            {statusInfo.text}
                          </span>
                          {hasMultipleAttempts && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {attemptCount} lần làm
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>ID: {exam.examId}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            <span>{getTypeDisplay(exam.type)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(exam.submittedAt)}</span>
                          </div>
                        </div>

                        {/* Score Section */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <span className="text-sm text-gray-600">Điểm số:</span>
                            <span className={`text-lg font-bold ${getScoreColor(exam.score)}`}>
                              {exam.score.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-col gap-2 ml-6">
                        <button
                          onClick={() => handleViewDetails(exam.examResultId)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() => handleRetakeExam(exam.examId)}
                          className="flex items-center gap-2 px-4 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Thi lại
                        </button>
                        {hasMultipleAttempts && (
                          <button
                            onClick={() => toggleExamHistory(exam.examId)}
                            className="flex items-center gap-2 px-4 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-sm font-medium"
                          >
                            <History className="h-4 w-4" />
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Ẩn lịch sử
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Xem lịch sử ({attemptCount - 1} lần)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded History Section */}
                  {isExpanded && hasMultipleAttempts && (
                    <div className="border-t bg-gray-50">
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Lịch sử các lần làm ({allAttempts.length} lần)
                        </h4>
                        <div className="space-y-2">
                          {allAttempts.map((attempt, index) => {
                            const attemptStatus = getStatusDisplay(attempt.status)
                            const AttemptIcon = attemptStatus.icon
                            const isLatest = index === 0
                            
                            return (
                              <div 
                                key={attempt.examResultId}
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  isLatest ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    isLatest ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {isLatest ? 'Mới nhất' : `Lần ${allAttempts.length - index}`}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${attemptStatus.color}`}>
                                    <AttemptIcon className="h-3 w-3 inline mr-1" />
                                    {attemptStatus.text}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    <span className={`font-semibold ${getScoreColor(attempt.score)}`}>
                                      {attempt.score.toFixed(1)}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(attempt.submittedAt)}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleViewDetails(attempt.examResultId)}
                                  className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                                >
                                  <Eye className="h-3 w-3" />
                                  Xem
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </button>

              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
        )}
      </div>
    </div>
  )
}
