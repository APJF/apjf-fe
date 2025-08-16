import type { ExamResult, Question } from '../types/exam'

/**
 * Utility functions để format dữ liệu exam cho việc hiển thị
 */
export class ExamDataFormatter {
  /**
   * Merge exam questions với exam result để có đầy đủ thông tin cho ExamAnswerReview
   */
  static mergeExamResultWithQuestions(
    examResult: ExamResult,
    _questions: Question[]
  ): ExamResult {
    return examResult;
  }

  /**
   * Validate exam result data
   */
  static validateExamResult(examResult: ExamResult): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!examResult.examResultId) {
      errors.push('Thiếu ID kết quả bài thi');
    }

    if (!examResult.questionResults || examResult.questionResults.length === 0) {
      errors.push('Không có câu trả lời nào');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate exam statistics
   */
  static calculateStatistics(examResult: ExamResult): {
    totalQuestions: number;
    correctAnswers: number;
    answeredCount: number;
    accuracy: number;
    scorePercentage: number;
    grade: string;
    timeSpent: string;
  } {
    const totalQuestions = examResult.questionResults?.length || 0;
    const correctAnswers = examResult.score || 0;
    const answeredCount = examResult.questionResults?.filter(
      (answer: any) => answer.selectedOptionId !== null || answer.userAnswer !== null
    ).length || 0;

    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const scorePercentage = accuracy;
    
    let grade = 'Yếu';
    if (scorePercentage >= 80) {
      grade = 'Giỏi';
    } else if (scorePercentage >= 65) {
      grade = 'Khá';
    } else if (scorePercentage >= 50) {
      grade = 'Trung bình';
    }

    return {
      totalQuestions,
      correctAnswers,
      answeredCount,
      accuracy: Math.round(accuracy),
      scorePercentage: Math.round(scorePercentage),
      grade,
      timeSpent: 'N/A'
    };
  }
}
