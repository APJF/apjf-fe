import api from "../api/axios";

export interface LearningPathCourse {
  courseId: string;
  learningPathId: number;
  courseOrderNumber: number;
  title: string;
  description: string | null;
  duration: number;
  level: string;
  courseProgress?: {
    completed: boolean;
    percent: number;
  } | null;
}

// Interface for the new active learning path API
export interface ActiveLearningPathCourse {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  image: string;
  requirement: string;
  status: string;
  prerequisiteCourseId: string;
  topics: Array<{
    id: number;
    name: string;
  }>;
  averageRating: number;
  courseProgress: {
    completed: boolean;
    percent: number;
  };
  courseOrderNumber: number;
}

export interface ActiveLearningPath {
  id: number;
  title: string;
  description: string;
  targetLevel: string;
  primaryGoal: string;
  focusSkill: string;
  status: string;
  duration: number;
  userId: number;
  username: string;
  createdAt: string;
  lastUpdatedAt: string;
  isCompleted: boolean;
  percent: number;
  courses: ActiveLearningPathCourse[];
}

export interface ActiveLearningPathResponse {
  success: boolean;
  message: string;
  data: ActiveLearningPath;
  timestamp: number;
}

export interface LearningPath {
  id: number;
  title: string;
  description: string;
  targetLevel: string;
  primaryGoal: string;
  focusSkill: string;
  status: "PENDING" | "STUDYING" | "FINISHED";
  duration: number;
  userId: number;
  username: string;
  createdAt: string;
  lastUpdatedAt: string;
  isCompleted: boolean;
  percent: number;
  courses: LearningPathCourse[];
}

export interface LearningPathResponse {
  success: boolean;
  message: string;
  data: LearningPath[];
  timestamp: number;
}

export interface CreateLearningPathData {
  title: string;
  description: string;
  targetLevel: string;
  primaryGoal: string;
  focusSkill: string;
  duration: number;
}

export interface UpdateLearningPathData {
  title?: string;
  description?: string;
  targetLevel?: string;
  primaryGoal?: string;
  focusSkill?: string;
  duration?: number;
}

class LearningPathService {
  /**
   * Lấy danh sách tất cả learning paths của user
   */
  async getUserLearningPaths(): Promise<LearningPathResponse> {
    try {
      console.log('🔍 Fetching user learning paths...');
      const response = await api.get<LearningPathResponse>("/learning-paths");
      console.log('✅ Learning paths response:', response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching learning paths:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: LearningPathResponse; status?: number } };
        console.error("❌ API Error details:", {
          status: axiosError.response?.status,
          data: axiosError.response?.data
        });
        if (axiosError.response?.data) {
          return axiosError.response.data;
        }
      }
      throw error;
    }
  }

  /**
   * Lấy chi tiết một learning path
   */
  async getLearningPath(id: number): Promise<{ success: boolean; message: string; data: LearningPath; timestamp: number }> {
    try {
      const response = await api.get<{ success: boolean; message: string; data: LearningPath; timestamp: number }>(`/learning-paths/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching learning path:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { success: boolean; message: string; data: LearningPath; timestamp: number } } };
        if (axiosError.response?.data) {
          return axiosError.response.data;
        }
      }
      throw error;
    }
  }

  /**
   * Tạo learning path mới
   */
  async createLearningPath(data: CreateLearningPathData): Promise<{ success: boolean; message: string; data: LearningPath; timestamp: number }> {
    try {
      const response = await api.post<{ success: boolean; message: string; data: LearningPath; timestamp: number }>("/learning-paths", data);
      return response.data;
    } catch (error) {
      console.error("Error creating learning path:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { success: boolean; message: string; data: LearningPath; timestamp: number } } };
        if (axiosError.response?.data) {
          return axiosError.response.data;
        }
      }
      throw error;
    }
  }

  /**
   * Cập nhật learning path
   */
  async updateLearningPath(id: number, data: UpdateLearningPathData): Promise<{ success: boolean; message: string; data: LearningPath; timestamp: number }> {
    try {
      const response = await api.put<{ success: boolean; message: string; data: LearningPath; timestamp: number }>(`/learning-paths/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating learning path:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { success: boolean; message: string; data: LearningPath; timestamp: number } } };
        if (axiosError.response?.data) {
          return axiosError.response.data;
        }
      }
      throw error;
    }
  }

  /**
   * Xóa learning path
   */
  async deleteLearningPath(id: number): Promise<{ success: boolean; message: string; timestamp: number }> {
    try {
      const response = await api.delete<{ success: boolean; message: string; timestamp: number }>(`/learning-paths/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting learning path:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { success: boolean; message: string; timestamp: number } } };
        if (axiosError.response?.data) {
          return axiosError.response.data;
        }
      }
      throw error;
    }
  }

  /**
   * Đặt learning path thành trạng thái active (STUDYING)
   */
  async setLearningPathActive(id: number): Promise<{ success: boolean; message: string; data: LearningPath; timestamp: number }> {
    try {
      console.log(`📚 Setting learning path ${id} as active...`);
      const response = await api.put<{ success: boolean; message: string; data: LearningPath; timestamp: number }>(`/learning-paths/${id}/active`);
      
      if (response.data.success) {
        console.log(`✅ Learning path ${id} set as active successfully`);
      }
      
      return response.data;
    } catch (error) {
      console.error("Error setting learning path active:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { success: boolean; message: string; data: LearningPath; timestamp: number } } };
        if (axiosError.response?.data) {
          return axiosError.response.data;
        }
      }
      throw error;
    }
  }

  /**
   * Lấy learning path đang active (STUDYING) với thông tin chi tiết về courses và progress
   */
  async getActiveLearningPath(): Promise<ActiveLearningPathResponse> {
    try {
      console.log('🔍 Fetching active learning path...');
      const response = await api.get<ActiveLearningPathResponse>("/learning-paths/active");
      console.log('✅ Active learning path response:', response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching active learning path:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: ActiveLearningPathResponse; status?: number } };
        console.error("❌ API Error details:", {
          status: axiosError.response?.status,
          data: axiosError.response?.data
        });
        if (axiosError.response?.data) {
          return axiosError.response.data;
        }
      }
      throw error;
    }
  }
}

export const learningPathService = new LearningPathService();
export default learningPathService;