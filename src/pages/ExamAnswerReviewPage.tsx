import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ExamAnswerReview } from "../components/exam/ExamAnswerReview"
import { examService } from "../services/examService"
import type { ExamResult } from "../types/exam"

/**
 * ExamAnswerReviewPage - Trang xem chi tiết đáp án của bài kiểm tra
 * Lấy dữ liệu từ API và hiển thị đáp án từng câu
 */
export function ExamAnswerReviewPage() {
  const navigate = useNavigate()
  const { resultId } = useParams<{ resultId: string }>()
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to merge exam questions with result answers
  const mergeExamDataWithResult = async (result: ExamResult) => {
    if (result.answers && result.answers.length >= result.totalQuestions) {
      // Nếu đã có đầy đủ câu hỏi, vẫn cần phải lấy thông tin chi tiết về options
      try {
        const examData = await examService.getExamById(result.examId)
        console.log("ExamAnswerReviewPage - Exam Data:", examData)
        
        // Bổ sung thông tin options cho mỗi câu hỏi
        result.answers = result.answers.map(answer => {
          const question = examData.questions.find(q => q.id === answer.questionId)
          return {
            ...answer,
            options: question?.options || [],
            type: question?.type || "MULTIPLE_CHOICE"
          }
        })
        
        return result
      } catch (error) {
        console.warn("Không thể lấy thông tin options cho câu hỏi:", error)
        return result
      }
    }

    console.warn("API chỉ trả về", result.answers.length, "câu hỏi trong tổng số", result.totalQuestions, "câu")
    
    try {
      const examData = await examService.getExamById(result.examId)
      console.log("ExamAnswerReviewPage - Exam Data:", examData)
      
      // Tạo đầy đủ câu hỏi từ dữ liệu exam và result
      const completeAnswers = examData.questions.map(question => {
        // Tìm câu trả lời tương ứng từ result
        const existingAnswer = result.answers.find(answer => answer.questionId === question.id)
        
        if (existingAnswer) {
          return {
            ...existingAnswer,
            options: question.options,
            type: question.type
          }
        } else {
          // Tạo câu trả lời mặc định cho câu chưa trả lời
          return {
            id: `answer_${question.id}`,
            userAnswer: null,
            isCorrect: false,
            questionId: question.id,
            questionContent: question.content,
            selectedOptionId: null,
            correctAnswer: question.correctAnswer,
            options: question.options,
            type: question.type
          }
        }
      })
      
      // Cập nhật result với đầy đủ câu hỏi
      result.answers = completeAnswers
      console.log("ExamAnswerReviewPage - Complete Answers:", completeAnswers)
      return result
    } catch (examError) {
      console.warn("Không thể lấy thông tin đầy đủ về bài kiểm tra:", examError)
      return result
    }
  }

  useEffect(() => {
    const fetchExamResult = async () => {
      if (!resultId) {
        setError("Không tìm thấy ID kết quả bài kiểm tra")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        // Gọi API để lấy chi tiết kết quả bài kiểm tra
        const result = await examService.getExamResult(resultId)
        console.log("ExamAnswerReviewPage - API Result:", result)
        console.log("ExamAnswerReviewPage - API Result Answers:", result.answers)
        
        // Merge với dữ liệu exam để có đầy đủ câu hỏi
        const completeResult = await mergeExamDataWithResult(result)
        
        setExamResult(completeResult)
      } catch (err) {
        console.error("Error fetching exam result:", err)
        setError("Không thể tải kết quả bài kiểm tra. Vui lòng thử lại.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchExamResult()
  }, [resultId])

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
