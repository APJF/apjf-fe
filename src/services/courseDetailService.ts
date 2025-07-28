import api from '../api/axios';
import type { ChapterDetailApiResponse, Unit } from '../types/course'; // Sửa import

// Định nghĩa kiểu cho response của API units
interface UnitsApiResponse {
  success: boolean;
  message: string;
  data: Unit[];
  timestamp: number;
}

export class CourseDetailService {
  static async getChapterDetail(chapterId: string): Promise<ChapterDetailApiResponse> {
    const response = await api.get(`/chapters/${chapterId}`);
    return response.data;
  }

  static async getUnitsByChapterId(chapterId: string): Promise<UnitsApiResponse> {
    const response = await api.get(`/units/chapter/${chapterId}`);
    return response.data;
  }
}
