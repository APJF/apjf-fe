import { useEffect, useState } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import { ExamAnswerReview } from "../../components/exam/ExamAnswerReview"
import { ExamService } from "../../services/examService"
import { ExamDataFormatter } from "../../utils/examUtils"
import type { ExamResult } from "../../types/exam"

/**
 * ExamAnswerReviewPage - Trang xem chi tiết đáp án của bài kiểm tra
 * Nhận dữ liệu từ navigation state, và bổ sung thông tin từ API nếu cần
 */
export function ExamAnswerReviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { resultId } = useParams<{ resultId: string }>()
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Lấy exam result từ navigation state trước
  const examResultFromState = location.state?.examResult as ExamResult

  // Helper function to merge exam questions with result answers
  const mergeExamDataWithResult = async (result: ExamResult) => {
    // Validate result first
    const validation = ExamDataFormatter.validateExamResult(result)
    if (!validation.isValid) {
      console.warn('ExamResult validation issues:', validation.errors)
    }

    // Luôn gọi API để lấy thông tin chi tiết về exam (để có explanation, options)
    try {
      const response = await ExamService.getExamDetail(result.examId)
      if (!response.success) {
        throw new Error(response.message || "Không thể tải thông tin bài kiểm tra")
      }
      
      console.log("ExamAnswerReviewPage - Exam Data:", response.data)
      
      // Sử dụng utility để merge dữ liệu
      const enhancedResult = ExamDataFormatter.mergeExamResultWithQuestions(
        result,
        response.data.questions
      )
      
      console.log("ExamAnswerReviewPage - Enhanced Result:", enhancedResult)
      return enhancedResult
    } catch (examError) {
      console.warn("Không thể lấy thông tin đầy đủ về bài kiểm tra:", examError)
      // Trả về result gốc nếu không thể lấy thêm thông tin
      return result
    }
  }

  useEffect(() => {
    const fetchExamResult = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        let resultToUse: ExamResult
        
        // Nếu có dữ liệu từ navigation state, sử dụng nó
        if (examResultFromState) {
          console.log("ExamAnswerReviewPage - Using data from navigation state:", examResultFromState)
          resultToUse = examResultFromState
        } else if (resultId) {
          // Nếu không có state, thử gọi API (fallback)
          console.log("ExamAnswerReviewPage - Fetching result for ID:", resultId)
          const result = await ExamService.getExamResult(resultId)
          
          if (!result.success) {
            throw new Error(result.message || "Không thể tải kết quả bài kiểm tra")
          }
          
          resultToUse = result.data
        } else {
          throw new Error("Không tìm thấy dữ liệu kết quả bài kiểm tra")
        }
        
        console.log("ExamAnswerReviewPage - Result to use:", resultToUse)
        
        // Merge với dữ liệu exam để có đầy đủ câu hỏi, options, explanations
        const completeResult = await mergeExamDataWithResult(resultToUse)
        
        console.log("ExamAnswerReviewPage - Final Result:", completeResult)
        setExamResult(completeResult)
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
