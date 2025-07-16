import type { CourseDetailApiResponse } from '../types/courseDetail';

const API_BASE_URL = 'http://localhost:8080/api';

export class CourseDetailService {
  static async getCourseDetail(courseId: string): Promise<CourseDetailApiResponse> {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: CourseDetailApiResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Không thể tải thông tin khóa học');
    }
    
    return data;
  }
}
