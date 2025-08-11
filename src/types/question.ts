export interface QuestionOption {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  content: string;
  scope: 'KANJI' | 'VOCAB' | 'GRAMMAR' | 'LISTENING' | 'READING' | 'WRITING';
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'WRITING';
  explanation: string;
  fileUrl: string | null;
  createdAt: string;
  options: QuestionOption[];
  unitIds: string[];
}

export interface CreateQuestionRequest {
  id: string;
  content: string;
  scope: 'KANJI' | 'VOCAB' | 'GRAMMAR' | 'LISTENING' | 'READING' | 'WRITING';
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'WRITING';
  explanation: string;
  fileUrl: string | null;
  options: QuestionOption[];
  unitIds: string[];
}

export interface UpdateQuestionRequest extends CreateQuestionRequest {}

export interface QuestionsResponse {
  success: boolean;
  message: string;
  data: Question[];
  timestamp: number;
}

export interface QuestionResponse {
  success: boolean;
  message: string;
  data: Question;
  timestamp: number;
}
