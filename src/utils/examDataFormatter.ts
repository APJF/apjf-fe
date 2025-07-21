import type { ExamResult, ExamResultAnswer, Question } from '../types/exam'

/**
 * Utility functions để format dữ liệu exam cho việc hiển thị
 */
export class ExamDataFormatter {
  /**
   * Merge exam questions với exam result để có đầy đủ thông tin cho ExamAnswerReview
   */
  static mergeExamResultWithQuestions(
    examResult: ExamResult,
    questions: Question[]
  ): ExamResult {
    // Tạo map questions để lookup nhanh
    const questionsMap = new Map<string, Question>()
    questions.forEach(question => {
      questionsMap.set(question.id, question)
    })

    // Merge thông tin từ questions vào answers
    const enhancedAnswers: ExamResultAnswer[] = examResult.answers.map(answer => {
      const question = questionsMap.get(answer.questionId)
      
      if (question) {
        return {
          ...answer,
          options: question.options,
          type: question.type,
          explanation: question.explanation
        }
      }
      
      return answer
    })

    // Nếu có câu hỏi trong exam mà không có trong result (câu chưa trả lời)
    const answeredQuestionIds = new Set(examResult.answers.map(a => a.questionId))
    const unansweredQuestions = questions.filter(q => !answeredQuestionIds.has(q.id))
    
    const unansweredAnswers: ExamResultAnswer[] = unansweredQuestions.map(question => ({
      id: `unanswered_${question.id}`,
      userAnswer: null,
      isCorrect: false,
      questionId: question.id,
      questionContent: question.content,
      selectedOptionId: null,
      correctAnswer: question.correctAnswer,
      options: question.options,
      type: question.type,
      explanation: question.explanation
    }))

    return {
      ...examResult,
      answers: [...enhancedAnswers, ...unansweredAnswers],
      totalQuestions: Math.max(examResult.totalQuestions, questions.length)
    }
  }

  /**
   * Validate exam result data để đảm bảo tính nhất quán
   */
  static validateExamResult(examResult: ExamResult): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!examResult.id) {
      errors.push('Thiếu ID kết quả bài kiểm tra')
    }

    if (!examResult.examId) {
      errors.push('Thiếu ID bài kiểm tra')
    }

    if (!examResult.answers || examResult.answers.length === 0) {
      errors.push('Không có dữ liệu câu trả lời')
    }

    if (examResult.totalQuestions <= 0) {
      errors.push('Số câu hỏi không hợp lệ')
    }

    if (examResult.answers.length !== examResult.totalQuestions) {
      console.warn(
        `Số câu trả lời (${examResult.answers.length}) khác với tổng số câu (${examResult.totalQuestions})`
      )
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Tính thống kê nhanh về kết quả bài thi
   */
  static calculateExamStats(examResult: ExamResult) {
    const totalQuestions = examResult.totalQuestions || examResult.answers.length
    const correctAnswers = examResult.correctAnswers || 0
    const answeredCount = examResult.answers.filter(
      answer => answer.selectedOptionId !== null || answer.userAnswer !== null
    ).length
    const unansweredCount = totalQuestions - answeredCount
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    return {
      totalQuestions,
      correctAnswers,
      wrongAnswers: answeredCount - correctAnswers,
      answeredCount,
      unansweredCount,
      percentage,
      isPassed: percentage >= 60, // Assuming 60% is passing grade
      timeSpent: this.calculateTimeSpent(examResult.startedAt, examResult.submittedAt)
    }
  }

  /**
   * Tính thời gian làm bài
   */
  private static calculateTimeSpent(startedAt: string, submittedAt: string | null): string {
    if (!startedAt || !submittedAt) return "N/A"
    
    try {
      const start = new Date(startedAt)
      const end = new Date(submittedAt)
      const diffMs = end.getTime() - start.getTime()
      
      if (diffMs < 0) return "N/A"
      
      const minutes = Math.floor(diffMs / 60000)
      const seconds = Math.floor((diffMs % 60000) / 1000)
      
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`
      } else {
        return `${seconds}s`
      }
    } catch (error) {
      console.warn('Error calculating time spent:', error)
      return "N/A"
    }
  }
}
