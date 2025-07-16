import type { CourseApiResponse, CourseFilters } from '../types/course';

const API_BASE_URL = 'http://localhost:8080/api';

export class CourseService {
  static async getCourses(filters: CourseFilters = {}): Promise<CourseApiResponse> {
    const params = new URLSearchParams();
    
    // Set default values
    params.append('page', (filters.page || 0).toString());
    params.append('size', (filters.size || 12).toString());
    params.append('sortBy', filters.sortBy || 'title');
    params.append('direction', filters.sortDirection || 'asc');
    
    // Only show published courses
    params.append('status', 'PUBLISHED');
    
    // Add optional filters
    if (filters.searchTitle?.trim()) {
      params.append('title', filters.searchTitle.trim());
    }
    
    if (filters.level) {
      params.append('level', filters.level);
    }

    const response = await fetch(`${API_BASE_URL}/courses?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: CourseApiResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Không thể tải danh sách khóa học');
    }
    
    return data;
  }

  static async getCourseById(id: string) {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Không thể tải thông tin khóa học');
    }
    
    return data;
  }
}
