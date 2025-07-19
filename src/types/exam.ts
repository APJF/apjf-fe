export interface QuestionOption {
  id: string
  content: string
  isCorrect: boolean
}

export interface Question {
  id: string
  content: string
  correctAnswer: string
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "WRITING"
  scope: string
  explanation: string
  fileUrl: string | null
  createdAt: string
  options: QuestionOption[]
}

export interface Exam {
  id: string
  title: string
  description: string
  duration: number
  examScopeType: string
  createdAt: string
  questions: Question[]
  totalQuestions: number
  courseId: string
  chapterId: string | null
  unitId: string | null
  questionIds: string[]
  questionCount: number
}

export interface ExamApiResponse {
  success: boolean
  message: string
  data: Exam
  timestamp: number
}

export interface StartExamRequest {
  examId: string
  userId: string
}

export interface StartExamResponse {
  success: boolean
  message: string
  data: ExamResult
  timestamp: number
}

export interface SubmitExamAnswer {
  questionId: string
  selectedOptionId: string | null
  userAnswer: string | null
}

export interface SubmitExamRequest {
  examId: string
  answers: SubmitExamAnswer[]
}

export interface ExamResultAnswer {
  id: string
  userAnswer: string | null
  isCorrect: boolean
  questionId: string
  questionContent: string
  selectedOptionId: string | null
  correctAnswer: string
  options?: QuestionOption[]
  type?: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "WRITING"
}

export interface ExamResult {
  id: string
  startedAt: string
  submittedAt: string | null
  score: number | null
  status: "PASSED" | "FAILED" | "IN_PROGRESS"
  userId: string
  examId: string
  examTitle: string
  answers: ExamResultAnswer[]
  totalQuestions: number
  correctAnswers: number
}

export interface SubmitExamResponse {
  success: boolean
  message: string
  data: ExamResult
  timestamp: number
}

export interface ExamResultProps {
  examResult: ExamResult
  onRestart: () => void
  onShowAnswers: () => void
}
