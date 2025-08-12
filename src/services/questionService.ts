import api from '../api/axios';
import type { 
  Question, 
  CreateQuestionRequest, 
  UpdateQuestionRequest, 
  QuestionsResponse, 
  QuestionResponse,
  PagedQuestions 
} from '../types/question';

export class QuestionService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  static async getAllQuestions(page: number = 0, size: number = 10): Promise<PagedQuestions> {
    try {
      const response = await api.get<QuestionsResponse>(
        '/questions',
        { 
          headers: this.getAuthHeaders(),
          params: { page, size }
        }
      );
      
      if (response.data.success) {
        // Return the full PagedQuestions object with pagination info
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách câu hỏi');
    }
  }

  /**
   * Get all questions without pagination (for backward compatibility)
   */
  static async getAllQuestionsSimple(): Promise<Question[]> {
    try {
      const pagedData = await this.getAllQuestions(0, 1000); // Get a large page
      return pagedData.content;
    } catch (error) {
      console.error('Error fetching simple questions list:', error);
      throw error;
    }
  }

  static async createQuestion(questionData: CreateQuestionRequest): Promise<Question> {
    try {
      const response = await api.post<QuestionResponse>(
        '/questions',
        questionData,
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error creating question:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo câu hỏi');
    }
  }

  static async updateQuestion(id: string, questionData: UpdateQuestionRequest): Promise<Question> {
    try {
      const response = await api.put<QuestionResponse>(
        `/questions/${id}`,
        questionData,
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error updating question:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật câu hỏi');
    }
  }

  static async deleteQuestion(id: string): Promise<void> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/questions/${id}`,
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error deleting question:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa câu hỏi');
    }
  }
}
