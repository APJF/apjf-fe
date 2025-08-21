import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, Trophy, BookOpen, Eye, RefreshCw, Calendar, AlertCircle, Loader2, ChevronDown, ChevronUp, History, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 bg-white p-8 rounded-xl shadow-sm">
          <div className="relative">
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Đang tải dữ liệu</h3>
            <p className="text-gray-600">Vui lòng đợi trong giây lát...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <History className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Lịch sử bài thi</h1>
              </div>
              <p className="text-gray-600 ml-13">Theo dõi và xem lại các bài thi đã thực hiện</p>
            </div>
            <div className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-xl">
              <div className="flex items-center gap-2 text-blue-600">
                <BookOpen className="h-5 w-5" />
                <span className="font-semibold">{filteredExamHistory.length}</span>
              </div>
              <span className="text-gray-500">bài thi</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Tìm kiếm & Lọc</h2>
            <p className="text-sm text-gray-500">Sử dụng các bộ lọc để tìm bài thi bạn cần</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Box */}
            <div className="md:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bài thi hoặc ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3 relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pr-10 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PASSED">✅ Đã qua</option>
                <option value="FAILED">❌ Chưa qua</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Type Filter */}
            <div className="md:col-span-3 relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pr-10 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="ALL">Tất cả loại</option>
                <option value="MULTIPLE_CHOICE">📝 Trắc nghiệm</option>
                <option value="ESSAY">✍️ Tự luận</option>
                <option value="MIXED">🔀 Hỗn hợp</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Filter className="h-4 w-4" />
                <span className="font-medium">
                  Hiển thị {filteredExamHistory.length} kết quả
                </span>
                {searchTerm && (
                  <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                    "{searchTerm}"
                  </span>
                )}
                {statusFilter !== "ALL" && (
                  <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                    {statusFilter === "PASSED" ? "Đã qua" : "Chưa qua"}
                  </span>
                )}
                {typeFilter !== "ALL" && (
                  <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                    {getTypeDisplay(typeFilter)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {paginatedExamHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") 
                ? "Không tìm thấy bài thi nào" 
                : "Chưa có lịch sử bài thi"
              }
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") 
                ? "Không có bài thi nào phù hợp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc." 
                : "Bạn chưa thực hiện bài thi nào. Hãy khám phá các khóa học và bắt đầu bài thi đầu tiên của bạn!"
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  if (searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") {
                    setSearchTerm("")
                    setStatusFilter("ALL")
                    setTypeFilter("ALL")
                  } else {
                    navigate('/courses')
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") 
                  ? "Xóa bộ lọc" 
                  : "Khám phá khóa học"
                }
              </button>
              {!(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") && (
                <button
                  onClick={() => navigate('/learning-path')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Xem lộ trình học
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedExamHistory.map((exam) => {
              const statusInfo = getStatusDisplay(exam.status)
              const StatusIcon = statusInfo.icon
              const attemptCount = examAttemptCounts[exam.examId]
              const hasMultipleAttempts = attemptCount > 1
              const isExpanded = expandedExams.has(exam.examId)
              const allAttempts = getExamAttempts(exam.examId)
              
              return (
                <div key={`${exam.examId}-${exam.examResultId}`} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Left Section - Exam Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <StatusIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
                              {exam.examTitle}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} flex items-center gap-1`}>
                                <StatusIcon className="h-4 w-4" />
                                {statusInfo.text}
                              </span>
                              {hasMultipleAttempts && (
                                <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium flex items-center gap-1">
                                  <RefreshCw className="h-3 w-3" />
                                  {attemptCount} lần làm
                                </span>
                              )}
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                {getTypeDisplay(exam.type)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Exam Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Mã bài thi</p>
                              <p className="font-mono text-sm font-semibold text-gray-900">{exam.examId}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <Trophy className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Điểm số</p>
                              <p className={`text-lg font-bold ${getScoreColor(exam.score)}`}>
                                {exam.score.toFixed(1)}/100
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày làm</p>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(exam.submittedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex flex-col gap-3 ml-6">
                        <button
                          onClick={() => handleViewDetails(exam.examResultId)}
                          className="flex items-center gap-2 px-4 py-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium border border-blue-200 hover:border-blue-300"
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleRetakeExam(exam.examId)}
                          className="flex items-center gap-2 px-4 py-2.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium border border-green-200 hover:border-green-300"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Thi lại
                        </button>
                        {hasMultipleAttempts && (
                          <button
                            onClick={() => toggleExamHistory(exam.examId)}
                            className="flex items-center gap-2 px-4 py-2.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-sm font-medium border border-purple-200 hover:border-purple-300"
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
                                Xem ({attemptCount - 1})
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded History Section */}
                  {isExpanded && hasMultipleAttempts && (
                    <div className="border-t border-gray-100">
                      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-50">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <History className="h-5 w-5 text-purple-600" />
                          Lịch sử các lần thực hiện ({allAttempts.length} lần)
                        </h4>
                        <div className="space-y-3">
                          {allAttempts.map((attempt, index) => {
                            const attemptStatus = getStatusDisplay(attempt.status)
                            const AttemptIcon = attemptStatus.icon
                            const isLatest = index === 0
                            
                            return (
                              <div 
                                key={attempt.examResultId}
                                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                                  isLatest 
                                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-sm' 
                                    : 'bg-white border border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isLatest ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    <span className="text-sm font-bold">
                                      {isLatest ? '★' : allAttempts.length - index}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                        isLatest ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {isLatest ? 'Mới nhất' : `Lần ${allAttempts.length - index}`}
                                      </span>
                                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${attemptStatus.color} flex items-center gap-1`}>
                                        <AttemptIcon className="h-3 w-3" />
                                        {attemptStatus.text}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <Trophy className="h-4 w-4 text-yellow-500" />
                                        <span className={`font-semibold ${getScoreColor(attempt.score)}`}>
                                          {attempt.score.toFixed(1)}
                                        </span>
                                      </div>
                                      <span className="text-gray-400">•</span>
                                      <span>{formatDate(attempt.submittedAt)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleViewDetails(attempt.examResultId)}
                                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors border border-blue-200 hover:border-blue-300"
                                >
                                  <Eye className="h-4 w-4" />
                                  Xem chi tiết
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
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Page Info */}
              <div className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredExamHistory.length)}</span> trong số{' '}
                <span className="font-semibold">{filteredExamHistory.length}</span> kết quả
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page
                    if (totalPages <= 5) {
                      page = i + 1
                    } else if (currentPage <= 3) {
                      page = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i
                    } else {
                      page = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 py-2 text-gray-400">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-colors"
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
        )}
      </div>
    </div>
  )
}
