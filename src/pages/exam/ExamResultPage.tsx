import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { ExamResult } from "../../components/exam/ExamResult"
import { ExamService } from "../../services/examService"
import type { ExamSubmitResponse, ExamResult as ExamResultType } from "../../types/exam"
import { Loader2, AlertCircle } from "lucide-react"

/**
 * ExamResultPage - Trang hiển thị kết quả bài kiểm tra
 * Nhận dữ liệu từ navigation state (ExamSubmitResponse) hoặc gọi API với examResultId
 */
export function ExamResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { examId, resultId } = useParams<{ examId: string; resultId?: string }>()
  
  const [examResult, setExamResult] = useState<ExamResultType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lấy kết quả từ navigation state (ExamSubmitResponse từ API submit)
  const examResultFromState = location.state?.result as ExamSubmitResponse

  useEffect(() => {
    const fetchExamResult = async () => {
      try {
        setIsLoading(true)
        setError(null)

        let resultToUse: ExamResultType

        // Nếu có dữ liệu từ navigation state, sử dụng nó
        if (examResultFromState) {
          console.log("ExamResultPage - Using data from navigation state:", examResultFromState)
          resultToUse = examResultFromState as ExamResultType
        } else if (resultId) {
          // Nếu không có state nhưng có resultId, gọi API
          console.log("ExamResultPage - Fetching result for ID:", resultId)
          resultToUse = await ExamService.getExamResult(resultId)
        } else {
          throw new Error("Không tìm thấy dữ liệu kết quả bài kiểm tra")
        }

        console.log("ExamResultPage - Final result:", resultToUse)
        setExamResult(resultToUse)
        
      } catch (err) {
        console.error("Error fetching exam result:", err)
        setError(err instanceof Error ? err.message : 'Không thể tải kết quả bài kiểm tra')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExamResult()
  }, [examResultFromState, resultId])

  const handleRestart = () => {
    if (examId) {
      navigate(`/exam/${examId}/preparation`)
    } else {
      navigate(-1)
    }
  }

  const handleShowAnswers = () => {
    // Navigate to exam answer review page with exam result data
    if (examResult?.examResultId) {
      navigate(`/exam-result/${examResult.examResultId}/review`, { 
        state: { examResult } 
      })
    } else {
      console.error("No exam result ID available")
      alert("Không thể xem chi tiết đáp án. Vui lòng thử lại.")
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Đang tải kết quả bài kiểm tra...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Có lỗi xảy ra</h2>
          <p className="text-gray-600">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Nếu không có dữ liệu kết quả, hiển thị lỗi
  if (!examResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Không tìm thấy kết quả bài kiểm tra</h2>
          <p className="text-gray-600">Dữ liệu kết quả không khả dụng hoặc đã bị mất.</p>
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

  // Debug log to check data structure
  console.log("ExamResult data:", examResult)

  return (
    <ExamResult
      examResult={examResult}
      onRestart={handleRestart}
      onShowAnswers={handleShowAnswers}
    />
  )
}
