import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { ExamHistory, ExamHistoryFilter } from '../types/examHistory'

const ExamHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const [examHistory, setExamHistory] = useState<ExamHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ExamHistoryFilter>({
    level: 'ALL',
    sortBy: 'attemptedAt',
    sortDirection: 'DESC'
  })

  // Mock data - chỉ bài đã hoàn thành
  const mockExamHistory: ExamHistory[] = [
    {
      examId: '1',
      examTitle: 'Thi N5 - Từ vựng cơ bản',
      courseId: 'course-1',
      courseTitle: 'Tiếng Nhật N5',
      level: 'N5',
      attemptId: 'attempt-1',
      attemptedAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T10:45:00Z',
      status: 'COMPLETED',
      score: 95.5,
      correctAnswers: 38,
      totalQuestions: 40,
      timeSpent: 2700
    },
    {
      examId: '2',
      examTitle: 'Thi N5 - Ngữ pháp',
      courseId: 'course-1',
      courseTitle: 'Tiếng Nhật N5',
      level: 'N5',
      attemptId: 'attempt-2',
      attemptedAt: '2024-01-10T14:30:00Z',
      completedAt: '2024-01-10T15:15:00Z',
      status: 'COMPLETED',
      score: 85.0,
      correctAnswers: 42,
      totalQuestions: 50,
      timeSpent: 2700
    },
    {
      examId: '3',
      examTitle: 'Thi N4 - Đọc hiểu',
      courseId: 'course-2',
      courseTitle: 'Tiếng Nhật N4',
      level: 'N4',
      attemptId: 'attempt-3',
      attemptedAt: '2024-01-20T09:00:00Z',
      completedAt: '2024-01-20T09:50:00Z',
      status: 'COMPLETED',
      score: 72.0,
      correctAnswers: 36,
      totalQuestions: 50,
      timeSpent: 3000
    },
    {
      examId: '4',
      examTitle: 'Thi N4 - Nghe hiểu',
      courseId: 'course-2',
      courseTitle: 'Tiếng Nhật N4',
      level: 'N4',
      attemptId: 'attempt-4',
      attemptedAt: '2024-01-18T16:00:00Z',
      completedAt: '2024-01-18T16:40:00Z',
      status: 'COMPLETED',
      score: 58.5,
      correctAnswers: 23,
      totalQuestions: 40,
      timeSpent: 2400
    },
    {
      examId: '5',
      examTitle: 'Thi N3 - Tổng hợp',
      courseId: 'course-3',
      courseTitle: 'Tiếng Nhật N3',
      level: 'N3',
      attemptId: 'attempt-5',
      attemptedAt: '2024-01-12T13:00:00Z',
      completedAt: '2024-01-12T14:30:00Z',
      status: 'COMPLETED',
      score: 67.5,
      correctAnswers: 27,
      totalQuestions: 40,
      timeSpent: 5400
    },
    {
      examId: '6',
      examTitle: 'Thi N2 - Kanji nâng cao',
      courseId: 'course-4',
      courseTitle: 'Tiếng Nhật N2',
      level: 'N2',
      attemptId: 'attempt-6',
      attemptedAt: '2024-01-08T11:00:00Z',
      completedAt: '2024-01-08T12:45:00Z',
      status: 'COMPLETED',
      score: 45.0,
      correctAnswers: 18,
      totalQuestions: 40,
      timeSpent: 6300
    }
  ]

  useEffect(() => {
    fetchExamHistory()
  }, [filter])

  const fetchExamHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Sử dụng mock data
      let filteredData = mockExamHistory
      
      // Filter theo level
      if (filter.level !== 'ALL') {
        filteredData = filteredData.filter(item => item.level === filter.level)
      }

      // Sort data
      filteredData.sort((a, b) => {
        const aValue = filter.sortBy === 'attemptedAt' ? new Date(a.attemptedAt).getTime() : a.score
        const bValue = filter.sortBy === 'attemptedAt' ? new Date(b.attemptedAt).getTime() : b.score
        
        if (filter.sortDirection === 'ASC') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setExamHistory(filteredData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải lịch sử thi')
    } finally {
      setLoading(false)
    }
  }

  const handleRetakeExam = (examId: string) => {
    navigate(`/exam/${examId}/preparation`)
  }

  const handleViewDetails = (examId: string, attemptId: string) => {
    navigate(`/exam/${examId}/result/${attemptId}`)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBackgroundColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200'
    if (score >= 80) return 'bg-blue-50 border-blue-200'
    if (score >= 70) return 'bg-yellow-50 border-yellow-200'
    if (score >= 60) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-300'
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-300'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-300'
    return 'bg-red-100 text-red-800 border-red-300'
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Đang tải...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Lịch sử thi của tôi</h1>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{examHistory.length}</div>
            <div className="text-sm text-blue-600">Tổng số bài thi</div>
          </div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {examHistory.length}
            </div>
            <div className="text-sm text-green-600">Đã hoàn thành</div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {examHistory.length > 0 
                ? Math.max(...examHistory.map(h => h.score)).toFixed(1)
                : '0'}
            </div>
            <div className="text-sm text-blue-600">Điểm cao nhất</div>
          </div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {examHistory.length > 0 
                ? (examHistory.reduce((sum, h) => sum + h.score, 0) / examHistory.length).toFixed(1)
                : '0'}
            </div>
            <div className="text-sm text-purple-600">Điểm trung bình</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={filter.level}
          onChange={(e) => setFilter((prev: ExamHistoryFilter) => ({ ...prev, level: e.target.value as any }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Tất cả trình độ</option>
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
          <option value="N2">N2</option>
          <option value="N1">N1</option>
        </select>

        <select
          value={`${filter.sortBy}-${filter.sortDirection}`}
          onChange={(e) => {
            const [sortBy, sortDirection] = e.target.value.split('-')
            setFilter((prev: ExamHistoryFilter) => ({ ...prev, sortBy: sortBy as any, sortDirection: sortDirection as any }))
          }}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="attemptedAt-DESC">Thời gian thi (Mới nhất)</option>
          <option value="attemptedAt-ASC">Thời gian thi (Cũ nhất)</option>
          <option value="score-DESC">Điểm số (Cao nhất)</option>
          <option value="score-ASC">Điểm số (Thấp nhất)</option>
        </select>
      </div>

      {error && (
        <Card className="mb-6 p-4 border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {examHistory.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">Bạn chưa có lịch sử thi nào</p>
          <Button onClick={() => navigate('/courses')}>
            Khám phá khóa học
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examHistory.map((history) => (
            <Card 
              key={`${history.examId}-${history.attemptId}`} 
              className={`p-6 transition-all hover:shadow-lg ${
                history.status === 'COMPLETED' ? getScoreBackgroundColor(history.score) : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate" title={history.examTitle}>
                      {history.examTitle}
                    </h3>
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      {history.level}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">{history.courseTitle}</p>
                  <p className="text-xs text-gray-500">
                    Hoàn thành: {new Date(history.completedAt).toLocaleString('vi-VN')}
                  </p>
                </div>

                {history.status === 'COMPLETED' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <div className={`text-center px-4 py-2 rounded-lg border ${getScoreBadgeColor(history.score)}`}>
                        <div className={`text-2xl font-bold ${getScoreColor(history.score)}`}>
                          {history.score.toFixed(1)}
                        </div>
                        <div className="text-xs">điểm</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {history.correctAnswers}/{history.totalQuestions}
                        </div>
                        <div className="text-xs text-gray-500">Đúng/Tổng</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">
                          {((history.correctAnswers / history.totalQuestions) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Tỷ lệ</div>
                      </div>
                    </div>
                    
                    <div className="text-center text-sm text-gray-600">
                      Thời gian: {formatDuration(history.timeSpent)}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(history.examId, history.attemptId)}
                    className="w-full"
                  >
                    Chi tiết kết quả
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleRetakeExam(history.examId)}
                    className="w-full"
                  >
                    Làm lại
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExamHistoryPage
