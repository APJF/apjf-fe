import type { CourseDetailApiResponse } from '../types/courseDetail';
// import api from '../api/axios'; // Sẽ sử dụng khi cần gọi API thực
import { mockCourses } from './mockCourseData';

export class CourseDetailService {
  static async getCourseDetail(courseId: string): Promise<CourseDetailApiResponse> {
    try {
      console.log('Request course detail for ID:', courseId);
      
      // Sử dụng mockData nếu có
      if (mockCourses[courseId]) {
        console.log('Using mock data for course:', courseId);
        // Trì hoãn 500ms để mô phỏng API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return mockCourses[courseId];
      }
      
      // Nếu không tìm thấy ID chính xác, kiểm tra xem ID có phải được generate tự động từ backend không
      // ID từ API thực có thể không khớp với pattern "course-*" trong mockData
      // Luôn sử dụng mock data có sẵn để đảm bảo hiển thị được nội dung
      console.log('Course ID not found in mock data, using default mock data');
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockCourses['course-n5-01'];
      
      /* Tạm thời ẩn gọi API thực vì đang sử dụng mock data
      console.log('Calling real API for course:', courseId);
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
      */
    } catch (error) {
      console.error('Error fetching course detail:', error);
      
      // Nếu không có mock data và API thất bại, trả về thông báo lỗi
      return {
        success: false,
        message: 'Không thể tải thông tin khóa học. Vui lòng thử lại sau. Mã lỗi: ' + 
                (error instanceof Error ? error.message : 'Unknown'),
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
