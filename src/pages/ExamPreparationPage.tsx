import { useNavigate, useParams } from "react-router-dom"
import { ExamPreparation } from "../components/exam/ExamPreparation"

export function ExamPreparationPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()

  const handleStartExam = () => {
    // Navigate to exam taking page
    navigate(`/exam/${examId}/take`)
  }

  const handleBack = () => {
    navigate(-1) // Go back to previous page
  }

  if (!examId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Không tìm thấy bài kiểm tra</h2>
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
    <ExamPreparation
      examId={examId}
      onStart={handleStartExam}
      onBack={handleBack}
    />
  )
}
