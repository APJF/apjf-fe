export interface Topic {
  id: number;
  name: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // Hợp nhất từ courseDetail.ts
  durationInMinutes?: number; // Giữ lại từ course.ts, có thể dùng ở đâu đó
  numberOfQuestions?: number; // Giữ lại từ course.ts
  status: string | null;
  examScopeType?: string; // Hợp nhất từ courseDetail.ts
  createdAt?: string; // Hợp nhất từ courseDetail.ts
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
  status: string;
  courseId: string;
  prerequisiteChapterId: string | null;
  exams: Exam[];
  units: Unit[]; // Sử dụng Unit[] thay vì any[]
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  image: string | null;
  requirement: string | null;
  status: string;
  prerequisiteCourseId: string | null;
  topics: Topic[];
  averageRating?: number;
  exams: Exam[];
  chapters?: Chapter[]; // Thêm từ courseDetail.ts
}

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

// Thêm các kiểu response từ courseDetail.ts
export interface CourseDetailApiResponse {
  success: boolean;
  message: string;
  data: {
    course: Course;
  };
  timestamp: number;
}

export interface ChapterDetailApiResponse {
  success: boolean;
  message: string;
  data: Chapter;
  timestamp: number;
}

export interface UnitListApiResponse {
  success: boolean;
  message: string;
  data: Unit[];
  timestamp: number;
}
