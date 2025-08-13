import axiosInstance from '../api/axios';

export interface Unit {
  id: string;
  title: string;
  chapterId: string;
  courseId: string;
}

export interface UnitsResponse {
  success: boolean;
  message: string;
  data: Unit[];
  timestamp: number;
}

export class UnitService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  static async getAllUnits(): Promise<Unit[]> {
    try {
      const response = await axiosInstance.get<UnitsResponse>(
        '/units',
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: unknown) {
      console.error('Error fetching units:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Không thể tải danh sách units');
    }
  }
}
