import api from '../api/axios';
import type { LearningPath } from '../types/roadmap';
import type { AxiosError } from 'axios';

class LearningPathService {
  // Lấy chi tiết learning path theo ID
  async getLearningPathDetail(id: number): Promise<{ data: LearningPath }> {
    try {
      console.log('Calling getLearningPathDetail with ID:', id);
      const response = await api.get(`/learning-paths/${id}`);
      console.log('getLearningPathDetail success:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching learning path detail:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Error response data:', axiosError.response.data);
        console.error('Error response status:', axiosError.response.status);
      }
      throw error;
    }
  }

  // Cập nhật status của learning path
  async updateLearningPathStatus(id: number, status: string): Promise<{ success: boolean; message: string; data: string; timestamp: number }> {
    try {
      console.log('Calling updateLearningPathStatus with ID:', id, 'and status:', status);
      const response = await api.put(`/learning-paths/${id}/status`, { status });
      console.log('updateLearningPathStatus success:', response.data);
      return response.data as { success: boolean; message: string; data: string; timestamp: number };
    } catch (error) {
      console.error('Error updating learning path status:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Error response data:', axiosError.response.data);
        console.error('Error response status:', axiosError.response.status);
      }
      throw error;
    }
  }
}

export const learningPathService = new LearningPathService();
export default learningPathService;
