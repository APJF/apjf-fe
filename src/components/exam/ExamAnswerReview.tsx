import { useState } from "react"
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Lightbulb 
} from "lucide-react"
import type { ExamResult } from "../../types/exam"

interface ExamAnswerReviewProps {
  examResult: ExamResult
  onBack: () => void
}

export function ExamAnswerReview({ examResult, onBack }: ExamAnswerReviewProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return <FileText className="h-4 w-4" />
      case "TRUE_FALSE":
        return <CheckCircle className="h-4 w-4" />
      case "WRITING":
        return <Lightbulb className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getQuestionTypeName = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "Trắc nghiệm"
      case "TRUE_FALSE":
        return "Đúng/Sai"
      case "WRITING":
        return "Tự luận"
      default:
        return "Văn bản"
    }
  }

  // Bảo vệ trường hợp examResult không có dữ liệu
  console.log("ExamAnswerReview - examResult:", examResult)
  console.log("ExamAnswerReview - examResult.answers:", examResult?.answers)
  console.log("ExamAnswerReview - examResult.answers.length:", examResult?.answers?.length)
  
  if (examResult?.answers) {
    examResult.answers.forEach((answer, index) => {
      console.log(`Answer ${index + 1}:`, {
        id: answer.id,
        questionContent: answer.questionContent,
        selectedOptionId: answer.selectedOptionId,
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        options: answer.options,
        type: answer.type
      })
    })
  }
  
  const currentAnswer = examResult?.answers?.[currentQuestion] || {
    id: "",
    questionContent: "Không thể tải nội dung câu hỏi",
    correctAnswer: "Không có dữ liệu",
    isCorrect: false,
    selectedOptionId: null,
    userAnswer: null,
    questionId: "",
    options: [],
    type: "MULTIPLE_CHOICE"
  }
  
  // Tìm option mà người dùng đã chọn
  const selectedOption = currentAnswer.options?.find(option => 
    option.id === currentAnswer.selectedOptionId
  )
  
  // Tìm option đúng
  const correctOption = currentAnswer.options?.find(option => 
    option.isCorrect
  )
  
  // Thêm các hàm trợ giúp để hiển thị tên options
  const getOptionLabel = (index: number): string => {
    return ['A', 'B', 'C', 'D', 'E', 'F'][index] || `${index + 1}`;
  }
  
  const isCorrect = currentAnswer?.isCorrect || false
  const hasAnswered = currentAnswer?.selectedOptionId !== null || currentAnswer?.userAnswer !== null
  const isMultipleChoiceQuestion = currentAnswer.type === "MULTIPLE_CHOICE"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại kết quả</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Xem đáp án chi tiết</h1>
                <p className="text-gray-600">
                  Câu {currentQuestion + 1} / {examResult.answers.length}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isCorrect ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Đúng
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  {hasAnswered ? "Sai" : "Chưa trả lời"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  {getQuestionIcon(currentAnswer.type || "MULTIPLE_CHOICE")}
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {getQuestionTypeName(currentAnswer.type || "MULTIPLE_CHOICE")}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentAnswer?.questionContent}
                </h2>

                {/* Answer Display */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-700">Các lựa chọn:</h3>
                    
                    {/* Hiển thị các thông báo về trạng thái trả lời */}
                    <div className="space-y-2 mb-4">
                      {/* Hiển thị câu trả lời của người dùng nếu đã trả lời cho câu tự luận */}
                      {hasAnswered && currentAnswer.type === "WRITING" && (
                        <div className={`p-4 rounded-lg border-2 mb-4 ${
                          isCorrect 
                            ? "border-green-500 bg-green-50" 
                            : "border-red-500 bg-red-50"
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                              <span className="font-medium text-gray-700">Bạn đã trả lời:</span>
                            </div>
                            <span className="flex-1">
                              {currentAnswer.userAnswer}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isCorrect 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {isCorrect ? "Đúng" : "Sai"}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Hiển thị thông báo chưa trả lời cho câu tự luận */}
                      {!hasAnswered && currentAnswer.type === "WRITING" && (
                        <div className="p-4 rounded-lg border-2 border-yellow-500 bg-yellow-50 mb-4">
                          <div className="flex items-center space-x-3">
                            <XCircle className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium text-gray-700">Bạn chưa trả lời câu hỏi này</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Hiển thị thông báo chưa trả lời cho câu hỏi trắc nghiệm */}
                      {!hasAnswered && currentAnswer.type === "MULTIPLE_CHOICE" && (
                        <div className="p-4 rounded-lg border-2 border-yellow-500 bg-yellow-50 mb-4">
                          <div className="flex items-center space-x-3">
                            <XCircle className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium text-gray-700">Bạn chưa trả lời câu hỏi này</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Hiển thị thông báo chưa trả lời cho câu hỏi TRUE_FALSE khi có options */}
                      {!hasAnswered && currentAnswer.type === "TRUE_FALSE" && currentAnswer.options && currentAnswer.options.length > 0 && (
                        <div className="p-4 rounded-lg border-2 border-yellow-500 bg-yellow-50 mb-4">
                          <div className="flex items-center space-x-3">
                            <XCircle className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium text-gray-700">Bạn chưa chọn đáp án Đúng/Sai</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Hiển thị tất cả options A, B, C, D nếu là câu hỏi trắc nghiệm */}
                      {currentAnswer.type === "MULTIPLE_CHOICE" && currentAnswer.options && currentAnswer.options.length > 0 && (
                        <div className="space-y-2">
                          {currentAnswer.options.map((option, index) => {
                            const optionLabel = ['A', 'B', 'C', 'D', 'E', 'F'][index] || `${index + 1}`;
                            const isSelected = option.id === currentAnswer.selectedOptionId;
                            const isCorrectOption = option.isCorrect;
                            
                            let borderClass = "border-gray-200";
                            let bgClass = "bg-white";
                            
                            if (isSelected && isCorrectOption) {
                              borderClass = "border-green-500";
                              bgClass = "bg-green-50";
                            } else if (isSelected && !isCorrectOption) {
                              borderClass = "border-red-500";
                              bgClass = "bg-red-50";
                            } else if (isCorrectOption) {
                              borderClass = "border-green-500";
                              bgClass = "bg-green-50";
                            }
                            
                            return (
                              <div 
                                key={option.id} 
                                className={`p-3 rounded-lg border ${borderClass} ${bgClass} flex items-center`}
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                  <span className="font-medium text-blue-800">{optionLabel}</span>
                                </div>
                                <div className="flex-grow">
                                  {option.content}
                                </div>
                                <div className="flex-shrink-0 ml-3">
                                  {isSelected && isCorrectOption && (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  )}
                                  {isSelected && !isCorrectOption && (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  )}
                                  {!isSelected && isCorrectOption && (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Hiển thị lựa chọn Đúng/Sai nếu là câu hỏi TRUE_FALSE */}
                      {currentAnswer.type === "TRUE_FALSE" && currentAnswer.options && currentAnswer.options.length > 0 && (
                        <div className="space-y-2">
                          {currentAnswer.options.map((option, index) => {
                            const optionLabel = ['A', 'B'][index] || `${index + 1}`;
                            const isSelected = option.id === currentAnswer.selectedOptionId;
                            const isCorrectOption = option.isCorrect;
                            
                            let borderClass = "border-gray-200";
                            let bgClass = "bg-white";
                            
                            if (isSelected && isCorrectOption) {
                              borderClass = "border-green-500";
                              bgClass = "bg-green-50";
                            } else if (isSelected && !isCorrectOption) {
                              borderClass = "border-red-500";
                              bgClass = "bg-red-50";
                            } else if (isCorrectOption) {
                              borderClass = "border-green-500";
                              bgClass = "bg-green-50";
                            }
                            
                            return (
                              <div 
                                key={option.id} 
                                className={`p-3 rounded-lg border ${borderClass} ${bgClass} flex items-center`}
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                  <span className="font-medium text-blue-800">{optionLabel}</span>
                                </div>
                                <div className="flex-grow">
                                  {option.content}
                                </div>
                                <div className="flex-shrink-0 ml-3">
                                  {isSelected && isCorrectOption && (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  )}
                                  {isSelected && !isCorrectOption && (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  )}
                                  {!isSelected && isCorrectOption && (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Hiển thị thông báo khi không có options cho câu đúng/sai */}
                      {currentAnswer.type === "TRUE_FALSE" && (!currentAnswer.options || currentAnswer.options.length === 0) && (
                        <div className="space-y-4">
                          {/* Hiển thị trạng thái câu trả lời cho câu hỏi đúng/sai */}
                          {hasAnswered ? (
                            <div className={`p-4 rounded-lg border-2 mb-2 ${
                              isCorrect 
                                ? "border-green-500 bg-green-50" 
                                : "border-red-500 bg-red-50"
                            }`}>
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  {isCorrect ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  )}
                                  <span className="font-medium text-gray-700">Bạn đã chọn:</span>
                                </div>
                                <span className="flex-1">
                                  {currentAnswer.selectedOptionId === "true" || currentAnswer.userAnswer === "true" ? "Đúng" : "Sai"}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isCorrect 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {isCorrect ? "Đúng" : "Sai"}
                                </span>
                              </div>
                            </div>
                          ) : null}
                          
                          {/* Hiển thị lựa chọn Đúng */}
                          <div className={`p-3 rounded-lg border ${currentAnswer.correctAnswer === "true" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"} flex items-center`}>
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <span className="font-medium text-blue-800">A</span>
                            </div>
                            <div className="flex-grow">
                              Đúng
                            </div>
                            <div className="flex-shrink-0 ml-3">
                              {currentAnswer.correctAnswer === "true" && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </div>
                          
                          {/* Hiển thị lựa chọn Sai */}
                          <div className={`p-3 rounded-lg border ${currentAnswer.correctAnswer === "false" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"} flex items-center`}>
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <span className="font-medium text-blue-800">B</span>
                            </div>
                            <div className="flex-grow">
                              Sai
                            </div>
                            <div className="flex-shrink-0 ml-3">
                              {currentAnswer.correctAnswer === "false" && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Hiển thị đáp án đúng cho câu hỏi tự luận */}
                      {currentAnswer.type === "WRITING" && (
                        <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <span className="font-medium text-gray-700">Đáp án đúng:</span>
                            </div>
                            <span className="flex-1">{currentAnswer.correctAnswer}</span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Đáp án chính xác
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation - We'll show a placeholder for now */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Giải thích</h3>
              </div>
              <p className="text-blue-800 leading-relaxed">
                Giải thích chi tiết sẽ được cung cấp trong phiên bản tiếp theo.
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Câu trước</span>
              </button>

              <button
                onClick={() => setCurrentQuestion(Math.min(examResult.answers.length - 1, currentQuestion + 1))}
                disabled={currentQuestion === examResult.answers.length - 1}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Câu tiếp</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Danh sách câu hỏi</h3>
              <div className="grid grid-cols-4 gap-2">
                {examResult.answers.map((answer, index) => {
                  const isCorrectAnswer = answer.isCorrect
                  const hasAnswer = answer.selectedOptionId !== null || answer.userAnswer !== null

                  let buttonClass = "";
                  if (currentQuestion === index) {
                    buttonClass = "border-blue-500 bg-blue-500 text-white";
                  } else if (isCorrectAnswer) {
                    buttonClass = "border-green-500 bg-green-50 text-green-700";
                  } else if (hasAnswer) {
                    buttonClass = "border-red-500 bg-red-50 text-red-700";
                  } else {
                    buttonClass = "border-gray-300 bg-gray-50 text-gray-500";
                  }

                  return (
                    <button
                      key={answer.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-colors ${buttonClass}`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Câu đúng:</span>
                  <span className="font-medium text-green-600">
                    {examResult.correctAnswers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Câu sai:</span>
                  <span className="font-medium text-red-600">
                    {examResult.answers.filter(answer => 
                      (answer.selectedOptionId !== null || answer.userAnswer !== null) && !answer.isCorrect
                    ).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Chưa trả lời:</span>
                  <span className="font-medium text-gray-600">
                    {examResult.answers.filter(answer => 
                      answer.selectedOptionId === null && answer.userAnswer === null
                    ).length}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Điểm số:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {examResult.score} 
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
