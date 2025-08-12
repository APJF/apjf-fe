// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
}

// Exam Overview - GET /api/student/exams/{examId}/overview
export interface ExamOverview {
  examId: string;
  title: string;
  description: string;
  duration: number; // in minutes
  totalQuestions: number;
  type: 'MULTIPLE_CHOICE' | 'ESSAY' | 'MIXED';
}

// Question Option
export interface QuestionOption {
  optionId: string;
  content: string;
  isCorrect?: boolean;
}

// Question Details from API - GET /api/questions/{questionId}
export interface QuestionDetail {
  id: string;
  content: string;
  scope: 'KANJI' | 'VOCAB' | 'GRAMMAR' | 'LISTENING' | 'READING' | 'WRITING';
  type: 'MULTIPLE_CHOICE' | 'WRITING' | 'ESSAY';
  explanation: string;
  fileUrl: string | null;
  createdAt: string;
  options: Array<{
    id: string;
    content: string;
    isCorrect: boolean;
  }>;
  unitIds: string[];
}

// Question Result from Start Exam API
export interface QuestionResult {
  questionId: string;
  questionContent: string;
  explanation: string;
  selectedOptionId: string | null;
  userAnswer: string | null;
  isCorrect: boolean;
  type?: 'MULTIPLE_CHOICE' | 'WRITING' | 'ESSAY'; // Question type
  scope?: 'KANJI' | 'VOCAB' | 'GRAMMAR' | 'LISTENING' | 'READING' | 'WRITING'; // Question scope
  options?: QuestionOption[]; // Available options for multiple choice
}

// Start Exam Response - POST /api/student/exams/{examId}/start  
export interface ExamStartResponse {
  examResultId: number;
  examId: string;
  examTitle: string;
  score: number | null;
  submittedAt: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PASSED';
  questionResults: QuestionResult[];
}

// Submit Exam Request - POST /api/student/exams/submit
export interface ExamSubmitRequest {
  examId: string;
  startedAt: string | null;
  submittedAt: string | null;
  questionResults: {
    questionId: string;
    selectedOptionId: string | null; // For multiple choice questions
    userAnswer: string | null; // For essay questions
  }[];
}

// Submit Exam Response - POST /api/student/exams/submit
export interface ExamSubmitResponse {
  examResultId: number;
  examId: string;
  examTitle: string;
  score: number;
  submittedAt: string | null;
  status: 'COMPLETED' | 'FAILED' | 'PASSED';
  questionResults: QuestionResult[];
}

// Exam Result - GET /api/student/exams/result/{resultId}
export interface ExamResult {
  examResultId: number;
  examId: string;
  examTitle: string;
  score: number;
  submittedAt: string | null;
  status: 'COMPLETED' | 'FAILED' | 'PASSED';
  questionResults: QuestionResult[];
}

// Exam History Item - GET /api/student/exams
export interface ExamHistoryItem {
  examResultId: string;
  examId: string;
  examTitle: string;
  score: number;
  status: 'PASSED' | 'FAILED';
  type: 'MULTIPLE_CHOICE' | 'ESSAY' | 'MIXED';
  submittedAt: string | null;
}

// Exam History Response - GET /api/student/exams
export type ExamHistoryResponse = ExamHistoryItem[];

// Legacy types for compatibility (will be gradually replaced)
export interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'WRITING';
  question: string;
  options?: Option[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  difficulty: string;
  skill: string;
  fileUrl?: string;
}

export interface Option {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: Question[];
  totalQuestions: number;
  passingScore: number;
  examScopeType: string;
  status: string;
}

// Result Answer for Review Page
export interface ExamResultAnswer {
  questionId: string;
  questionContent: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'WRITING';
  selectedOptionId?: string | null;
  userAnswer?: string | null;
  isCorrect: boolean;
  explanation: string;
  options?: Option[];
  correctAnswer?: string;
}
