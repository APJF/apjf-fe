import { useState, useRef, useEffect } from "react"
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  FileText,
  Target
} from "lucide-react"
import type { ExamResult, QuestionResult } from "../../types/exam"

interface QuestionDetail {
  id: string;
  content: string;
  scope: string;
  type: string;
  explanation: string;
  options: Array<{
    id: string;
    content: string;
    isCorrect: boolean;
  }>;
}

interface ExamAnswerReviewProps {
  examResult: ExamResult
  onBack: () => void
}

/**
 * ExamAnswerReview Component - Hiển thị chi tiết câu trả lời theo API mới
 * Sử dụng questionResults từ ExamResult để hiển thị câu hỏi và đáp án
 */
export function ExamAnswerReview({ examResult, onBack }: Readonly<ExamAnswerReviewProps>) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const [questionDetails, setQuestionDetails] = useState<Record<string, QuestionDetail>>({})
  const [loadingQuestionDetails, setLoadingQuestionDetails] = useState<Set<string>>(new Set())
  const [currentMessage, setCurrentMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    type: 'user' | 'ai'
    content: string
    timestamp: Date
  }>>([
    {
      id: "1",
      type: "ai",
      content: "Chào bạn! Tôi là AI trợ giáo. Bạn có thể hỏi tôi về bất kỳ câu hỏi nào trong bài thi này. Tôi sẽ giúp bạn hiểu rõ hơn về các đáp án và cách giải.",
      timestamp: new Date(),
    },
  ])

  const questionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    questionRefs.current = questionRefs.current.slice(0, examResult.questionResults.length)
  }, [examResult.questionResults.length])

  // Load question details when component mounts or question changes
  useEffect(() => {
    const loadQuestionDetail = async (questionId: string) => {
      if (questionDetails[questionId] || loadingQuestionDetails.has(questionId)) {
        return; // Already loaded or loading
      }

      setLoadingQuestionDetails(prev => new Set([...prev, questionId]));
      
      try {
        const response = await fetch(`http://localhost:8080/api/questions/${questionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch question details');
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          setQuestionDetails(prev => ({
            ...prev,
            [questionId]: data.data
          }));
        }
      } catch (error) {
        console.error('Error loading question details:', error);
      } finally {
        setLoadingQuestionDetails(prev => {
          const newSet = new Set(prev);
          newSet.delete(questionId);
          return newSet;
        });
      }
    };

    // Load current question details
    const currentQuestion = examResult.questionResults[currentQuestionIndex];
    if (currentQuestion) {
      loadQuestionDetail(currentQuestion.questionId);
    }
  }, [currentQuestionIndex, examResult.questionResults, questionDetails, loadingQuestionDetails]);

  const scrollToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
    questionRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: currentMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage('')

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: `Tôi hiểu bạn đang hỏi về: "${currentMessage}". Đây là một câu hỏi hay! Hãy để tôi giải thích chi tiết...`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  // Phân tích dữ liệu
  const totalQuestions = examResult.questionResults.length
  const correctAnswers = examResult.questionResults.filter(q => q.isCorrect).length
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  if (!examResult.questionResults?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Không có dữ liệu câu trả lời</h2>
          <p className="text-gray-600">Không tìm thấy chi tiết câu trả lời cho bài thi này.</p>
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

  const currentQuestion = examResult.questionResults[currentQuestionIndex]

  // Helper function để xác định loại câu hỏi
  const getQuestionType = (question: QuestionResult) => {
    if (question.selectedOptionId !== null) return 'MULTIPLE_CHOICE'
    if (question.userAnswer !== null) return 'ESSAY'
    return 'UNKNOWN'
  }

  // Helper function để render câu trả lời chưa được làm
  const renderUnansweredQuestion = () => {
    const currentQuestionDetail = questionDetails[currentQuestion.questionId];
    
    return (
      <div className="space-y-6">
        {/* Thông báo chưa trả lời */}
        <div className="p-4 border-2 border-amber-200 bg-amber-50 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="font-medium text-amber-800">Chưa trả lời</span>
          </div>
          <p className="text-amber-700 mt-1">Bạn đã không trả lời câu hỏi này.</p>
        </div>

        {/* Hiển thị tất cả các options */}
        {currentQuestionDetail?.options && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Tất cả các đáp án:</h4>
            <div className="space-y-2">
              {currentQuestionDetail.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                const isCorrect = option.isCorrect;
                
                let optionClass = "p-4 border-2 rounded-lg flex items-center gap-3 ";
                if (isCorrect) {
                  optionClass += "border-green-500 bg-green-50 ";
                } else {
                  optionClass += "border-gray-200 bg-gray-50 ";
                }
                
                return (
                  <div key={option.id} className={optionClass}>
                    <div className="flex items-center gap-2">
                      {isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                      <span className="font-medium text-gray-700">
                        {optionLabel}.
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-900">{option.content}</span>
                      <div className="flex gap-2 mt-1">
                        {isCorrect && (
                          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function để render câu trả lời trắc nghiệm
  const renderMultipleChoiceAnswer = (question: QuestionResult) => {
    const currentQuestionDetail = questionDetails[question.questionId];
    
    return (
      <div className="space-y-6">
        {/* Tất cả các options */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Tất cả các đáp án:</h4>
          <div className="space-y-2">
            {currentQuestionDetail?.options?.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = question.selectedOptionId === option.id;
              const isCorrect = option.isCorrect;
              
              let optionClass = "p-4 border-2 rounded-lg flex items-center gap-3 ";
              if (isCorrect) {
                optionClass += "border-green-500 bg-green-50 ";
              } else if (isSelected) {
                optionClass += "border-red-500 bg-red-50 ";
              } else {
                optionClass += "border-gray-200 bg-gray-50 ";
              }
              
              return (
                <div key={option.id} className={optionClass}>
                  <div className="flex items-center gap-2">
                    {isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                    <span className="font-medium text-gray-700">
                      {optionLabel}.
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-900">{option.content}</span>
                    <div className="flex gap-2 mt-1">
                      {isCorrect && (
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                          Đáp án đúng
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                          Bạn đã chọn
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Kết quả của bạn */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Kết quả của bạn:</h4>
          <div className={`p-4 border-2 rounded-lg ${
            question.isCorrect 
              ? 'border-green-500 bg-green-50' 
              : 'border-red-500 bg-red-50'
          }`}>
            <div className="flex items-center gap-2">
              {question.isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                question.isCorrect ? 'text-green-800' : 'text-red-800'
              }`}>
                {question.isCorrect ? 'Chính xác!' : 'Chưa chính xác'} 
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Helper function để render câu trả lời tự luận
  const renderEssayAnswer = (question: QuestionResult) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900">Câu trả lời của bạn:</h4>
      <div className={`p-4 border-2 rounded-lg ${
        question.isCorrect 
          ? 'border-green-500 bg-green-50' 
          : 'border-red-500 bg-red-50'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {question.isCorrect ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={`font-medium ${
            question.isCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {question.isCorrect ? 'Đúng' : 'Sai'}
          </span>
        </div>
        <p className="text-gray-700 bg-white p-3 rounded border">
          {question.userAnswer}
        </p>
      </div>
    </div>
  )

  // Helper function để render câu trả lời
  const renderAnswer = (question: QuestionResult) => {
    const type = getQuestionType(question)
    const hasAnswered = question.selectedOptionId !== null || question.userAnswer !== null

    if (!hasAnswered) {
      return renderUnansweredQuestion()
    }

    if (type === 'MULTIPLE_CHOICE' && question.selectedOptionId) {
      return renderMultipleChoiceAnswer(question)
    }

    if (type === 'ESSAY' && question.userAnswer) {
      return renderEssayAnswer(question)
    }

    return null
  }

  // Helper function để lấy icon trạng thái
  const getStatusIcon = (question: QuestionResult) => {
    if (question.isCorrect) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    
    if (question.selectedOptionId || question.userAnswer) {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
    
    return <AlertCircle className="h-4 w-4 text-amber-600" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Quay lại
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{examResult.examTitle}</h1>
                <p className="text-gray-600">Chi tiết câu trả lời</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {examResult.score.toFixed(1)} điểm
                </div>
                <div className="text-sm text-gray-600">
                  {correctAnswers}/{totalQuestions} câu đúng ({percentage}%)
                </div>
              </div>
              
              <button
                onClick={() => setShowChat(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Hỏi AI
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 flex gap-6">
        {/* Question List Sidebar */}
        <div className="w-80 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Danh sách câu hỏi</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {examResult.questionResults.map((question, index) => {
                const statusIcon = getStatusIcon(question)
                return (
                  <button
                    key={question.questionId}
                    onClick={() => scrollToQuestion(index)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      index === currentQuestionIndex
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Câu {index + 1}</span>
                      <div className="flex items-center gap-1">
                        {statusIcon}
                        {getQuestionType(question) === 'MULTIPLE_CHOICE' ? (
                          <Target className="h-3 w-3 text-gray-400" />
                        ) : (
                          <FileText className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm">
            {/* Question Content */}
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Câu hỏi {currentQuestionIndex + 1}/{totalQuestions}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getQuestionType(currentQuestion) === 'MULTIPLE_CHOICE'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {getQuestionType(currentQuestion) === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 'Tự luận'}
                  </span>
                </div>
                
                <div 
                  className="text-lg text-gray-900 leading-relaxed mb-6"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.questionContent }}
                />
              </div>

              {/* User Answer */}
              <div className="mb-6">
                {renderAnswer(currentQuestion)}
              </div>

              {/* Explanation - always show */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Giải thích:</h4>
                <p className="text-blue-800 leading-relaxed">
                  {(() => {
                    const explanation = questionDetails[currentQuestion.questionId]?.explanation || currentQuestion.explanation;
                    if (!explanation || explanation.trim() === '') {
                      return 'Chưa có giải thích cho câu hỏi này.';
                    }
                    return explanation;
                  })()}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="border-t px-8 py-4 flex items-center justify-between">
              <button
                onClick={() => scrollToQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Câu trước
              </button>

              <span className="text-sm text-gray-600">
                {currentQuestionIndex + 1} / {totalQuestions}
              </span>

              <button
                onClick={() => scrollToQuestion(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === totalQuestions - 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Câu sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-xl shadow-xl transition-all ${
            isChatMinimized ? 'w-80 h-16' : 'w-full max-w-2xl h-96'
          }`}>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">AI Trợ giáo</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsChatMinimized(!isChatMinimized)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {isChatMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isChatMinimized && (
              <>
                {/* Chat Messages */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto h-64">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Hỏi về câu hỏi này..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
