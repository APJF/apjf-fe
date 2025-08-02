import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import type { ExamHistory, ExamHistoryFilter } from '../types/examHistory'

// Mock data - chỉ bài đã hoàn thành
const mockExamHistory: ExamHistory[] = [
  {
    examId: '1',
    examTitle: 'Thi N5 - Từ vựng cơ bản',
    courseId: 'course-1',
    courseTitle: 'Tiếng Nhật N5',
    level: 'N5',
    attemptId: 'attempt-1',
    attemptedAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T11:15:00Z',
    status: 'COMPLETED',
    score: 85,
    correctAnswers: 17,
    totalQuestions: 20,
    timeSpent: 2700 // 45 minutes
  },
  {
    examId: '2',
    examTitle: 'Thi N4 - Ngữ pháp trung cấp',
    courseId: 'course-2',
    courseTitle: 'Tiếng Nhật N4',
    level: 'N4',
    attemptId: 'attempt-2',
    attemptedAt: '2024-01-20T14:00:00Z',
    completedAt: '2024-01-20T15:30:00Z',
    status: 'COMPLETED',
    score: 92,
    correctAnswers: 23,
    totalQuestions: 25,
    timeSpent: 5400 // 90 minutes
  }
]

const ExamHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const [examHistory, setExamHistory] = useState<ExamHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ExamHistoryFilter>({
    level: 'ALL',
    sortBy: 'attemptedAt',
    sortDirection: 'DESC'
  })

  const fetchExamHistory = useCallback(async () => {
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
        let aValue: string | number
        let bValue: string | number

        if (filter.sortBy === 'attemptedAt') {
          aValue = new Date(a.attemptedAt).getTime()
          bValue = new Date(b.attemptedAt).getTime()
        } else {
          aValue = a.score
          bValue = b.score
        }

        if (filter.sortDirection === 'ASC') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
      
      setExamHistory(filteredData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải lịch sử thi')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchExamHistory()
  }, [fetchExamHistory])

  const handleRetakeExam = (examId: string) => {
    navigate(`/exam/${examId}/preparation`)
  }

  const handleViewResult = (examId: string, attemptId: string) => {
    navigate(`/exam/${examId}/result/${attemptId}`)
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800'
    if (score >= 70) return 'bg-blue-100 text-blue-800'
    if (score >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'N5': return 'bg-green-100 text-green-800'
      case 'N4': return 'bg-blue-100 text-blue-800'
      case 'N3': return 'bg-yellow-100 text-yellow-800'
      case 'N2': return 'bg-orange-100 text-orange-800'
      case 'N1': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Lịch sử thi</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={filter.level}
          onChange={(e) => setFilter((prev: ExamHistoryFilter) => ({ ...prev, level: e.target.value as ExamHistoryFilter['level'] }))}
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
            setFilter((prev: ExamHistoryFilter) => ({ 
              ...prev, 
              sortBy: sortBy as ExamHistoryFilter['sortBy'], 
              sortDirection: sortDirection as ExamHistoryFilter['sortDirection'] 
            }))
          }}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="attemptedAt-DESC">Thời gian thi (Mới nhất)</option>
          <option value="attemptedAt-ASC">Thời gian thi (Cũ nhất)</option>
          <option value="score-DESC">Điểm số (Cao nhất)</option>
          <option value="score-ASC">Điểm số (Thấp nhất)</option>
        </select>
      </div>

      {/* Exam History List */}
      <div className="space-y-4">
        {examHistory.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <p className="text-lg font-medium">Chưa có lịch sử thi nào</p>
              <p className="mt-2">Hãy thực hiện bài thi đầu tiên của bạn!</p>
            </div>
          </Card>
        ) : (
          examHistory.map((exam) => (
            <Card key={exam.attemptId} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {exam.examTitle}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Khóa học: {exam.courseTitle}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className={getLevelColor(exam.level)}>
                          {exam.level}
                        </Badge>
                        <Badge className={getScoreColor(exam.score)}>
                          {exam.score} điểm
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Thời gian thi:</span>
                      <p>{formatDate(exam.attemptedAt)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Kết quả:</span>
                      <p>{exam.correctAnswers}/{exam.totalQuestions} câu đúng</p>
                    </div>
                    <div>
                      <span className="font-medium">Thời gian làm bài:</span>
                      <p>{formatTime(exam.timeSpent)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Trạng thái:</span>
                      <p className="text-green-600 font-medium">Hoàn thành</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-32">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewResult(exam.examId, exam.attemptId)}
                    className="w-full"
                  >
                    Xem kết quả
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleRetakeExam(exam.examId)}
                    className="w-full"
                  >
                    Thi lại
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default ExamHistoryPage
