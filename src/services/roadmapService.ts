import axios from '../api/axios';

export interface RoadmapModule {
  id: number;
  title: string;
  description: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  progress: number;
  totalLessons: number;
  completedLessons: number;
  estimatedTime: string;
  difficulty: "Cơ bản" | "Trung bình" | "Nâng cao";
  status: "not_started" | "in_progress" | "completed";
  skills: string[];
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapStats {
  totalModules: number;
  inProgress: number;
  completed: number;
  averageProgress: number;
}

class RoadmapService {
  private getHeaders() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('access_token');
    
    return {
      'Authorization': `Bearer ${token}`,
      'X-User-Id': user.id?.toString() || '',
      'Content-Type': 'application/json'
    };
  }

  // Lấy danh sách lộ trình học của user
  async getUserRoadmaps(): Promise<{ data: RoadmapModule[] }> {
    // API implementation pending - currently returning mock data
    // try {
    //   const response = await axios.get('/roadmaps/user', {
    //     headers: this.getHeaders()
    //   });
    //   return response.data;
    // } catch (error) {
    //   console.error('Error fetching user roadmaps:', error);
    //   throw error;
    // }
    
    // Return mock data for now
    return Promise.resolve({ data: [] });
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
