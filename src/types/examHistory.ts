export interface ExamHistory {
  examId: string
  examTitle: string
  courseId: string
  courseTitle: string
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' // Thêm trường level
  attemptId: string
  attemptedAt: string
  completedAt: string // Chỉ hiển thị bài đã hoàn thành
  status: 'COMPLETED' // Chỉ có status COMPLETED
  score: number
  correctAnswers: number
  totalQuestions: number
  timeSpent: number // in seconds
}

export interface ExamHistoryFilter {
  level: 'ALL' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1' // Thay status bằng level
  sortBy: 'attemptedAt' | 'score'
  sortDirection: 'ASC' | 'DESC'
  page?: number
  size?: number
}

export interface ExamHistoryResponse {
  content: ExamHistory[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalElements: number
  totalPages: number
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  first: boolean
  numberOfElements: number
  empty: boolean
}
