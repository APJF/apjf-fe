import type { 
  CourseFilters, 
  TopCoursesApiResponse, 
  AllCoursesApiResponse,
  CourseDetailApiResponse,
  ChaptersApiResponse,
  CreateCourseRequest,
  CreateCourseApiResponse,
  CreateChapterRequest,
  CreateChapterApiResponse,
  ChapterDetailApiResponse,
  UnitsApiResponse,
  CreateUnitRequest,
  CreateUnitApiResponse
} from '../types/course';
import api from '../api/axios';

export class CourseService {
    // Get course detail by ID (new API)
  static async getCourseDetail(courseId: string): Promise<CourseDetailApiResponse> {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  }

  // Get chapters by course ID  
  static async getChaptersByCourseId(courseId: string): Promise<ChaptersApiResponse> {
    const response = await api.get(`/courses/${courseId}/chapters`);
    return response.data;
  }

  // Get all courses for public (status ACTIVE only)
  static async getCourses(filters: CourseFilters = {}): Promise<AllCoursesApiResponse> {
    const params = {
      page: filters.page || 0,
      size: filters.size || 12,
      sortBy: filters.sortBy || 'title',
      direction: filters.sortDirection || 'asc',
      status: 'ACTIVE',
      title: filters.searchTitle?.trim(),
      level: filters.level,
    };

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params];
      }
    });

    const response = await api.get('/courses', { params });
    return response.data;
  }

  // Get all courses for staff (returns simple array as per API spec)
  static async getAllCoursesForStaff(filters: CourseFilters = {}): Promise<AllCoursesApiResponse> {
    const params = {
      title: filters.searchTitle?.trim(),
      level: filters.level,
      // API returns all courses without pagination or status filtering
    };

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params];
      }
    });

    const response = await api.get('/courses', { params });
    return response.data;
  }

  // Create a new course (for staff)
  static async createCourse(courseData: CreateCourseRequest): Promise<CreateCourseApiResponse> {
    const response = await api.post('/courses', courseData);
    return response.data;
  }

  static async getTopCourses(): Promise<TopCoursesApiResponse> {
    const response = await api.get('/courses/top-courses');
    return response.data;
  }

  static async getTopRatedCourses(): Promise<TopCoursesApiResponse> {
    const response = await api.get('/courses/top-rated');
    return response.data;
  }

  // Create a new chapter (for staff)
  static async createChapter(chapterData: CreateChapterRequest): Promise<CreateChapterApiResponse> {
    const response = await api.post('/chapters', chapterData);
    return response.data;
  }

  // Get chapter detail by ID (new API)
  static async getChapterDetail(chapterId: string): Promise<ChapterDetailApiResponse> {
    const response = await api.get(`/chapters/${chapterId}`);
    return response.data;
  }

  // Get units by chapter ID (new API)
  static async getUnitsByChapterId(chapterId: string): Promise<UnitsApiResponse> {
    const response = await api.get(`/chapters/${chapterId}/units`);
    return response.data;
  }

  // Create a new unit (for staff)
  static async createUnit(unitData: CreateUnitRequest): Promise<CreateUnitApiResponse> {
    const response = await api.post('/units', unitData);
    return response.data;
  }

  // Old API for backward compatibility
  static async getCourseById(id: string) {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  }
}
