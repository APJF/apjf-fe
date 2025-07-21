import { useLocation, useNavigate, useParams } from "react-router-dom"
import { ExamResult } from "../components/exam/ExamResult"
import type { ExamResult as ExamResultType } from "../types/exam"

/**
 * ExamResultPage - Trang hiển thị kết quả bài kiểm tra
 * Nhận dữ liệu kết quả từ navigation state
 */
export function ExamResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { examId } = useParams<{ examId: string }>()

  // Lấy kết quả từ navigation state
  const examResult = location.state?.result as ExamResultType

  const handleRestart = () => {
    if (examId) {
      navigate(`/exam/${examId}/preparation`)
    } else {
      navigate(-1)
    }
  }

  const handleShowAnswers = () => {
    // Navigate to exam answer review page with exam result data
    if (examResult?.id) {
      navigate(`/exam-result/${examResult.id}/review`, { 
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
