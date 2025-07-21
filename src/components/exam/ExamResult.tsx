import React, { useEffect, useState } from "react"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Star, 
  Trophy, 
  Target, 
  Clock, 
  FileText, 
  Eye, 
  RotateCcw,
  Loader
} from "lucide-react"
import type { ExamResultProps, Question } from "../../types/exam"
import { ExamService } from "../../services/examService"

/**
 * ExamResult Component - Hiển thị kết quả bài kiểm tra
 * Bao gồm điểm số, phân tích chi tiết, và các hành động tiếp theo
 */
export function ExamResult({ examResult, onRestart, onShowAnswers }: Readonly<ExamResultProps>) {
  const { score = 0, totalQuestions = 0, answers = [], examTitle = "Bài kiểm tra", status = "COMPLETED", correctAnswers = 0, examId = "" } = examResult || {}
  
  const [isLoadingExam, setIsLoadingExam] = useState(false)
  const [examQuestions, setExamQuestions] = useState<Record<string, Question>>({})
  
  // Lấy thông tin đầy đủ về bài kiểm tra từ API
  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId) return
      
      try {
        setIsLoadingExam(true)
        const response = await ExamService.getExamDetail(examId)
        
        if (!response.success) {
          throw new Error(response.message || "Không thể tải thông tin bài kiểm tra")
        }
        
        // Tạo map các câu hỏi để dễ dàng truy cập theo ID
        const questionsMap: Record<string, Question> = {}
        response.data.questions.forEach((question: Question) => {
          questionsMap[question.id] = question
        })
        
        setExamQuestions(questionsMap)
        console.log("ExamResult - Loaded exam data:", response.data)
        console.log("ExamResult - Questions map:", questionsMap)
      } catch (error) {
        console.error("Failed to load exam data:", error)
      } finally {
        setIsLoadingExam(false)
      }
    }
    
    fetchExamData()
  }, [examId])
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  // Tính thời gian làm bài
  const timeSpent = React.useMemo(() => {
    if (!examResult.startedAt || !examResult.submittedAt) return "N/A"
    
    const start = new Date(examResult.startedAt)
    const end = new Date(examResult.submittedAt)
    const diffMs = end.getTime() - start.getTime()
    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)
    
    return `${minutes}m ${seconds}s`
  }, [examResult.startedAt, examResult.submittedAt])

  // Helper function để lấy màu progress bar
  const getProgressBarColor = (percent: number): string => {
    if (percent < 30) return "bg-red-500"
    if (percent < 50) return "bg-orange-500" 
    if (percent < 70) return "bg-yellow-500"
    if (percent < 90) return "bg-green-500"
    return "bg-green-600"
  }

  // Helper function để lấy status display
  const getStatusDisplay = (examStatus: string) => {
    switch (examStatus) {
      case 'PASSED': return { text: 'Đạt', color: 'text-green-600' }
      case 'FAILED': return { text: 'Không đạt', color: 'text-red-600' }
      default: return { text: 'Đang xử lý', color: 'text-yellow-600' }
    }
  }

  // Đánh giá kết quả dựa trên phần trăm điểm
  const getEvaluation = (percent: number) => {
    if (percent < 10) {
      return {
        level: "Cần cải thiện nhiều",
        message: "Bạn cần ôn luyện lại từ đầu và tập trung vào các kiến thức cơ bản.",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        scoreColor: "text-red-600",
        scoreBg: "bg-red-50",
      }
    } else if (percent < 30) {
      return {
        level: "Yếu",
        message: "Bạn cần ôn luyện thêm rất nhiều. Hãy xem lại tài liệu và làm thêm bài tập.",
        icon: XCircle,
        color: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        scoreColor: "text-red-500",
        scoreBg: "bg-red-50",
      }
    } else if (percent < 50) {
      return {
        level: "Cần cải thiện",
        message: "Bạn đã có tiến bộ nhưng vẫn cần ôn luyện thêm để đạt kết quả tốt hơn.",
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        scoreColor: "text-orange-600",
        scoreBg: "bg-orange-50",
      }
    } else if (percent < 70) {
      return {
        level: "Trung bình",
        message: "Kết quả ổn nhưng bạn có thể làm tốt hơn. Hãy ôn luyện thêm một chút.",
        icon: Target,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        scoreColor: "text-yellow-600",
        scoreBg: "bg-yellow-50",
      }
    } else if (percent < 90) {
      return {
        level: "Đạt",
        message: "Chúc mừng! Bạn đã đạt kết quả tốt. Tiếp tục duy trì phong độ này.",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        scoreColor: "text-green-600",
        scoreBg: "bg-green-50",
      }
    } else if (percent < 100) {
      return {
        level: "Giỏi",
        message: "Xuất sắc! Bạn đã thể hiện rất tốt. Chỉ cần một chút nữa là hoàn hảo.",
        icon: Star,
        color: "text-green-700",
        bgColor: "bg-green-100",
        borderColor: "border-green-300",
        scoreColor: "text-green-700",
        scoreBg: "bg-green-100",
      }
    } else {
      return {
        level: "Hoàn hảo",
        message: "Tuyệt vời! Bạn đã đạt điểm tối đa. Kiến thức của bạn rất vững vàng!",
        icon: Trophy,
        color: "text-green-800",
        bgColor: "bg-green-200",
        borderColor: "border-green-400",
        scoreColor: "text-green-800",
        scoreBg: "bg-green-200",
      }
    }
  }

  // Xác định màu nền dựa trên percentage
  const getBackgroundColor = (percent: number) => {
    if (percent < 10) return "bg-red-50"
    if (percent < 30) return "bg-red-50"
    if (percent < 50) return "bg-orange-50"
    if (percent < 70) return "bg-yellow-50"
    if (percent < 90) return "bg-green-50"
    if (percent < 100) return "bg-green-100"
    return "bg-green-200"
  }

  // Helper function để xác định loại câu hỏi
  const getQuestionType = (questionType: string, content: string = "") => {
    switch (questionType) {
      case "MULTIPLE_CHOICE":
        return "multiple_choice"
      case "TRUE_FALSE":
        return "true_false" 
      case "WRITING":
        return "writing"
      default:
        // Nếu không có loại câu hỏi xác định, dựa vào nội dung để phân loại
        if (content.includes("Hiragana") || content.includes("Katakana") || content.toLowerCase().includes("kana")) {
          return "kana"
        } else if (content.includes("từ") || content.toLowerCase().includes("vocab") || content.toLowerCase().includes("vocabulary")) {
          return "vocabulary" 
        } else if (content.includes("kanji") || content.toLowerCase().includes("kanji")) {
          return "kanji"
        } else if (content.includes("ngữ pháp") || content.toLowerCase().includes("grammar")) {
          return "grammar"
        } else if (content.includes("đọc") || content.toLowerCase().includes("reading")) {
          return "reading"
        } else if (content.includes("nghe") || content.toLowerCase().includes("listening")) {
          return "listening"
        }
        return "other"
    }
  }

  // Phân tích theo loại câu hỏi
  const getQuestionTypeAnalysis = () => {
    // Khởi tạo object để lưu trữ thống kê theo loại câu hỏi
    const typeStats: Record<string, { correct: number; total: number; answered: number; unanswered: number }> = {}
    
    console.log("Analyzing answers:", answers)
    
    // Sử dụng Set để theo dõi các questionId đã xử lý
    const processedQuestionIds = new Set<string>()
    
    // Xử lý các câu trả lời từ kết quả bài kiểm tra
    if (answers && Array.isArray(answers) && answers.length > 0) {
      answers.forEach(answer => {
        // Thêm questionId vào danh sách đã xử lý
        processedQuestionIds.add(answer.questionId)
        
        // Kiểm tra xem câu hỏi đã được trả lời hay chưa
        const hasAnswered = answer.selectedOptionId !== null && answer.selectedOptionId !== undefined || 
                          answer.userAnswer !== null && answer.userAnswer !== undefined && answer.userAnswer !== '';
        
        // Lấy thông tin câu hỏi từ examQuestions nếu có
        const questionInfo = examQuestions[answer.questionId]
        
        // Dùng loại câu hỏi từ examQuestions nếu có, nếu không thì dùng từ answer
        const questionType = questionInfo?.type || answer.type || "UNKNOWN"
        const questionContent = questionInfo?.content || answer.questionContent || ""
        
        // Xác định loại câu hỏi bằng helper function
        const type = getQuestionType(questionType, questionContent)
        
        console.log(`Answer for Question ${answer.questionId}: type=${questionType} -> ${type}, hasAnswered=${hasAnswered}, isCorrect=${answer.isCorrect}`)
        
        // Đảm bảo loại này được khởi tạo trong thống kê
        if (!typeStats[type]) {
          typeStats[type] = { correct: 0, total: 1, answered: 0, unanswered: 0 };
        } else {
          // Tăng tổng số câu hỏi của loại này
          typeStats[type].total++;
        }
        
        // Cập nhật số câu đã trả lời/chưa trả lời
        if (hasAnswered) {
          typeStats[type].answered++;
        } else {
          typeStats[type].unanswered++;
        }
        
        // Kiểm tra câu trả lời đúng
        if (answer.isCorrect === true) {
          typeStats[type].correct++;
        }
      })
    }
    
    // Kiểm tra xem có câu hỏi nào từ examQuestions chưa được đưa vào answers không
    if (Object.keys(examQuestions).length > 0) {
      Object.entries(examQuestions).forEach(([questionId, question]) => {
        // Bỏ qua câu hỏi đã được xử lý từ answers
        if (processedQuestionIds.has(questionId)) {
          return;
        }
        
        const type = getQuestionType(question.type, question.content);
        console.log(`Unprocessed question ${questionId}: type=${question.type} -> ${type} (no answer provided)`);
        
        // Đảm bảo loại này được khởi tạo trong thống kê
        if (!typeStats[type]) {
          typeStats[type] = { correct: 0, total: 1, answered: 0, unanswered: 1 };
        } else {
          // Tăng tổng số câu hỏi và số câu chưa trả lời của loại này
          typeStats[type].total++;
          typeStats[type].unanswered++;
        }
      })
    }
    
    // Nếu không có dữ liệu gì cả
    if (Object.keys(typeStats).length === 0) {
      console.warn("No exam data available for analysis")
      typeStats["nodata"] = { correct: 0, total: 0, answered: 0, unanswered: 0 }
    }
    
    console.log("Final typeStats:", typeStats)
    return typeStats
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "multiple_choice": return "📋"
      case "true_false": return "✓"
      case "writing": return "✏️"
      case "kana": return "あ"
      case "kanji": return "漢"
      case "vocabulary": return "📚"
      case "grammar": return "📝"
      case "reading": return "📖"
      case "listening": return "🎧"
      case "nodata": return "❓"
      default: return "📝"
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case "multiple_choice": return "Trắc nghiệm"
      case "true_false": return "Đúng/Sai"
      case "writing": return "Tự luận"
      case "kana": return "Kana"
      case "kanji": return "Kanji"
      case "vocabulary": return "Từ vựng"
      case "grammar": return "Ngữ pháp"
      case "reading": return "Đọc hiểu"
      case "listening": return "Nghe"
      case "nodata": return "Không có dữ liệu"
      default: return "Khác"
    }
  }

  const evaluation = getEvaluation(percentage)
  const backgroundColor = getBackgroundColor(percentage)
  const IconComponent = evaluation.icon
  const typeAnalysis = getQuestionTypeAnalysis()
  const statusDisplay = getStatusDisplay(status)
  const progressBarColor = getProgressBarColor(percentage)

  return (
    <div className={`min-h-screen ${backgroundColor} p-6 transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className={`mx-auto w-20 h-20 ${evaluation.bgColor} rounded-full flex items-center justify-center`}>
            <IconComponent className={`h-10 w-10 ${evaluation.color}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Kết quả bài kiểm tra</h1>
          <p className="text-gray-600">{examTitle}</p>
          <p className="text-sm text-gray-500">
            Trạng thái: <span className={`font-medium ${statusDisplay.color}`}>
              {statusDisplay.text}
            </span>
          </p>
        </div>

        {/* Main Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Card */}
          <div className={`bg-white rounded-lg border-2 ${evaluation.borderColor} p-6 text-center shadow-sm`}>
            <div className={`text-4xl font-bold ${evaluation.scoreColor} mb-2`}>
              {score}%
            </div>
            <p className="text-sm text-gray-600 mb-4">Điểm số</p>
          </div>

          {/* Evaluation Card */}
          <div className={`lg:col-span-2 bg-white rounded-lg border-2 ${evaluation.borderColor} ${evaluation.bgColor} p-6 shadow-sm`}>
            <div className="flex items-start space-x-4">
              <IconComponent className={`h-8 w-8 ${evaluation.color} flex-shrink-0 mt-1`} />
              <div>
                <h3 className={`text-xl font-bold ${evaluation.color} mb-2`}>{evaluation.level}</h3>
                <p className="text-gray-700 leading-relaxed">{evaluation.message}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {examResult.correctAnswers}
            </div>
            <p className="text-sm text-gray-600">Câu đúng</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{totalQuestions - correctAnswers}</div>
            <p className="text-sm text-gray-600">Câu sai</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{timeSpent}</div>
            <p className="text-sm text-gray-600">Thời gian</p>
          </div>
        </div>

        {/* Performance Analysis */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Phân tích kết quả</span>
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tỷ lệ đúng</span>
                <span className={`font-medium ${evaluation.scoreColor}`}>{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${progressBarColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Question Type Analysis */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {isLoadingExam ? (
                <div className="col-span-4 flex flex-col items-center justify-center py-8">
                  <Loader className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-gray-500">Đang tải dữ liệu phân tích...</p>
                </div>
              ) : (
                Object.entries(typeAnalysis).map(([type, stats]) => {
                // Chỉ hiển thị các loại câu hỏi có trong bài kiểm tra (stats.total > 0)
                if (stats.total === 0) return null;
                
                // Tính phần trăm câu đúng
                const typePercentage = Math.round((stats.correct / stats.total) * 100);
                
                // Xác định màu sắc dựa trên tỷ lệ đúng
                let colorClass = "text-green-600";
                if (typePercentage < 50) {
                  colorClass = "text-red-600";
                } else if (typePercentage < 70) {
                  colorClass = "text-yellow-600";
                }
                
                return (
                  <div key={type} className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">{getTypeIcon(type)}</div>
                    <div className="text-sm font-medium text-gray-900">{getTypeName(type)}</div>
                    <div className="text-lg font-bold text-gray-700">
                      {stats.correct}/{stats.total}
                    </div>
                    <div className={`text-xs font-medium ${colorClass}`}>{typePercentage}%</div>
                    {stats.unanswered > 0 && (
                      <div className="text-xs text-yellow-600 mt-1">
                        {stats.unanswered} câu chưa làm
                      </div>
                    )}
                  </div>
                );
              }).filter(Boolean)
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onShowAnswers}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-5 w-5" />
            <span>Xem đáp án chi tiết</span>
          </button>

          <button 
            onClick={onRestart}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Làm lại bài kiểm tra</span>
          </button>
        </div>

        {/* Recommendations */}
        {percentage < 70 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <FileText className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Gợi ý ôn luyện</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Xem lại các câu trả lời sai để hiểu rõ lỗi</li>
                  <li>• Ôn luyện thêm các chủ đề yếu</li>
                  <li>• Làm thêm bài tập tương tự</li>
                  <li>• Tham khảo tài liệu học tập bổ sung</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
