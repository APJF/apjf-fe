import api from '../api/axios';
import type { 
  Question, 
  CreateQuestionRequest, 
  UpdateQuestionRequest, 
  QuestionsResponse, 
  QuestionResponse,
  PagedQuestions
} from '../types/question';

// Interface for creating options
interface CreateOptionRequest {
  id: string;
  content: string;
  isCorrect: boolean;
}

// Interface for updating options
interface UpdateOptionRequest {
  id: string;
  content: string;
  isCorrect: boolean;
}

export class QuestionService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  static async getAllQuestions(
    page: number = 0, 
    size: number = 10,
    questionId?: string,
    unitId?: string
  ): Promise<PagedQuestions> {
    try {
      const params: Record<string, any> = { page, size };
      if (questionId) params.questionId = questionId;
      if (unitId) params.unitId = unitId;

      const response = await api.get<QuestionsResponse>(
        '/questions',
        { 
          headers: this.getAuthHeaders(),
          params
        }
      );
      
      if (response.data.success) {
        // Return the full PagedQuestions object with pagination info
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: unknown) {
      console.error('Error fetching questions:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Không thể tải danh sách câu hỏi');
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

  /**
   * Get a single question by ID with full details
   * GET /api/questions/{id}
   */
  static async getQuestionById(id: string): Promise<Question> {
    try {
      const response = await api.get<{ success: boolean; data: Question; message: string }>(
        `/questions/${id}`,
        { headers: this.getAuthHeaders() }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: unknown) {
      console.error('Error fetching question by ID:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Không thể tải chi tiết câu hỏi');
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
    } catch (error: unknown) {
      console.error('Error creating question:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Không thể tạo câu hỏi');
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
    } catch (error: unknown) {
      console.error('Error updating question:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Không thể cập nhật câu hỏi');
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
    } catch (error: unknown) {
      console.error('Error deleting question:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Không thể xóa câu hỏi');
    }
  }

  /**
   * Create an option for a question
   * POST /api/questions/{questionId}/options
   */
  static async createQuestionOption(questionId: string, optionData: CreateOptionRequest): Promise<void> {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/questions/${questionId}/options`,
        optionData,
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
    } catch (error: unknown) {
      console.error('Error creating question option:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Không thể tạo lựa chọn câu hỏi');
    }
  }

  /**
   * Update an option
   * PUT /api/options/{optionId}
   */
  static async updateQuestionOption(optionId: string, optionData: UpdateOptionRequest): Promise<void> {
    try {
      const response = await api.put<{ success: boolean; message: string }>(
        `/options/${optionId}`,
        optionData,
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
    } catch (error: unknown) {
      console.error('Error updating question option:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Không thể cập nhật lựa chọn câu hỏi');
    }
  }

  /**
   * Delete an option
   * DELETE /api/options/{optionId}
   */
  static async deleteQuestionOption(optionId: string): Promise<void> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/options/${optionId}`,
        { headers: this.getAuthHeaders() }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
    } catch (error: unknown) {
      console.error('Error deleting question option:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      throw new Error(axiosError.response?.data?.message || 'Không thể xóa lựa chọn câu hỏi');
    }
  }
}
