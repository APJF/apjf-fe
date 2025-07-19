import type { CourseApiResponse, CourseFilters } from '../types/course';
import api from '../api/axios';

export class CourseService {
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

  static async getCourseById(id: string) {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  }
}
