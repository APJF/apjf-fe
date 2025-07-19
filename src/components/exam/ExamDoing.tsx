import React, { useState, useRef, useEffect } from "react"
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  FileText,
  ImageIcon,
  Headphones,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertCircle
} from "lucide-react"
import { ExamService } from "../../services/examService"
import type { Exam, Question, SubmitExamAnswer } from "../../types/exam"

interface UserAnswer {
  questionId: string
  selectedOptionId: string | null
  userAnswer: string | null
}

interface ExamDoingProps {
  examId: string
  onSubmit: (result: unknown) => void
  onBack?: () => void
}

export function ExamDoing({ examId, onSubmit, onBack }: Readonly<ExamDoingProps>) {
  const [exam, setExam] = useState<Exam | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)

  // Get user info from localStorage
  const getUserId = (): string => {
    const userString = localStorage.getItem("user")
    if (userString) {
      try {
        const user = JSON.parse(userString)
        return user.id?.toString() || "1"
      } catch {
        return "1"
      }
    }
    return "1"
  }

  // Load exam data on component mount
  useEffect(() => {
    const loadExam = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await ExamService.getExamDetail(examId)
        
        if (!response.success) {
          throw new Error(response.message || "Không thể tải thông tin bài kiểm tra")
        }
        
        setExam(response.data)
        setTimeLeft(response.data.duration * 60) // Convert minutes to seconds
        
        // Initialize answers object
        const initialAnswers: Record<string, UserAnswer> = {}
        response.data.questions.forEach((question: Question) => {
          initialAnswers[question.id] = {
            questionId: question.id,
            selectedOptionId: null,
            userAnswer: null
          }
        })
        setAnswers(initialAnswers)
      } catch (err) {
        console.error("Error loading exam:", err)
        setError(err instanceof Error ? err.message : "Không thể tải thông tin bài kiểm tra")
      } finally {
        setIsLoading(false)
      }
    }

    if (examId) {
      loadExam()
    }
  }, [examId])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 1 && !isSubmitting) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 1 && exam && !isSubmitting) {
      // Khi còn 1 giây, tự động nộp bài
      console.log("Only 1 second left, auto-submitting exam...")
      handleSubmit()
    } else if (timeLeft === 0 && exam && !isSubmitting) {
      // Backup case nếu vì lý do gì đó timeLeft về 0
      console.log("Time's up, submitting exam...")
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSubmitting, exam])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerSelect = (optionId: string) => {
    if (!exam) return
    
    const currentQ = exam.questions[currentQuestion]
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        selectedOptionId: optionId,
        userAnswer: null
      }
    }))
  }

  const handleTextAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!exam) return
    
    const currentQ = exam.questions[currentQuestion]
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        selectedOptionId: null,
        userAnswer: e.target.value
      }
    }))
  }

  const handleAudioPlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleAudioReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const toggleFlag = () => {
    if (!exam) return
    
    const questionId = exam.questions[currentQuestion].id
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
    if (!exam) return

    try {
      setIsSubmitting(true)
      setError(null)

      // Convert answers to API format and ensure all values are set properly
      const submitAnswers: SubmitExamAnswer[] = Object.values(answers).map(answer => {
        // Chỉ cần gửi ID của option đã chọn, không cần chuyển đổi thành nội dung
        return {
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId, // Giữ nguyên ID của option đã chọn
          userAnswer: answer.userAnswer || null
        };
      });
      
      console.log('Preparing to submit answers:', submitAnswers);

      const userId = getUserId()
      console.log('User ID for submission:', userId);
      console.log('Exam ID for submission:', exam.id);
      const result = await ExamService.submitExam(exam.id, submitAnswers)
      
      // Pass the entire result data to parent
      onSubmit(result.data)
    } catch (err) {
      console.error("Error submitting exam:", err)
      
      // Xử lý hiển thị lỗi chi tiết từ API nếu có
      let errorMessage = "Không thể nộp bài kiểm tra";
      
      if (err instanceof Error) {
        // Hiển thị lỗi chi tiết nếu có từ API
        errorMessage = err.message;
        
        // Log detailed info for debugging
        console.error({
          message: "Submit exam failed",
          examId: exam.id,
          userId: getUserId(),
          answersCount: Object.keys(answers).length,
          error: err.message
        });
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  }

  const getQuestionIcon = (question: Question) => {
    if (question.fileUrl) {
      // Determine type based on file extension or content
      if (question.fileUrl.includes('.mp3') || question.fileUrl.includes('.wav')) {
        return <Headphones className="h-4 w-4" />
      } else if (question.fileUrl.includes('.png') || question.fileUrl.includes('.jpg')) {
        return <ImageIcon className="h-4 w-4" />
      } else {
        return <FileText className="h-4 w-4" />
      }
    }
    return null
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "Trắc nghiệm"
      case "TRUE_FALSE":
        return "Đúng/Sai"
      case "WRITING":
        return "Tự luận"
      default:
        return "Trắc nghiệm"
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-lg text-gray-600">Đang tải bài kiểm tra...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Có lỗi xảy ra</h2>
          <p className="text-gray-600">{error || "Không thể tải thông tin bài kiểm tra"}</p>
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
    )
  }

  const progress = ((currentQuestion + 1) / exam.questions.length) * 100
  const answeredCount = Object.keys(answers).length
  const currentQ = exam.questions[currentQuestion]

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
              <p className="text-gray-600 mt-1">{exam.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-lg font-semibold">
                <Clock className="h-5 w-5" />
                <span className={timeLeft < 300 ? "text-red-600" : "text-gray-900"}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <p className="text-sm text-gray-600">Thời gian còn lại</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">
              Câu {currentQuestion + 1} / {exam.questions.length}
            </span>
            <span className="text-sm text-gray-600">
              Đã trả lời: {answeredCount}/{exam.questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    {getQuestionIcon(currentQ)}
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {currentQ.scope}
                      </span>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {getQuestionTypeLabel(currentQ.type)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={toggleFlag}
                    className={`p-2 rounded-lg transition-colors ${
                      flaggedQuestions.has(currentQ.id) 
                        ? "text-red-600 bg-red-50" 
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mt-4">{currentQ.content}</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Media Content */}
                {currentQ.fileUrl && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    {(currentQ.fileUrl.includes('.mp3') || currentQ.fileUrl.includes('.wav')) && (
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={handleAudioPlay}
                          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                          <span>{isPlaying ? "Tạm dừng" : "Phát"}</span>
                        </button>
                        <button
                          onClick={handleAudioReset}
                          className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Phát lại</span>
                        </button>
                        <Volume2 className="h-5 w-5 text-gray-500" />
                        <audio
                          ref={audioRef}
                          src={currentQ.fileUrl}
                          onEnded={() => setIsPlaying(false)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        >
                          <track kind="captions" srcLang="vi" label="Vietnamese" />
                        </audio>
                      </div>
                    )}
                    {(currentQ.fileUrl.includes('.png') || currentQ.fileUrl.includes('.jpg')) && (
                      <div className="flex justify-center">
                        <img
                          src={currentQ.fileUrl}
                          alt="Hình ảnh câu hỏi"
                          className="max-w-full h-auto rounded-lg border shadow-sm"
                          style={{ maxHeight: "400px" }}
                        />
                      </div>
                    )}
                    {!currentQ.fileUrl.includes('.mp3') && !currentQ.fileUrl.includes('.wav') && 
                     !currentQ.fileUrl.includes('.png') && !currentQ.fileUrl.includes('.jpg') && (
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <span className="text-sm text-gray-600">Tài liệu đính kèm</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Answer Options */}
                {currentQ.type === "WRITING" ? (
                  <div className="mt-6">
                    <input
                      type="text"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập câu trả lời của bạn..."
                      value={answers[currentQ.id]?.userAnswer || ""}
                      onChange={handleTextAnswerChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {currentQ.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option.id)}
                        className={`w-full p-4 rounded-lg border text-left transition-colors ${
                          answers[currentQ.id]?.selectedOptionId === option.id
                            ? "bg-blue-100 border-blue-400"
                            : "hover:bg-blue-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                              answers[currentQ.id]?.selectedOptionId === option.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {String.fromCharCode(65 + currentQ.options.indexOf(option))}
                          </div>
                          <div>{option.content}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Câu trước</span>
              </button>

              <div className="flex space-x-2">
                {currentQuestion === exam.questions.length - 1 ? (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSubmitting ? "Đang nộp..." : "Nộp bài"}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <span>Câu tiếp</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách câu hỏi</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-5 gap-2">
                  {exam.questions.map((q, index) => {
                    let buttonClass = "border-gray-300 hover:border-gray-400"
                    if (currentQuestion === index) {
                      buttonClass = "border-blue-500 bg-blue-500 text-white"
                    } else if (answers[q.id]) {
                      buttonClass = "border-green-500 bg-green-50 text-green-700"
                    }
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestion(index)}
                        className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-colors relative ${buttonClass}`}
                      >
                        {index + 1}
                        {flaggedQuestions.has(q.id) && <Flag className="h-3 w-3 text-red-500 absolute -top-1 -right-1" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Thống kê</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Đã trả lời:</span>
                  <span className="font-medium">
                    {answeredCount}/{exam.questions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Đã đánh dấu:</span>
                  <span className="font-medium">{flaggedQuestions.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Còn lại:</span>
                  <span className="font-medium">{exam.questions.length - answeredCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Submit Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
            <div className="bg-white/90 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl backdrop-blur-md border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận nộp bài</h3>
              <p className="text-gray-600 mb-6">
                Bạn đã trả lời {answeredCount}/{exam.questions.length} câu. Bạn có chắc chắn muốn nộp bài? 
                Sau khi nộp, bạn không thể thay đổi đáp án.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 hover:shadow-md"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
