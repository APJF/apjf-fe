import React, { useState, useEffect } from "react"
import {
  Clock,
  FileText,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  Volume2,
  ImageIcon,
  BookOpen,
  Play,
  Loader2,
  ArrowLeft
} from "lucide-react"
import { examService } from "../../services/examService"
import type { Exam, Question } from "../../types/exam"

interface QuestionTypeInfo {
  icon: React.ElementType
  title: string
  description: string
  color: string
}

interface TechnicalRequirement {
  icon: React.ElementType
  title: string
  description: string
  bgColor: string
  iconColor: string
}

interface ExamPreparationProps {
  examId: string
  onStart: () => void
  onBack?: () => void
}

export function ExamPreparation({ examId, onStart, onBack }: Readonly<ExamPreparationProps>) {
  const [exam, setExam] = useState<Exam | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user is authenticated
  const isAuthenticated = (): boolean => {
    const token = localStorage.getItem("token")
    return !!token
  }

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
        const examData = await examService.getExamById(examId)
        setExam(examData)
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

  // Get difficulty based on exam scope type
  const getDifficulty = (examScopeType: string): "Dễ" | "Trung bình" | "Khó" => {
    switch (examScopeType?.toUpperCase()) {
      case "BEGINNER":
      case "BASIC":
        return "Dễ"
      case "INTERMEDIATE":
      case "COURSE":
        return "Trung bình"
      case "ADVANCED":
        return "Khó"
      default:
        return "Trung bình"
    }
  }

  // Get JLPT level based on exam scope or default
  const getJLPTLevel = (examScopeType: string): "N1" | "N2" | "N3" | "N4" | "N5" => {
    // This is a placeholder - you might want to add jlptLevel to your API
    switch (examScopeType?.toUpperCase()) {
      case "ADVANCED":
        return "N1"
      case "INTERMEDIATE":
        return "N3"
      case "BASIC":
      case "BEGINNER":
        return "N5"
      default:
        return "N5"
    }
  }

  // Get difficulty color for badge
  const getDifficultyColor = (level: "Dễ" | "Trung bình" | "Khó") => {
    switch (level) {
      case "Dễ":
        return "bg-green-100 text-green-800"
      case "Trung bình":
        return "bg-yellow-100 text-yellow-800"
      case "Khó":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get question types from exam data
  const getQuestionTypes = (questions: Question[]): QuestionTypeInfo[] => {
    const types = new Set<string>()
    questions.forEach(q => types.add(q.type))

    const typeMap: Record<string, QuestionTypeInfo> = {
      MULTIPLE_CHOICE: {
        icon: FileText,
        title: "Trắc nghiệm",
        description: "Chọn một đáp án đúng",
        color: "text-blue-600",
      },
      TRUE_FALSE: {
        icon: CheckCircle,
        title: "Đúng/Sai",
        description: "Phán đoán câu đúng hay sai",
        color: "text-green-600",
      },
      WRITING: {
        icon: BookOpen,
        title: "Tự luận",
        description: "Viết câu trả lời của bạn",
        color: "text-orange-600",
      },
    }

    return Array.from(types).map(type => typeMap[type]).filter(Boolean)
  }

  // Default technical requirements
  const technicalRequirements: TechnicalRequirement[] = [
    {
      icon: Volume2,
      title: "Âm thanh",
      description: "Cần có loa hoặc tai nghe",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      icon: ImageIcon,
      title: "Hình ảnh",
      description: "Màn hình rõ nét",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: CheckCircle,
      title: "Kết nối",
      description: "Internet ổn định",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
  ]

  // Default instructions
  const instructions = [
    "Đọc kỹ từng câu hỏi trước khi chọn đáp án",
    "Mỗi câu hỏi chỉ có một đáp án đúng",
    "Bạn có thể quay lại các câu hỏi đã làm để kiểm tra",
    "Sử dụng nút đánh dấu để ghi nhớ câu hỏi cần xem lại",
    "Bài thi sẽ tự động nộp khi hết thời gian",
  ]

  // Important notes
  const importantNotes = [
    "Không được thoát khỏi trang web trong quá trình làm bài",
    "Bài thi sẽ tự động nộp khi hết thời gian",
    "Không thể làm lại sau khi đã nộp bài",
    "Đảm bảo thiết bị có đủ pin và kết nối internet ổn định",
  ]

  // Handle start exam
  const handleStartExam = async () => {
    if (!exam) return

    // Check authentication first
    if (!isAuthenticated()) {
      setError("Bạn cần đăng nhập để làm bài kiểm tra")
      return
    }

    try {
      setIsStarting(true)
      setError(null) // Clear previous errors
      const userId = getUserId()
      
      try {
        await examService.startExam(exam.id, userId)
        onStart()
      } catch (apiError) {
        // If this is a CORS error or network error, we still want to continue
        // The examService should have already logged the error
        console.warn("Proceeding despite API error:", apiError)
        onStart() // Continue anyway since backend will be implemented later
      }
    } catch (err) {
      console.error("Error starting exam:", err)
      if (err instanceof Error) {
        // Handle specific error messages
        if (err.message.includes("401") || err.message.includes("Unauthorized")) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại")
        } else if (err.message.includes("403") || err.message.includes("Forbidden")) {
          setError("Bạn không có quyền truy cập bài kiểm tra này")
        } else if (err.message.includes("simulated")) {
          // If using simulated response due to CORS/API issues, still proceed
          console.warn("Using simulated start exam response")
          onStart()
          return
        } else {
          setError(err.message)
        }
      } else {
        setError("Không thể bắt đầu bài kiểm tra. Vui lòng thử lại")
      }
    } finally {
      setIsStarting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
          <p className="text-lg text-gray-600">Đang tải thông tin bài kiểm tra...</p>
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>
          )}
        </div>
      </div>
    )
  }

  const difficulty = getDifficulty(exam.examScopeType)
  const jlptLevel = getJLPTLevel(exam.examScopeType)
  const questionTypes = getQuestionTypes(exam.questions)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <Target className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{exam.description}</p>
        </div>

        {/* Quiz Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{exam.duration}</p>
            <p className="text-sm text-gray-600">Phút</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{exam.questionCount}</p>
            <p className="text-sm text-gray-600">Câu hỏi</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
            <p className="text-sm text-gray-600 mt-1">Độ khó</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{jlptLevel}</p>
            <p className="text-sm text-gray-600">Trình độ JLPT</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Types */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="h-5 w-5" />
                Các loại câu hỏi
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {questionTypes.map((type) => (
                <div key={type.title} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <type.icon className={`h-6 w-6 ${type.color}`} />
                  <div>
                    <p className="font-medium text-gray-900">{type.title}</p>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <CheckCircle className="h-5 w-5" />
                Hướng dẫn làm bài
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {instructions.map((instruction) => (
                <div key={instruction} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">{instructions.indexOf(instruction) + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{instruction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Yêu cầu kỹ thuật
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {technicalRequirements.map((req) => (
                <div key={req.title} className={`flex items-center space-x-3 p-3 ${req.bgColor} rounded-lg`}>
                  <req.icon className={`h-5 w-5 ${req.iconColor}`} />
                  <div>
                    <p className="font-medium text-gray-900">{req.title}</p>
                    <p className="text-sm text-gray-600">{req.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg">
          <div className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Lưu ý quan trọng</h3>
                <ul className="space-y-1 text-sm text-amber-800">
                  {importantNotes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
          <p className="text-gray-600">Bạn đã sẵn sàng để bắt đầu bài kiểm tra?</p>
          <button
            onClick={handleStartExam}
            disabled={isStarting}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang chuẩn bị...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Bắt đầu làm bài
              </>
            )}
          </button>
          <p className="text-sm text-gray-500">Nhấn nút để bắt đầu bài kiểm tra</p>
        </div>
      </div>
    </div>
  )
}
