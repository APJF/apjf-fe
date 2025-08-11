import axiosInstance from '../api/axios';
import type { 
  Question, 
  CreateQuestionRequest, 
  UpdateQuestionRequest, 
  QuestionsResponse, 
  QuestionResponse 
} from '../types/question';

export class QuestionService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  static async getAllQuestions(): Promise<Question[]> {
    try {
      const response = await axiosInstance.get<QuestionsResponse>(
        '/questions',
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách câu hỏi');
    }
  }

  static async createQuestion(questionData: CreateQuestionRequest): Promise<Question> {
    try {
      const response = await axiosInstance.post<QuestionResponse>(
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
      const response = await axiosInstance.put<QuestionResponse>(
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
      const response = await axiosInstance.delete<{ success: boolean; message: string }>(
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
