export interface Topic {
  id: number
  name: string
}

export interface Course {
  id: string
  title: string
  description: string
  duration: number
  level: string
  image: string | null
  requirement: string | null
  status: string
  prerequisiteCourseId: string | null
  topics: Topic[]
  averageRating?: number
}

export interface CourseApiResponse {
  success: boolean
  message: string
  data: {
    content: Course[]
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
    first: boolean
    size: number
    number: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    numberOfElements: number
    empty: boolean
  }
  timestamp: number
}

export interface TopCoursesApiResponse {
  success: boolean
  message: string
  data: Course[]
  timestamp: number
}

export interface CourseFilters {
  searchTitle?: string
  level?: string | null
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  size?: number
}
