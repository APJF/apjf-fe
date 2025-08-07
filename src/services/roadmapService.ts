import api from '../api/axios';
import type { LearningPath, RoadmapModule, RoadmapStats } from '../types/roadmap';
import type { AxiosError } from 'axios';

class RoadmapService {
  // Lấy danh sách lộ trình học của user
  async getUserRoadmaps(): Promise<{ data: LearningPath[] }> {
    try {
      console.log('🚀 [roadmapService] Calling getUserRoadmaps - START');
      console.log('🚀 [roadmapService] API base URL:', api.defaults.baseURL);
      console.log('🚀 [roadmapService] Request URL: /learning-paths');
      
      const response = await api.get('/learning-paths');
      
      console.log('✅ [roadmapService] getUserRoadmaps - SUCCESS');
      console.log('✅ [roadmapService] Response status:', response.status);
      console.log('✅ [roadmapService] Response data:', response.data);
      console.log('✅ [roadmapService] Response data type:', typeof response.data);
      console.log('✅ [roadmapService] Response data.data:', response.data?.data);
      console.log('✅ [roadmapService] Response data.data type:', typeof response.data?.data);
      console.log('✅ [roadmapService] Response data.data length:', Array.isArray(response.data?.data) ? response.data.data.length : 'NOT AN ARRAY');
      
      return response.data;
    } catch (error) {
      console.error('❌ [roadmapService] Error fetching user roadmaps:', error);
      console.error('❌ [roadmapService] Error type:', typeof error);
      console.error('❌ [roadmapService] Error name:', (error as Error)?.name);
      console.error('❌ [roadmapService] Error message:', (error as Error)?.message);
      
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('❌ [roadmapService] Error response status:', axiosError.response.status);
        console.error('❌ [roadmapService] Error response data:', axiosError.response.data);
        console.error('❌ [roadmapService] Error response data (stringified):', JSON.stringify(axiosError.response.data, null, 2));
        console.error('❌ [roadmapService] Error response headers:', axiosError.response.headers);

        // Check for specific user null error from backend
        const responseData = axiosError.response.data as { message?: string };
        if (axiosError.response.status === 400 && 
            responseData?.message?.includes('because "user" is null')) {
          console.error('🚨 [roadmapService] User is null in backend - token invalid, clearing auth data');
          localStorage.clear();
          window.location.href = '/login';
          throw new Error('User session invalid - redirecting to login');
        }
      } else if (axiosError.request) {
        console.error('❌ [roadmapService] Error request:', axiosError.request);
      }
      
      throw error;
    }
  }

  // Đặt lộ trình thành đang học (STUDYING) và các lộ trình khác về PENDING
  async setLearningPathActive(id: number): Promise<{ data: LearningPath }> {
    try {
      console.log('Calling setLearningPathActive with ID:', id);
      const response = await api.put(`/learning-paths/${id}/active`);
      console.log('setLearningPathActive success:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error setting learning path to active:', error);
      // Log thêm thông tin về response error nếu có
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Error response data:', axiosError.response.data);
        console.error('Error response status:', axiosError.response.status);
      }
      throw error;
    }
  }

  // Lấy lộ trình đang học (STUDYING)
  async getActiveLearningPath(): Promise<{ data: LearningPath | null }> {
    try {
      const allPaths = await this.getUserRoadmaps();
      const activePath = allPaths.data.find((path: LearningPath) => path.status === 'STUDYING');
      return { data: activePath || null };
    } catch (error) {
      console.error('Error getting active learning path:', error);
      throw error;
    }
  }

  // Lấy chi tiết lộ trình học theo ID
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

  // Reorder courses trong learning path
  async reorderLearningPathCourses(learningPathId: number, courseIds: string[]): Promise<{ success: boolean; message: string; data: string; timestamp: number }> {
    try {
      console.log('Calling reorderLearningPathCourses with ID:', learningPathId, 'and courseIds:', courseIds);
      const response = await api.put(`/learning-paths/${learningPathId}/reorder`, courseIds);
      console.log('reorderLearningPathCourses success:', response.data);
      return response.data as { success: boolean; message: string; data: string; timestamp: number };
    } catch (error) {
      console.error('Error reordering learning path courses:', error);
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Error response data:', axiosError.response.data);
        console.error('Error response status:', axiosError.response.status);
      }
      throw error;
    }
  }

  // Lấy thống kê lộ trình học
  async getRoadmapStats(): Promise<{ data: RoadmapStats }> {
    try {
      const response = await api.get('/roadmaps/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching roadmap stats:', error);
      throw error;
    }
  }

  // Lấy chi tiết một lộ trình
  async getRoadmapDetail(roadmapId: number): Promise<{ data: RoadmapModule }> {
    // NOTE: API not implemented yet, returning mock data
    // try {
    //   const response = await axios.get(`/roadmaps/${roadmapId}`, {
    //     headers: this.getHeaders()
    //   });
    //   return response.data;
    // } catch (error) {
    //   console.error('Error fetching roadmap detail:', error);
    //   throw error;
    // }
    
    // Return mock data for now
    return Promise.resolve({ 
      data: {
        id: roadmapId,
        title: "Lộ trình JLPT N5 - Cơ bản",
        description: "Lộ trình học từng bước từ cơ bản đến nâng cao. Hiragana, Katakana và ngữ pháp cơ bản",
        level: "N5" as const,
        progress: 11,
        totalLessons: 45,
        completedLessons: 5,
        estimatedTime: "3 tháng",
        difficulty: "Cơ bản" as const,
        status: "in_progress" as const,
        skills: ["Hiragana", "Katakana", "Từ vựng cơ bản", "Ngữ pháp N5"],
        rating: 4.8,
        reviews: 1250,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  }

  // Tạo lộ trình mới
  async createRoadmap(roadmapData: Omit<RoadmapModule, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: RoadmapModule }> {
    try {
      const response = await api.post('/roadmaps', roadmapData);
      return response.data;
    } catch (error) {
      console.error('Error creating roadmap:', error);
      throw error;
    }
  }

  // Cập nhật tiến độ lộ trình
  async updateRoadmapProgress(roadmapId: number, progress: number): Promise<{ data: RoadmapModule }> {
    try {
      const response = await api.patch(`/roadmaps/${roadmapId}/progress`, { progress });
      return response.data;
    } catch (error) {
      console.error('Error updating roadmap progress:', error);
      throw error;
    }
  }

  // Xóa lộ trình
  async deleteRoadmap(roadmapId: number): Promise<void> {
    try {
      await api.delete(`/roadmaps/${roadmapId}`);
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      throw error;
    }
  }
}

export const roadmapService = new RoadmapService();
export default roadmapService;
