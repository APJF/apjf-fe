import { useState, useRef, useEffect } from "react"
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  MessageCircle,
  Send,
  Minimize2,
  Bot,
  AlertTriangle
} from "lucide-react"
import type { ExamResult, ExamResultAnswer } from "../../types/exam"

interface ExamAnswerReviewProps {
  readonly examResult: ExamResult
  readonly onBack: () => void
}

// Helper functions
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

// Demo function to generate 60 questions for testing
// @ts-ignore - Demo function for testing
const generateDemoData = (examResult: ExamResult): ExamResult => {
  const types = ["MULTIPLE_CHOICE", "TRUE_FALSE", "WRITING"]
  const demoAnswers = []
  
  for (let i = 0; i < 60; i++) {
    const type = types[i % 3] as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "WRITING"
    const isCorrect = Math.random() > 0.3 // 70% correct rate
    const hasAnswer = Math.random() > 0.1 // 90% answer rate
    
    let selectedOptionId = null
    let correctAnswer = null
    let options = undefined
    
    if (hasAnswer) {
      selectedOptionId = isCorrect ? "correct-option" : "wrong-option"
    }
    
    if (type === "WRITING") {
      correctAnswer = "Đáp án đúng"
    } else if (type === "TRUE_FALSE") {
      correctAnswer = "true"
    } else {
      correctAnswer = "Đáp án A"
    }
    
    if (type === "MULTIPLE_CHOICE") {
      options = [
        { id: "opt1", content: "Đáp án A", isCorrect: true },
        { id: "opt2", content: "Đáp án B", isCorrect: false },
        { id: "opt3", content: "Đáp án C", isCorrect: false },
        { id: "opt4", content: "Đáp án D", isCorrect: false },
      ]
    } else if (type === "TRUE_FALSE") {
      options = [
        { id: "true", content: "Đúng", isCorrect: true },
        { id: "false", content: "Sai", isCorrect: false },
      ]
    }
    
    demoAnswers.push({
      id: `demo-${i}`,
      questionId: `q-${i}`,
      questionContent: `Câu hỏi số ${i + 1}: Đây là một câu hỏi mẫu để test hiển thị với nhiều câu hỏi?`,
      type,
      isCorrect: hasAnswer ? isCorrect : false,
      selectedOptionId,
      userAnswer: type === "WRITING" && hasAnswer ? "Đáp án của học sinh" : null,
      correctAnswer,
      explanation: `Giải thích cho câu ${i + 1}: Đây là lý do tại sao đáp án này đúng.`,
      options
    })
  }
  
  return {
    ...examResult,
    answers: demoAnswers,
    correctAnswers: demoAnswers.filter(a => a.isCorrect).length,
    score: Math.round((demoAnswers.filter(a => a.isCorrect).length / 60) * 100)
  }
}

const getOptionStyles = (isSelected: boolean, isCorrectOption: boolean) => {
  if (isSelected && isCorrectOption) {
    return { borderClass: "border-green-500", bgClass: "bg-green-50" }
  } else if (isSelected && !isCorrectOption) {
    return { borderClass: "border-red-500", bgClass: "bg-red-50" }
  } else if (isCorrectOption) {
    return { borderClass: "border-green-500", bgClass: "bg-green-50" }
  }
  return { borderClass: "border-gray-200", bgClass: "bg-white" }
}

// Component for rendering answer status message
const AnswerStatusMessage = ({
  hasAnswered,
  isCorrect,
  currentAnswer,
}: {
  hasAnswered: boolean
  isCorrect: boolean
  currentAnswer: ExamResultAnswer
}) => {
  if (hasAnswered && currentAnswer.type === "WRITING") {
    return (
      <div
        className={`p-3 rounded-lg border mb-2 ${
          isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {isCorrect ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="font-medium text-gray-700 text-sm">Bạn đã trả lời:</span>
          </div>
          <span className="flex-1 text-sm">{currentAnswer.userAnswer}</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {isCorrect ? "Đúng" : "Sai"}
          </span>
        </div>
      </div>
    )
  }

  return null
}

// Component for unanswered question warning
const UnansweredWarning = ({ currentAnswer }: { currentAnswer: ExamResultAnswer }) => {
  const hasAnswered = currentAnswer?.selectedOptionId !== null || currentAnswer?.userAnswer !== null

  if (hasAnswered) return null

  const messageMap = {
    WRITING: "Bạn chưa trả lời câu hỏi này",
    MULTIPLE_CHOICE: "Bạn chưa chọn đáp án nào",
    TRUE_FALSE: "Bạn chưa chọn đáp án Đúng/Sai",
  }

  return (
    <div className="p-3 rounded-lg border-2 border-amber-400 bg-amber-50 mb-4">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <span className="font-medium text-amber-800 text-sm">
          {messageMap[currentAnswer.type as keyof typeof messageMap] || messageMap.MULTIPLE_CHOICE}
        </span>
      </div>
    </div>
  )
}

// Component for rendering multiple choice options
const MultipleChoiceOptions = ({ currentAnswer }: { currentAnswer: ExamResultAnswer }) => {
  if (currentAnswer.type !== "MULTIPLE_CHOICE" || !currentAnswer.options?.length) {
    return null
  }

  return (
    <div className="space-y-2">
      {currentAnswer.options.map((option, index: number) => {
        const optionLabel = ["A", "B", "C", "D", "E", "F"][index] || `${index + 1}`
        const isSelected = option.id === currentAnswer.selectedOptionId
        const isCorrectOption = option.isCorrect
        const { borderClass, bgClass } = getOptionStyles(isSelected, isCorrectOption)

        return (
          <div
            key={option.id}
            className={`p-3 rounded-lg border-2 ${borderClass} ${bgClass} flex items-center text-sm transition-all duration-200`}
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center mr-3">
              <span className="font-bold text-white text-xs">{optionLabel}</span>
            </div>
            <div className="flex-grow font-medium">{option.content}</div>
            <div className="flex-shrink-0 ml-3">
              {isSelected && isCorrectOption && <CheckCircle className="h-5 w-5 text-green-600" />}
              {isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-red-600" />}
              {!isSelected && isCorrectOption && <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Component for rendering true/false options
const TrueFalseOptions = ({
  currentAnswer,
  hasAnswered,
  isCorrect,
}: {
  currentAnswer: ExamResultAnswer
  hasAnswered: boolean
  isCorrect: boolean
}) => {
  if (currentAnswer.type !== "TRUE_FALSE") {
    return null
  }

  if (currentAnswer.options && currentAnswer.options.length > 0) {
    return (
      <div className="space-y-2">
        {currentAnswer.options.map((option, index: number) => {
          const optionLabel = ["A", "B"][index] || `${index + 1}`
          const isSelected = option.id === currentAnswer.selectedOptionId
          const isCorrectOption = option.isCorrect
          const { borderClass, bgClass } = getOptionStyles(isSelected, isCorrectOption)

          return (
            <div
              key={option.id}
              className={`p-3 rounded-lg border-2 ${borderClass} ${bgClass} flex items-center text-sm transition-all duration-200`}
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center mr-3">
                <span className="font-bold text-white text-xs">{optionLabel}</span>
              </div>
              <div className="flex-grow font-medium">{option.content}</div>
              <div className="flex-shrink-0 ml-3">
                {isSelected && isCorrectOption && <CheckCircle className="h-5 w-5 text-green-600" />}
                {isSelected && !isCorrectOption && <XCircle className="h-5 w-5 text-red-600" />}
                {!isSelected && isCorrectOption && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Handle true/false without options
  return (
    <div className="space-y-2">
      {hasAnswered && (
        <div
          className={`p-3 rounded-lg border-2 mb-3 ${
            isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium text-gray-700 text-sm">Bạn đã chọn:</span>
            </div>
            <span className="flex-1 text-sm font-medium">
              {currentAnswer.selectedOptionId === "true" || currentAnswer.userAnswer === "true" ? "Đúng" : "Sai"}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {isCorrect ? "Đúng" : "Sai"}
            </span>
          </div>
        </div>
      )}
      {/* True option */}
      <div
        className={`p-3 rounded-lg border-2 ${
          currentAnswer.correctAnswer === "true" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
        } flex items-center text-sm transition-all duration-200`}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center mr-3">
          <span className="font-bold text-white text-xs">A</span>
        </div>
        <div className="flex-grow font-medium">Đúng</div>
        <div className="flex-shrink-0 ml-3">
          {currentAnswer.correctAnswer === "true" && <CheckCircle className="h-5 w-5 text-green-600" />}
        </div>
      </div>
      {/* False option */}
      <div
        className={`p-3 rounded-lg border-2 ${
          currentAnswer.correctAnswer === "false" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
        } flex items-center text-sm transition-all duration-200`}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center mr-3">
          <span className="font-bold text-white text-xs">B</span>
        </div>
        <div className="flex-grow font-medium">Sai</div>
        <div className="flex-shrink-0 ml-3">
          {currentAnswer.correctAnswer === "false" && <CheckCircle className="h-5 w-5 text-green-600" />}
        </div>
      </div>
    </div>
  )
}

// Component for rendering writing question correct answer
const WritingCorrectAnswer = ({ currentAnswer }: { currentAnswer: ExamResultAnswer }) => {
  if (currentAnswer.type !== "WRITING") {
    return null
  }

  return (
    <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-bold text-green-700 text-sm">Đáp án đúng:</span>
        </div>
        <span className="flex-1 text-sm font-medium">{currentAnswer.correctAnswer}</span>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-200 text-green-800">Đáp án chính xác</span>
      </div>
    </div>
  )
}

export function ExamAnswerReview({ examResult, onBack }: ExamAnswerReviewProps) {
  // ============ DEMO DATA FOR TESTING WITH 60 QUESTIONS ============
  // To test with 60 questions, uncomment the next 2 lines and comment out the last line:
  // const demoExamResult = generateDemoData(examResult)
  // const displayExamResult = demoExamResult
  
  // For production, use real data:
  const displayExamResult = examResult
  // ================================================================
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'user' | 'ai', content: string, timestamp: Date}>>([
    {
      id: "1",
      type: "ai",
      content: "Chào bạn! Tôi là AI trợ giáo. Bạn có thể hỏi tôi về bất kỳ câu hỏi nào trong bài thi này. Tôi sẽ giúp bạn hiểu rõ hơn về các đáp án và cách giải.",
      timestamp: new Date(),
    },
  ])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const questionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    questionRefs.current = questionRefs.current.slice(0, displayExamResult?.answers?.length || 0)
  }, [displayExamResult?.answers?.length])
  
  // Validation: Ensure we have valid data
  if (!displayExamResult?.answers?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center font-inter">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Không có dữ liệu câu trả lời</h2>
          <p className="text-gray-600">Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }
  
  const scrollToQuestion = (index: number) => {
    if (questionRefs.current[index]) {
      questionRefs.current[index]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: currentMessage.trim(),
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: `Cảm ơn bạn đã hỏi: "${userMessage.content}". Tôi sẽ giúp bạn hiểu rõ hơn về câu hỏi này. Bạn có thể hỏi về bất kỳ câu hỏi cụ thể nào trong bài thi.`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-inter">
      <div className="flex min-h-screen">
        {/* Left Sidebar - Question Navigator & Statistics */}
        <div className="w-80 bg-white shadow-xl border-r border-gray-200 flex flex-col sticky top-16 h-screen overflow-y-auto">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-gray-100">
            <button
              onClick={onBack}
              className="group flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 w-full font-medium"
            >
              <div className="p-1 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span>Quay lại</span>
            </button>
          </div>

          {/* Question Navigator */}
          <div className="flex-shrink-0 border-b border-gray-100">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700">
              <h3 className="text-base font-bold text-white tracking-wide">DANH SÁCH CÂU HỎI</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                {displayExamResult.answers.map((answer, index) => {
                  const isCorrectAnswer = answer.isCorrect
                  const hasAnswer = answer.selectedOptionId !== null || answer.userAnswer !== null
                  let buttonClass = ""
                  if (isCorrectAnswer) {
                    buttonClass = "border-green-500 bg-green-100 text-green-700 hover:bg-green-200 shadow-green-200"
                  } else if (hasAnswer) {
                    buttonClass = "border-red-500 bg-red-100 text-red-700 hover:bg-red-200 shadow-red-200"
                  } else {
                    buttonClass = "border-amber-400 bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-amber-200"
                  }

                  return (
                    <button
                      key={answer.id}
                      onClick={() => scrollToQuestion(index)}
                      className={`w-8 h-8 rounded-lg border-2 text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 ${buttonClass}`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex-1">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600">
              <h3 className="text-base font-bold text-white tracking-wide">THỐNG KÊ</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700 font-bold">Câu đúng</span>
                    <span className="font-black text-green-800 text-2xl">{displayExamResult.correctAnswers}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-700 font-bold">Câu sai</span>
                    <span className="font-black text-red-800 text-2xl">
                      {displayExamResult.answers.filter(answer => 
                        (answer.selectedOptionId !== null || answer.userAnswer !== null) && !answer.isCorrect
                      ).length}
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-amber-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-700 font-bold">Chưa trả lời</span>
                    <span className="font-black text-amber-800 text-2xl">
                      {displayExamResult.answers.filter(answer => 
                        answer.selectedOptionId === null && answer.userAnswer === null
                      ).length}
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-700 font-bold">Điểm số</span>
                    <span className="font-black text-blue-800 text-3xl">{displayExamResult.score}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content - Questions Detail */}
        <div className="flex-1">
          <div className="p-8">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Xem đáp án chi tiết</h1>
                <p className="text-gray-600 font-medium">Tổng cộng {displayExamResult.answers.length} câu hỏi</p>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6 pb-8">
              {displayExamResult.answers.map((currentAnswer, index) => {
                const isCorrect = currentAnswer?.isCorrect || false
                const hasAnswered = currentAnswer?.selectedOptionId !== null || currentAnswer?.userAnswer !== null

                return (
                  <div
                    key={currentAnswer.id || index}
                    ref={(el) => {
                      questionRefs.current[index] = el
                    }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300"
                    id={`question-${index}`}
                  >
                    <div className="space-y-4">
                      {/* Question Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <span className="font-black text-white text-sm">{index + 1}</span>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            {getQuestionTypeName(currentAnswer.type || "MULTIPLE_CHOICE")}
                          </span>
                        </div>
                        <div className="text-right">
                          {isCorrect ? (
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-100 text-green-800 border-2 border-green-300">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Đúng
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-red-100 text-red-800 border-2 border-red-300">
                              <XCircle className="h-4 w-4 mr-2" />
                              {hasAnswered ? "Sai" : "Chưa trả lời"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Content */}
                      <h3 className="text-lg font-bold text-gray-900 leading-relaxed">
                        {currentAnswer?.questionContent}
                      </h3>

                      {/* Unanswered Warning */}
                      <UnansweredWarning currentAnswer={currentAnswer} />

                      {/* Answer Display */}
                      <div className="space-y-3">
                        <AnswerStatusMessage
                          hasAnswered={hasAnswered}
                          isCorrect={isCorrect}
                          currentAnswer={currentAnswer}
                        />
                        <MultipleChoiceOptions currentAnswer={currentAnswer} />
                        <TrueFalseOptions
                          currentAnswer={currentAnswer}
                          hasAnswered={hasAnswered}
                          isCorrect={isCorrect}
                        />
                        <WritingCorrectAnswer currentAnswer={currentAnswer} />
                      </div>

                      {/* Explanation */}
                      {currentAnswer.explanation && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                          <div className="flex items-center space-x-2 mb-3">
                            <Lightbulb className="h-5 w-5 text-blue-600" />
                            <h4 className="text-sm font-bold text-blue-900">GIẢI THÍCH</h4>
                          </div>
                          <p className="text-blue-800 text-sm leading-relaxed font-medium">
                            {currentAnswer.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Chat (Full Height) */}
        <div className="w-150 bg-white shadow-xl border-l border-gray-200 flex flex-col sticky top-16 h-screen overflow-y-auto">
          {/* Chat Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-white/20">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-white tracking-wide">CHAT VỚI AI</span>
              </div>
              <button
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                {isChatMinimized ? (
                  <MessageCircle className="h-5 w-5 text-white" />
                ) : (
                  <Minimize2 className="h-5 w-5 text-white" />
                )}
              </button>
            </div>
          </div>

          {!isChatMinimized ? (
            <>
              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto min-h-0">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-sm p-4 rounded-2xl text-sm font-medium shadow-lg ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md"
                            : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 rounded-bl-md border border-gray-300"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-sm p-4 rounded-2xl text-sm bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 shadow-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex-shrink-0 p-6 pb-20 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder="Hỏi AI về câu hỏi..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium shadow-sm"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !currentMessage.trim()}
                    className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center text-gray-500">
                <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-base font-bold mb-1">Chat đã được thu gọn</p>
                <p className="text-sm">Click để mở rộng</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
