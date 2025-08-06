import type { Chapter } from './chapter';
import type { Exam } from './exam';
import type { Topic } from './topic';

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  image: string | null;
  requirement: string | null;
  status: "ACTIVE" | "INACTIVE";
  prerequisiteCourseId: string | null;
  topics: Topic[];
  averageRating?: number;
  exams: Exam[];
  chapters?: Chapter[];
}

// API Response for Course Detail
export interface CourseDetailApiResponse {
  success: boolean;
  message: string;
  data: Course;
  timestamp: number;
}

// Existing API responses
export interface CourseApiResponse {
  success: boolean;
  message: string;
  data: {
    content: Course[];
    pageable: {
      pageNumber: number;
      pageSize: number;
      sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
      };
      offset: number;
      paged: boolean;
      unpaged: boolean;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
    first: boolean;
    size: number;
    number: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    numberOfElements: number;
    empty: boolean;
  };
  timestamp: number;
}

export interface TopCoursesApiResponse {
  success: boolean;
  message: string;
  data: Course[];
  timestamp: number;
}

// API response cho /api/courses (trả về tất cả courses không pagination)
export interface AllCoursesApiResponse {
  success: boolean;
  message: string;
  data: Course[];
  timestamp: number;
}

export interface CourseFilters {
  searchTitle?: string;
  level?: string | null;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

// UI-only: Popular course card type
export interface PopularCourseUI {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  students: number;
  rating: number;
  price: string;
  image: string;
  features: string[];
}

// Create Course Request for staff
export interface CreateCourseRequest {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  image: string;
  requirement: string;
  status: 'INACTIVE' | 'ACTIVE';
  prerequisiteCourseId: string | null;
  topicIds: string[];
  examIds: string[];
}

// Update Course Request for staff
export interface UpdateCourseRequest {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  image: string | null;
  requirement: string;
  status: 'INACTIVE' | 'ACTIVE';
  prerequisiteCourseId: string | null;
  topicIds: string[];
  examIds: string[];
}


// Create Course API Response
export interface CreateCourseApiResponse {
  success: boolean;
  message: string;
  data: Course;
  timestamp: number;
}
