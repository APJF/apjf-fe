import axios from '../api/axios';
import type { LearningPath, RoadmapModule, RoadmapStats } from '../types/roadmap';

class RoadmapService {
  private getHeaders() {
    // Sử dụng access_token theo convention
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Lấy danh sách lộ trình học của user
  async getUserRoadmaps(): Promise<{ data: LearningPath[] }> {
    try {
      const response = await axios.get('/api/learning-paths', {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user roadmaps:', error);
      throw error;
    }
  }

  // Đặt lộ trình thành đang học (STUDYING)
  async setLearningPathActive(id: number): Promise<{ data: LearningPath }> {
    try {
      const response = await axios.put(`/api/learning-paths/${id}/active`, {}, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error setting learning path to active:', error);
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

  // Lấy thống kê lộ trình học
  async getRoadmapStats(): Promise<{ data: RoadmapStats }> {
    try {
      const response = await axios.get('/roadmaps/stats', {
        headers: this.getHeaders()
      });
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
      const response = await axios.post('/roadmaps', roadmapData, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating roadmap:', error);
      throw error;
    }
  }

  // Cập nhật tiến độ lộ trình
  async updateRoadmapProgress(roadmapId: number, progress: number): Promise<{ data: RoadmapModule }> {
    try {
      const response = await axios.patch(`/roadmaps/${roadmapId}/progress`, 
        { progress },
        {
          headers: this.getHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating roadmap progress:', error);
      throw error;
    }
  }

  // Xóa lộ trình
  async deleteRoadmap(roadmapId: number): Promise<void> {
    try {
      await axios.delete(`/roadmaps/${roadmapId}`, {
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      throw error;
    }
  }
}

export const roadmapService = new RoadmapService();
export default roadmapService;
