import { useNavigate, useParams } from "react-router-dom"
import { ExamDoing } from "../../components/exam/ExamDoing"

export function ExamDoingPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()

  const handleSubmit = (result: any) => {
    // Navigate to exam results page with result data
    navigate(`/exam/${examId}/result`, { state: { result } })
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
    <ExamDoing
      examId={examId}
      onSubmit={handleSubmit}
      onBack={handleBack}
    />
  )
}
