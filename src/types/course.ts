export interface Topic {
  id: number;
  name: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationInMinutes: number;
  numberOfQuestions: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface Material {
  id: string;
  description: string;
  fileUrl: string;
  type: string;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  status: string;
  chapterId?: string;
  prerequisiteUnitId: string | null;
  exams?: Exam[];
  materials?: Material[];
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  courseId: string;
  prerequisiteChapterId: string | null;
  exams: Exam[];
  units?: Unit[];
}

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
  data: {
    id: string;
    title: string;
    description: string;
    duration: number;
    level: "N5" | "N4" | "N3" | "N2" | "N1";
    image: string;
    requirement: string;
    status: "ACTIVE" | "INACTIVE";
    prerequisiteCourseId: string;
    topics: Topic[];
    exams: Exam[];
    averageRating: number;
  };
  timestamp: number;
}

// API Response for Chapters
export interface ChaptersApiResponse {
  success: boolean;
  message: string;
  data: Chapter[];
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
  prerequisiteCourseId: string;
  topicIds: string[];
  examIds: string[];
}

// Create Chapter Request for staff
export interface CreateChapterRequest {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  courseId: string;
  prerequisiteChapterId: string | null;
}

// Create Course API Response
export interface CreateCourseApiResponse {
  success: boolean;
  message: string;
  data: Course;
  timestamp: number;
}

// Create Chapter API Response
export interface CreateChapterApiResponse {
  success: boolean;
  message: string;
  data: Chapter;
  timestamp: number;
}

// Chapter Detail API Response (for /api/chapters/{chapterId})
export interface ChapterDetailApiResponse {
  success: boolean;
  message: string;
  data: Chapter;
  timestamp: number;
}

// Units API Response (for /api/units/chapter/{chapterId})
export interface UnitsApiResponse {
  success: boolean;
  message: string;
  data: Unit[];
  timestamp: number;
}

// Create Unit Request for staff
export interface CreateUnitRequest {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  chapterId: string;
  prerequisiteUnitId: string | null;
}

// Create Unit API Response
export interface CreateUnitApiResponse {
  success: boolean;
  message: string;
  data: Unit;
  timestamp: number;
}
