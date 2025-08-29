import type { Exam } from './exam';
import type { Unit } from './unit';

export interface Chapter {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  courseId: string;
  prerequisiteChapterId: string | null;
  isCompleted?: boolean;
  percent?: number;
  exams: Exam[];
  units?: Unit[];
}

// API Response for Chapters
export interface ChaptersApiResponse {
  success: boolean;
  message: string;
  data: Chapter[];
  timestamp: number;
}

// Create Chapter Request for staff
export interface CreateChapterRequest {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  courseId: string;
  prerequisiteChapterId: string | null;
  exams?: Exam[];
}

// Update Chapter Request for staff
export interface UpdateChapterRequest {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  courseId: string;
  prerequisiteChapterId: string | null;
  exams: Exam[];
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
