import { useState } from "react"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Trophy, 
  Target, 
  FileText, 
  Eye, 
  RotateCcw,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import type { ExamResult } from "../../types/exam"

interface ExamResultProps {
  examResult: ExamResult
  onRestart: () => void
  onShowAnswers: () => void
}

/**
 * ExamResult Component - Hiển thị kết quả bài kiểm tra theo API mới  
 * Sử dụng data từ ExamResult interface với questionResults
 */
export function ExamResult({ examResult, onRestart, onShowAnswers }: Readonly<ExamResultProps>) {
  const [showDetails, setShowDetails] = useState(false)

  // Tính toán các thông số từ questionResults
  const totalQuestions = examResult.questionResults?.length || 0
  const correctAnswers = examResult.questionResults?.filter(q => q.isCorrect).length || 0
  const incorrectAnswers = totalQuestions - correctAnswers
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  
  // Phân loại theo scope của câu hỏi
  const questionScopes = examResult.questionResults?.reduce((acc, question) => {
    // Try to get scope from question first, then from localStorage as fallback
    let scope: string = question.scope || '';
    if (!scope || scope === 'UNKNOWN') {
      const savedScopes = localStorage.getItem('examQuestionScopes');
      if (savedScopes) {
        try {
          const scopesMap = JSON.parse(savedScopes);
          scope = scopesMap[question.questionId] || 'UNKNOWN';
        } catch (error) {
          console.warn('Error parsing saved question scopes:', error);
          scope = 'UNKNOWN';
        }
      } else {
        scope = 'UNKNOWN';
      }
    }
    
    if (!acc[scope]) {
      acc[scope] = { total: 0, correct: 0 }
    }
    acc[scope].total++
    if (question.isCorrect) {
      acc[scope].correct++
    }
    return acc
  }, {} as Record<string, { total: number; correct: number }>) || {}

  // Đánh giá kết quả
  const getEvaluation = (percent: number) => {
    if (percent >= 90) {
      return {
        text: "Xuất sắc!",
        subtext: "Bạn đã làm bài rất tốt",
        icon: Trophy,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200"
      }
    } else if (percent >= 80) {
      return {
        text: "Tốt!",
        subtext: "Kết quả khá ổn, tiếp tục cố gắng",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      }
    } else if (percent >= 70) {
      return {
        text: "Khá!",
        subtext: "Bạn đang trên đường phát triển",
        icon: Target,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      }
    } else if (percent >= 60) {
      return {
        text: "Trung bình",
        subtext: "Cần ôn tập thêm",
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      }
    } else {
      return {
        text: "Cần cải thiện",
        subtext: "Hãy ôn lại kiến thức",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      }
    }
  }

  const evaluation = getEvaluation(percentage)
  const IconComponent = evaluation.icon

  // Helper functions cho styling
  const getCircleColor = (percent: number) => {
    if (percent >= 70) return "text-green-500"
    if (percent >= 50) return "text-yellow-500"
    return "text-red-500"
  }

  const getTypePercentageColor = (percent: number) => {
    if (percent >= 70) return 'text-green-600'
    if (percent >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTypeBarColor = (percent: number) => {
    if (percent >= 70) return 'bg-green-500'
    if (percent >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Xác định status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PASSED':
        return {
          text: 'ĐẬU',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        }
      case 'FAILED':
        return {
          text: 'RỚT',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        }
      case 'COMPLETED':
        return {
          text: 'HOÀN THÀNH',
          icon: CheckCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        }
      default:
        return {
          text: status,
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
    }
  }

  const statusDisplay = getStatusDisplay(examResult.status)
  const StatusIcon = statusDisplay.icon

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'KANJI':
        return FileText
      case 'VOCAB':
        return Target
      case 'GRAMMAR':
        return AlertTriangle
      case 'LISTENING':
        return Trophy
      case 'READING':
        return CheckCircle
      case 'WRITING':
        return FileText
      default:
        return FileText
    }
  }

  const getScopeName = (scope: string) => {
    switch (scope) {
      case 'KANJI':
        return 'Kanji'
      case 'VOCAB':
        return 'Từ vựng'
      case 'GRAMMAR':
        return 'Ngữ pháp'
      case 'LISTENING':
        return 'Nghe'
      case 'READING':
        return 'Đọc'
      case 'WRITING':
        return 'Viết'
      default:
        return scope
    }
  }

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'KANJI':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'VOCAB':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'GRAMMAR':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'LISTENING':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'READING':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'WRITING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusDisplay.bgColor}`}>
              <StatusIcon className={`h-5 w-5 ${statusDisplay.color}`} />
              <span className={`font-semibold ${statusDisplay.color}`}>
                {statusDisplay.text}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">
              {examResult.examTitle}
            </h1>
            
            <div className={`inline-flex items-center gap-3 p-6 rounded-2xl border ${evaluation.borderColor} ${evaluation.bgColor}`}>
              <IconComponent className={`h-12 w-12 ${evaluation.color}`} />
              <div className="text-left">
                <h2 className={`text-2xl font-bold ${evaluation.color}`}>
                  {evaluation.text}
                </h2>
                <p className="text-gray-600">{evaluation.subtext}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Score */}
            <div className="text-center">
              <div className="relative">
                <div className="w-32 h-32 mx-auto">
                  {/* Circular Progress */}
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
                      className={getCircleColor(percentage)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {examResult.score.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">điểm</div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-4">Điểm số</h3>
            </div>

            {/* Correct Answers */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="relative p-4 bg-green-50 rounded-full">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-green-600">Câu đúng</h3>
              <p className="text-gray-600 font-medium">{correctAnswers}/{totalQuestions} câu</p>
            </div>

            {/* Incorrect Answers */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="relative p-4 bg-red-50 rounded-full">
                  <XCircle className="h-16 w-16 text-red-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-red-600">Câu sai</h3>
              <p className="text-gray-600 font-medium">{incorrectAnswers}/{totalQuestions} câu</p>
            </div>
          </div>
        </div>

        {/* Details Toggle */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-xl font-semibold text-gray-900">Chi tiết theo phạm vi kiến thức</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {showDetails ? 'Ẩn' : 'Hiển thị'}
              </span>
              {showDetails ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </button>

          {showDetails && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(questionScopes).map(([scope, stats]) => {
                const ScopeIcon = getScopeIcon(scope)
                const scopePercentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
                
                return (
                  <div key={scope} className={`p-6 rounded-xl border-2 ${getScopeColor(scope)}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          <ScopeIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{getScopeName(scope)}</h4>
                          <p className="text-sm opacity-80">
                            {stats.correct}/{stats.total} câu đúng
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getTypePercentageColor(scopePercentage)}`}>
                          {scopePercentage}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-white bg-opacity-50 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${getTypeBarColor(scopePercentage)} transition-all duration-500`}
                        style={{ width: `${scopePercentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onShowAnswers}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-5 w-5" />
              Xem lại câu trả lời
            </button>
            
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              Thi lại
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Thời gian nộp bài: {examResult.submittedAt ? new Date(examResult.submittedAt).toLocaleString('vi-VN') : 'Chưa xác định'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
