import { useEffect, useState } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { ExamService } from "../../services/examService"
import type { ExamResult, ExamSubmitResponse } from "../../types/exam"
import { ExamAnswerReview } from "../../components/exam/ExamAnswerReview"

/**
 * ExamAnswerReviewPage - Trang xem chi tiết đáp án của bài kiểm tra
 * Nhận dữ liệu từ navigation state hoặc gọi API với resultId
 */
export function ExamAnswerReviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { resultId } = useParams<{ resultId: string }>()
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Lấy exam result từ navigation state (có thể là ExamSubmitResponse)
  const examResultFromState = location.state?.examResult as ExamResult | ExamSubmitResponse

  useEffect(() => {
    const fetchExamResult = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        let resultToUse: ExamResult
        
        // Nếu có dữ liệu từ navigation state, sử dụng nó
        if (examResultFromState) {
          console.log("ExamAnswerReviewPage - Using data from navigation state:", examResultFromState)
          // Convert ExamSubmitResponse to ExamResult if needed
          if ('examResultId' in examResultFromState) {
            resultToUse = {
              examResultId: examResultFromState.examResultId,
              examId: examResultFromState.examId,
              examTitle: examResultFromState.examTitle,
              score: examResultFromState.score,
              submittedAt: examResultFromState.submittedAt,
              status: examResultFromState.status,
              questionResults: examResultFromState.questionResults
            }
          } else {
            resultToUse = examResultFromState as ExamResult
          }
        } else if (resultId) {
          // Nếu không có state, gọi API để lấy dữ liệu chi tiết
          console.log("ExamAnswerReviewPage - Fetching result for ID:", resultId)
          resultToUse = await ExamService.getExamResult(resultId)
        } else {
          throw new Error("Không có ID kết quả bài thi")
        }
        
        console.log("ExamAnswerReviewPage - Final Result:", resultToUse)
        setExamResult(resultToUse)
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
  }, [resultId, examResultFromState])

  const handleBack = () => {
    navigate(-1) // Quay lại trang trước đó
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Đang tải chi tiết đáp án...</p>
        </div>
      </div>
    )
  }

  if (error || !examResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
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
    <ExamAnswerReview
      examResult={examResult}
      onBack={handleBack}
    />
  )
}
