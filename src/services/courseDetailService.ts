import api from '../api/axios';
import type { CourseDetailApiResponse } from '../types/courseDetail';

export class CourseDetailService {
  static async getCourseDetail(courseId: string): Promise<CourseDetailApiResponse> {
    try {
      console.log('Calling real API for course:', courseId);
      const response = await api.get(`/courses/${courseId}/detail`);
      
      console.log('Raw API response:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error fetching course detail:', error);
      
      // Trả về thông báo lỗi nếu API thất bại
      return {
        success: false,
        message: 'Không thể tải thông tin khóa học. Vui lòng thử lại sau.',
        data: { 
          course: {
            id: '',
            title: '',
            description: '',
            duration: 0,
            level: '',
            image: null,
            requirement: null,
            status: '',
            prerequisiteCourseId: null,
            topics: [],
            exams: [],
            chapters: []
          }
        },
        timestamp: Date.now()
      };
    }
  }
}
