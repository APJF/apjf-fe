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

export type UpdateQuestionRequest = CreateQuestionRequest

export interface PageableSort {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: PageableSort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PagedQuestions {
  content: Question[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: PageableSort;
  empty: boolean;
}

export interface QuestionsResponse {
  success: boolean;
  message: string;
  data: PagedQuestions;
  timestamp: number;
}

export interface QuestionResponse {
  success: boolean;
  message: string;
  data: Question;
  timestamp: number;
}
