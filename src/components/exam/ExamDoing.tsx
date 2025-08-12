import { useState, useEffect } from "react"
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertCircle,
  Loader2
} from "lucide-react"
import { ExamService } from "../../services/examService"
import type { ExamStartResponse, QuestionOption } from "../../types/exam"

interface UserAnswer {
  questionId: string
  selectedOptionId: string | null
  userAnswer: string | null
}

interface ExamDoingProps {
  examId: string
  onSubmit: (result: any) => void
  onBack?: () => void
}

export function ExamDoing({ examId, onSubmit, onBack }: Readonly<ExamDoingProps>) {
  const [examData, setExamData] = useState<ExamStartResponse | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionOptions, setQuestionOptions] = useState<Record<string, QuestionOption[]>>({})

  // Load exam data when component mounts
  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Lấy dữ liệu exam từ localStorage (đã được lưu từ ExamPreparation)
        const examDataString = localStorage.getItem('currentExamData');
        if (!examDataString) {
          throw new Error('Không tìm thấy dữ liệu bài thi. Vui lòng bắt đầu lại từ trang chuẩn bị.');
        }
        
        // Lấy thời gian bắt đầu
        const examStartTime = localStorage.getItem('examStartedAt');
        setStartedAt(examStartTime);
        
        const startResponse: ExamStartResponse = JSON.parse(examDataString);
        console.log('📋 Parsed exam data:', startResponse);
        console.log('📝 Question results:', startResponse.questionResults);
        console.log('📊 Is questionResults array?', Array.isArray(startResponse.questionResults));
        console.log('⏰ Exam started at:', examStartTime);
        
        setExamData(startResponse);
        
        // Clear previous exam's question scopes from localStorage
        localStorage.removeItem('examQuestionScopes');
        
        // Lấy thông tin overview để có duration
        const examOverview = await ExamService.getExamOverview(examId);
        
        // Set timer dựa trên duration từ overview
        setTimeLeft(examOverview.duration * 60); // Convert minutes to seconds
        setStartedAt(new Date().toISOString());
        
        // Initialize answers state từ questionResults với validation
        const initialAnswers: Record<string, UserAnswer> = {};
        if (startResponse.questionResults && Array.isArray(startResponse.questionResults)) {
          startResponse.questionResults.forEach((question) => {
            initialAnswers[question.questionId] = {
              questionId: question.questionId,
              selectedOptionId: question.selectedOptionId || null,
              userAnswer: question.userAnswer || null
            };
          });
        } else {
          console.warn('⚠️ questionResults is not an array or is undefined:', startResponse.questionResults);
          // If no question results, we might need to handle this case differently
          // For now, we'll continue with empty answers
        }
        setAnswers(initialAnswers);
        
        // Load options and scope for all questions
        const updatedQuestionResults = await loadQuestionOptions(startResponse.questionResults || []);
        
        // Update examData with scope information
        setExamData({
          ...startResponse,
          questionResults: updatedQuestionResults
        });
        
        // Clear localStorage after loading
        localStorage.removeItem('currentExamData');
        
      } catch (err) {
        console.error('Error loading exam:', err);
        setError(err instanceof Error ? err.message : 'Không thể tải bài thi');
      } finally {
        setIsLoading(false);
      }
    };

    if (examId) {
      loadExam();
    }
  }, [examId]);

  // Load options and scope for all questions
  const loadQuestionOptions = async (questions: any[]) => {
    try {
      const optionsMap: Record<string, QuestionOption[]> = {};
      const updatedQuestions = [...questions]; // Create a copy to avoid mutating original
      const questionScopes: Record<string, string> = {}; // Store scopes for localStorage
      
      // Load options for each question (only for non-WRITING questions)
      for (let i = 0; i < updatedQuestions.length; i++) {
        const question = updatedQuestions[i];
        if (question.type !== 'WRITING') {
          try {
            const questionDetails = await ExamService.getQuestionDetails(question.questionId);
            optionsMap[question.questionId] = questionDetails.options;
            
            // Store scope information in the question and localStorage map
            updatedQuestions[i] = {
              ...question,
              scope: questionDetails.scope
            };
            questionScopes[question.questionId] = questionDetails.scope;
            
            console.log(`✅ Loaded ${questionDetails.options.length} options and scope (${questionDetails.scope}) for question ${question.questionId}`);
          } catch (error) {
            console.warn(`⚠️ Could not load question details for ${question.questionId}:`, error);
            // Continue with other questions even if one fails
          }
        } else {
          // For WRITING questions, we still want to get the scope
          try {
            const questionDetails = await ExamService.getQuestionDetails(question.questionId);
            updatedQuestions[i] = {
              ...question,
              scope: questionDetails.scope
            };
            questionScopes[question.questionId] = questionDetails.scope;
            
            console.log(`✅ Loaded scope (${questionDetails.scope}) for WRITING question ${question.questionId}`);
          } catch (error) {
            console.warn(`⚠️ Could not load question details for ${question.questionId}:`, error);
          }
        }
      }
      
      // Save question scopes to localStorage
      localStorage.setItem('examQuestionScopes', JSON.stringify(questionScopes));
      console.log('💾 Saved question scopes to localStorage:', questionScopes);
      
      setQuestionOptions(optionsMap);
      return updatedQuestions; // Return the updated questions array
    } catch (error) {
      console.error('❌ Error loading question options:', error);
      return questions; // Return original questions if error
    }
  };

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 1 && !isSubmitting) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 1 && examData && !isSubmitting) {
      // Auto submit when 1 second left
      console.log("Only 1 second left, auto-submitting exam...")
      handleSubmit()
    }
  }, [timeLeft, isSubmitting, examData])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerSelect = (optionId: string) => {
    if (!examData) return
    
    const currentQ = examData.questionResults[currentQuestion]
    
    setAnswers((prev) => ({
      ...prev,
      [currentQ.questionId]: {
        questionId: currentQ.questionId,
        selectedOptionId: optionId,
        userAnswer: null
      }
    }))
  }

  const toggleFlag = () => {
    if (!examData) return
    
    const questionId = examData.questionResults[currentQuestion].questionId
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const handleSubmit = async () => {
    if (!examData || !startedAt) return

    try {
      setIsSubmitting(true)
      setError(null)
      
      // Validate examData and questionResults
      if (!examData?.questionResults || !Array.isArray(examData.questionResults)) {
        throw new Error('Dữ liệu bài thi không hợp lệ')
      }
      
      // Prepare submit data for API
      const answersToSubmit = examData.questionResults.map(question => {
        const userAnswer = answers[question.questionId]
        return {
          questionId: question.questionId,
          selectedOptionId: userAnswer?.selectedOptionId || null,
          userAnswer: userAnswer?.userAnswer || null
        }
      })
      
      console.log('Submitting exam with examId:', examId, 'and answers:', answersToSubmit)
      
      // Thời gian nộp bài
      const submittedAt = new Date().toISOString();
      
      const result = await ExamService.submitExam(examId, startedAt, submittedAt, answersToSubmit)
      console.log('Exam submitted successfully:', result)
      
      // Pass the ExamSubmitResponse to parent
      onSubmit(result)
      
    } catch (err) {
      console.error('Error submitting exam:', err)
      setError(err instanceof Error ? err.message : 'Không thể nộp bài thi')
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Đang tải bài thi...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !examData) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Có lỗi xảy ra</h2>
          <p className="text-gray-600">{error || 'Không thể tải bài thi'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Quay lại
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Safety check: if no examData or questionResults, show error
  if (!examData?.questionResults || !Array.isArray(examData.questionResults) || examData.questionResults.length === 0) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Dữ liệu bài thi không hợp lệ</h2>
              <p className="text-gray-600">
                Không tìm thấy câu hỏi trong bài thi. Vui lòng bắt đầu lại từ trang chuẩn bị.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Quay lại
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Count answered questions
  const answeredCount = Object.values(answers).filter(answer => 
    answer.selectedOptionId !== null || (answer.userAnswer !== null && answer.userAnswer !== "")
  ).length
  
  const progress = (answeredCount / examData.questionResults.length) * 100
  const currentQ = examData.questionResults[currentQuestion]

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{examData.examTitle}</h1>
              <p className="text-gray-600">Câu hỏi {currentQuestion + 1} / {examData.questionResults.length}</p>
            </div>
            
            {/* Timer */}
            <div className="flex items-center gap-2 text-red-600 font-mono text-lg">
              <Clock className="h-5 w-5" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Đã trả lời: {answeredCount}/{examData.questionResults.length}</span>
            <span>{Math.round(progress)}% hoàn thành</span>
          </div>
        </div>

        {/* Question Content */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-1">
              <div 
                className="text-lg text-gray-900 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: currentQ.questionContent }}
              />
            </div>
            <button
              onClick={toggleFlag}
              className={`p-2 rounded-lg transition-colors ${
                flaggedQuestions.has(currentQ.questionId)
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-400 hover:text-gray-600'
              }`}
              title={flaggedQuestions.has(currentQ.questionId) ? 'Bỏ đánh dấu' : 'Đánh dấu câu hỏi'}
            >
              <Flag className="h-4 w-4" />
            </button>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {/* Multiple choice options - only for non-WRITING questions */}
            {currentQ.type !== 'WRITING' && questionOptions[currentQ.questionId] && questionOptions[currentQ.questionId].length > 0 && (
              <div className="space-y-3">
                {questionOptions[currentQ.questionId].map((option) => {
                  const isSelected = answers[currentQ.questionId]?.selectedOptionId === option.optionId;
                  
                  return (
                    <label 
                      key={option.optionId}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg hover:border-blue-300 transition-colors cursor-pointer ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question_${currentQ.questionId}`}
                        value={option.optionId}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(option.optionId)}
                        className="text-blue-600"
                      />
                      <span className="text-gray-900">{option.content}</span>
                    </label>
                  );
                })}
              </div>
            )}
            
            {/* Fallback for multiple choice without options data */}
            {currentQ.type !== 'WRITING' && (!questionOptions[currentQ.questionId] || questionOptions[currentQ.questionId].length === 0) && (
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((optionLabel, idx) => {
                  const optionId = `${currentQ.questionId}-${idx + 1}`;
                  const isSelected = answers[currentQ.questionId]?.selectedOptionId === optionId;
                  
                  return (
                    <label 
                      key={optionId}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg hover:border-blue-300 transition-colors cursor-pointer ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question_${currentQ.questionId}`}
                        value={optionId}
                        checked={isSelected}
                        onChange={() => handleAnswerSelect(optionId)}
                        className="text-blue-600"
                      />
                      <span className="text-gray-900">{optionLabel}. Đáp án {optionLabel}</span>
                    </label>
                  );
                })}
              </div>
            )}
              
            {/* Text input for WRITING questions only */}
            {currentQ.type === 'WRITING' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label htmlFor={`answer_${currentQ.questionId}`} className="block text-sm font-medium text-gray-700 mb-3">
                  Nhập câu trả lời của bạn:
                </label>
                <textarea
                  id={`answer_${currentQ.questionId}`}
                  value={answers[currentQ.questionId]?.userAnswer || ""}
                  onChange={(e) => {
                    if (!examData) return;
                    const currentQ = examData.questionResults[currentQuestion];
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQ.questionId]: {
                        questionId: currentQ.questionId,
                        selectedOptionId: null,
                        userAnswer: e.target.value
                      }
                    }));
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
                  placeholder="Nhập câu trả lời của bạn..."
                  rows={6}
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Câu trước
            </button>

            {currentQuestion === examData.questionResults.length - 1 ? (
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang nộp...
                  </>
                ) : (
                  "Nộp bài"
                )}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(Math.min(examData.questionResults.length - 1, currentQuestion + 1))}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Câu tiếp
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Progress summary */}
          <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
            <span>Đánh dấu: <span className="font-semibold text-amber-600">{flaggedQuestions.size}</span></span>
          </div>

          {/* Question navigation grid - supports large number of questions */}
          <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className={`grid gap-2 ${(() => {
              if (examData.questionResults.length > 50) return 'grid-cols-10';
              if (examData.questionResults.length > 30) return 'grid-cols-8';
              return 'grid-cols-6';
            })()}`}>
              {examData.questionResults.map((question, index) => {
                const isAnswered = Object.values(answers).some(a => 
                  a.questionId === question.questionId && (a.selectedOptionId || (a.userAnswer && a.userAnswer.trim() !== ''))
                );
                const isCurrent = index === currentQuestion;
                const isFlagged = flaggedQuestions.has(question.questionId);
                
                let buttonClass = `w-8 h-8 md:w-10 md:h-10 rounded-lg font-medium text-xs md:text-sm transition-all duration-200 hover:scale-105 `;
                
                if (isCurrent) {
                  buttonClass += 'bg-blue-600 text-white ring-2 ring-blue-300';
                } else if (isFlagged) {
                  buttonClass += isAnswered 
                    ? 'bg-red-500 text-white' 
                    : 'bg-red-100 text-red-700 border-2 border-red-300';
                } else if (isAnswered) {
                  buttonClass += 'bg-green-100 text-green-800 border-2 border-green-300';
                } else {
                  buttonClass += 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300';
                }
                
                return (
                  <button
                    key={question.questionId}
                    onClick={() => setCurrentQuestion(index)}
                    className={buttonClass}
                    title={`Câu ${index + 1}${isFlagged ? ' (Đã đánh dấu)' : ''}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>Hiện tại</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
              <span>Đánh dấu</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Chưa làm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận nộp bài</h3>
              <div className="text-gray-600 mb-6 space-y-2">
                <p>
                  Bạn đã hoàn thành <span className="font-semibold text-blue-600">{answeredCount}</span> / <span className="font-semibold">{examData.questionResults.length}</span> câu hỏi.
                </p>
                <p>
                  Bạn có chắc chắn muốn nộp bài không? Sau khi nộp bài, bạn sẽ không thể thay đổi câu trả lời.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
