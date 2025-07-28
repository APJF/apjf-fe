import type { CourseApiResponse, CourseFilters, TopCoursesApiResponse } from '../types/course';
import api from '../api/axios';

export class CourseService {
  static async getChaptersByCourseId(courseId: string) {
    const response = await api.get(`/chapters/course/${courseId}`);
    return response.data;
  }
  static async getCourses(filters: CourseFilters = {}): Promise<CourseApiResponse> {
    const params = {
      page: filters.page || 0,
      size: filters.size || 12,
      sortBy: filters.sortBy || 'title',
      direction: filters.sortDirection || 'asc',
      status: 'PUBLISHED',
      title: filters.searchTitle?.trim(),
      level: filters.level,
    };

    const response = await api.get('/courses', { params });
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

  // New method for staff to get all courses regardless of status
  static async getAllCoursesForStaff(filters: CourseFilters = {}): Promise<CourseApiResponse> {
    const params = new URLSearchParams();

    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('direction', filters.sortDirection);
    if (filters.searchTitle?.trim()) params.append('title', filters.searchTitle.trim());
    if (filters.level) params.append('level', filters.level);

    const response = await api.get(`/courses?${params.toString()}`);
    return response.data;
  }

  static async getCourseById(id: string) {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  }
}
