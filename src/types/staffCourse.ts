import type { Course } from './course';
import type { Chapter } from './chapter';
import type { Unit } from './unit';

// Staff Course Detail - type alias cho Course (tạm thời đơn giản hóa)
export type StaffCourseDetail = Course;

// Chapter Detail - type alias cho Chapter (tạm thời đơn giản hóa)
export type ChapterDetail = Chapter;

// Re-export các types cần thiết
export type { Course, Chapter, Unit };
