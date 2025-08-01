export type CourseStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED"
export type ExamScopeType = "COURSE" | "CHAPTER" | "UNIT"

export interface StaffCourseDetail {
  id: string
  title: string
  description: string
  duration: number
  level: string
  image: string | null
  requirement: string | null
  status: CourseStatus
  prerequisiteCourseId: string | null
  topics: Topic[]
  exams: Exam[]
  chapters: Chapter[]
  enrollmentCount?: number
  rating?: number
}

export interface Topic {
  id: number
  name: string
}

export interface Exam {
  id: string
  title: string
  description: string
  duration: number
  examScopeType: ExamScopeType
  createdAt: string
}

export interface Chapter {
  id: string
  title: string
  description: string
  status: CourseStatus
  courseId: string
  prerequisiteChapterId: string | null
  exams: Exam[]
  units: Unit[]
}

export interface Unit {
  id: string
  title: string
  description: string
  status: CourseStatus
  chapterId: string
  prerequisiteUnitId: string | null
  exams: Exam[]
}

export interface CourseDetailResponse {
  course: StaffCourseDetail
}

export interface ChapterDetail {
  id: string
  title: string
  description: string
  status: CourseStatus
  courseId: string
  prerequisiteChapterId: string | null
  exams: Exam[]
  units: Unit[]
}

export interface UnitDetail {
  id: string
  title: string
  description: string
  status: CourseStatus
  chapterId: string
  prerequisiteUnitId: string | null
  exams: Exam[]
}

export interface CreateCourseRequest {
  id?: string
  title: string
  description: string
  duration: number
  level: string
  image?: string
  requirement?: string
  status?: "INACTIVE" | "ACTIVE"
  prerequisiteCourseId?: string
  topics?: Topic[]
  exams?: Exam[]
  chapters?: Chapter[]
}

export interface UpdateCourseRequest {
  id: string
  title: string
  description: string
  duration: number
  level: string
  image?: string
  requirement?: string
  prerequisiteCourseId?: string
  topicIds?: number[]
  examIds?: string[]
}

export interface CreateChapterRequest {
  id?: string
  title: string
  description: string
  status?: CourseStatus
  courseId: string
  prerequisiteChapterId?: string | null
  exams?: Exam[]
  units?: Unit[]
}

export interface UpdateChapterRequest {
  id: string
  title: string
  description: string
  status: CourseStatus
  courseId: string
  prerequisiteChapterId?: string
  exams?: Exam[]
  units?: Unit[]
}

export interface CreateUnitRequest {
  id?: string
  title: string
  description: string
  status?: "INACTIVE" | "ACTIVE"
  chapterId: string
  prerequisiteUnitId?: string
  exams?: Exam[]
}

export interface UpdateUnitRequest {
  id: string
  title: string
  description: string
  status: "INACTIVE" | "ACTIVE"
  chapterId: string
  prerequisiteUnitId?: string
  exams?: Exam[]
}
