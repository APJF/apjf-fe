export interface Topic {
  id: number;
  name: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  examScopeType: string;
  createdAt: string;
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
  exams?: Exam[];
  units: Unit[];
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
  exams: Exam[];
  chapters: Chapter[];
}

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
