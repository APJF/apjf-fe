import { useEffect, useState } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { ExamService } from "../../services/examService"
import type { ExamResult } from "../../types/exam"
import { ExamReview } from "../../components/exam/ExamReview"

/**
 * ExamReviewPage - Trang xem chi tiết đáp án của bài kiểm tra với thiết kế mới
 * Nhận examResultId từ params hoặc navigation state và gọi API lấy chi tiết
 */
export function ExamReviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { resultId } = useParams<{ resultId: string }>()
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Lấy examResultId từ navigation state (từ submit exam response)
  const examResultIdFromState = location.state?.examResultId as number | undefined

  useEffect(() => {
    const fetchExamResult = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        let targetResultId: string
        
        // Priority order:
        // 1. resultId from URL params
        // 2. examResultId from navigation state (từ submit exam response)
        if (resultId) {
          targetResultId = resultId
          console.log("ExamReviewPage - Using resultId from URL params:", targetResultId)
        } else if (examResultIdFromState) {
          targetResultId = examResultIdFromState.toString()
          console.log("ExamReviewPage - Using examResultId from navigation state:", targetResultId)
        } else {
          throw new Error("Không có ID kết quả bài thi")
        }
        
        console.log("ExamReviewPage - Fetching exam result for ID:", targetResultId)
        const result = await ExamService.getExamResult(targetResultId)
        console.log("ExamReviewPage - API response:", result)
        
        setExamResult(result)
      } catch (err) {
        console.error("Error fetching exam result:", err)
        let errorMessage = "Không thể tải kết quả bài kiểm tra. Vui lòng thử lại."
        
        if (err instanceof Error) {
          errorMessage = err.message
        }
        
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExamResult()
  }, [resultId, examResultIdFromState])

  const handleBack = () => {
    navigate(-1) // Quay lại trang trước đó
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Đang tải chi tiết đáp án...</p>
        </div>
      </div>
    )
  }

  if (error || !examResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {error || "Không tìm thấy kết quả bài kiểm tra"}
          </h2>
          <p className="text-gray-600">
            Dữ liệu kết quả không khả dụng hoặc đã bị mất.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <ExamReview
      examResult={examResult}
      onBack={handleBack}
    />
  )
}
