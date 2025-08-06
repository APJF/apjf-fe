// Type aliases
export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "WRITING"
export type DifficultyLevel = "Dễ" | "Trung bình" | "Khó"
export type SkillType = "Ngữ pháp" | "Từ vựng" | "Kanji" | "Đọc hiểu" | "Nghe"
export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1"
export type ExamScope = "course" | "chapter" | "unit"
export type ExamStatus = 'ACTIVE' | 'INACTIVE'
export type MediaType = "image" | "audio" | "video"

export interface QuestionOption {
  id: string
  content: string
  isCorrect: boolean
}

export interface Question {
  id: string
  content: string
  correctAnswer: string
  type: QuestionType
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
  durationInMinutes: number // thêm field này để tương thích
  examScopeType: string
  createdAt: string
  questions: Question[]
  totalQuestions: number
  courseId: string
  chapterId: string | null
  unitId: string | null
  questionIds: string[]
  questionCount: number
  status?: ExamStatus // thêm field này để tương thích
}

// Staff Exam Management Types
export interface ExamQuestion {
  id: string
  type: QuestionType
  question: string
  options?: Array<{
    id: string
    content: string
    isCorrect: boolean
  }>
  correctAnswer?: string
  explanation?: string
  points: number
  difficulty: DifficultyLevel
  skill: SkillType
  media?: {
    type: MediaType
    url: string
  }
}

export interface ExamData {
  id?: string
  title: string
  description: string
  courseId?: string
  chapterId?: string
  unitId?: string
  scope: ExamScope
  duration: number // minutes
  totalPoints: number
  passingScore: number
  difficulty: DifficultyLevel
  level: JLPTLevel
  instructions: string
  questions: ExamQuestion[]
  settings: {
    shuffleQuestions: boolean
    shuffleOptions: boolean
    showResults: boolean
    allowRetake: boolean
    timeLimit: boolean
  }
  status: ExamStatus
  createdAt?: string
  updatedAt?: string
}

export interface ExamSummary {
  id: string
  title: string
  description: string
  duration: number
  totalPoints: number
  questionCount: number
  difficulty: string
  level: string
  status: ExamStatus
  createdAt: string
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
  explanation?: string | null
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
