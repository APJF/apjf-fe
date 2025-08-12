import api from '../api/axios';
import type { 
  ExamOverview,
  ExamStartResponse, 
  ExamSubmitResponse,
  ExamSubmitRequest,
  ExamResult,
  QuestionOption
} from '../types/exam';

// Submit answer type for exam submission
interface SubmitAnswer {
  questionId: string;
  selectedOptionId: string | null;
  userAnswer: string | null;
}

export class ExamService {
  /**
   * Lấy thông tin tổng quan về bài thi (preparation page)
   * GET /api/student/exams/{examId}/overview
   */
  static async getExamOverview(examId: string): Promise<ExamOverview> {
    try {
      console.log('🔍 Fetching exam overview for ID:', examId);
      const response = await api.get(`/student/exams/${examId}/overview`);
      console.log('✅ Exam overview response:', response.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (response.data?.success && response.data?.data) {
        console.log('📦 Found data in response.data.data');
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching exam overview:', error);
      throw error;
    }
  }

  /**
   * Test method để kiểm tra kết nối API
   */
  static async testConnection(): Promise<void> {
    try {
      console.log('🧪 Testing API connection...');
      const response = await api.get('/exams');
      console.log('✅ API connection successful:', response.status);
    } catch (error) {
      console.error('❌ API connection failed:', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết về bài thi
   */
  static async getExamDetail(examId: string): Promise<ExamOverview> {
    try {
      const response = await api.get(`/exams/${examId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exam detail:', error);
      throw error;
    }
  }

  /**
   * Debug method - Kiểm tra user data và token
   */
  static debugUserAuth(): void {
    console.log('🔍 === DEBUG USER AUTH ===');
    
    // Check user data
    const userJson = localStorage.getItem('user');
    console.log('Raw user JSON:', userJson);
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        console.log('Parsed user:', user);
        console.log('User ID:', user.id);
        console.log('User email:', user.email);
      } catch (e) {
        console.error('Failed to parse user JSON:', e);
      }
    } else {
      console.log('No user data in localStorage');
    }
    
    // Check tokens
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    console.log('Access token exists:', !!accessToken);
    console.log('Access token preview:', accessToken?.substring(0, 50) + '...');
    console.log('Refresh token exists:', !!refreshToken);
    
    console.log('🔍 === END DEBUG ===');
  }

  /**
   * Bắt đầu làm bài thi - API endpoint chuẩn
   * POST /api/student/exams/{examId}/start
   */
  static async startExam(examId: string): Promise<ExamStartResponse> {
    try {
      console.log('🔍 Starting exam with ID:', examId);
      const response = await api.post(`/student/exams/${examId}/start`);
      console.log('✅ Start exam response:', response.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (response.data?.success && response.data?.data) {
        console.log('📦 Found data in response.data.data');
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      return response.data;
    } catch (error) {
      console.error('❌ Error starting exam:', error);
      throw error;
    }
  }

  /**
   * SIMPLE test - chỉ log và thử nghiệm cơ bản với endpoint chính xác
   */
  static async simpleStartExam(examId: string): Promise<ExamStartResponse> {
    console.log('=== START EXAM ===');
    console.log('ExamId:', examId);
    
    // Get userId from localStorage
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    console.log('User data:', userJson);
    console.log('Has token:', !!token);
    
    let userId = '2'; // fallback default
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        userId = user.id || '2';
      } catch (e) {
        console.warn('Failed to parse user data:', e);
      }
    }
    
    console.log('Using userId:', userId);
    
    // Use the correct endpoint from API documentation
    try {
      const url = `/exam-results/exams/${examId}/start?userId=${userId}`;
      console.log('Making POST request to:', url);
      const response = await api.post(url);
      console.log('SUCCESS - Start exam:', response.data);
      return response.data;
    } catch (error) {
      console.error('Start exam failed:', error);
      throw error;
    }
  }

  /**
   * Nộp bài thi với endpoint chính xác từ API docs
   */
  static async debugSubmitExam(examId: string, answers: SubmitAnswer[]): Promise<ExamSubmitResponse> {
    console.log('🧪 SUBMIT EXAM');
    console.log('ExamId:', examId);
    console.log('Original answers:', answers);
    
    // Get userId from localStorage
    const userJson = localStorage.getItem('user');
    let userId = '2'; // fallback default
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        userId = user.id || '2';
      } catch (e) {
        console.warn('Failed to parse user data:', e);
      }
    }
    
    // Transform answers to server format
    const formattedAnswers = answers.map(answer => ({
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId || null,
      userAnswer: answer.userAnswer || null
    }));
    
    const requestBody = {
      examId: examId,
      answers: formattedAnswers
    };
    
    console.log('Formatted request body:', JSON.stringify(requestBody, null, 2));
    console.log('Using userId:', userId);
    
    // Use the correct endpoint from API documentation
    try {
      const url = `/exam-results/exams/${examId}/submit?userId=${userId}`;
      console.log('Making POST request to:', url);
      const response = await api.post(url, requestBody);
      console.log('✅ SUCCESS:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Submit exam failed:', error);
      throw error;
    }
  }

  /**
   * Nộp bài thi - API endpoint chuẩn
   * POST /api/student/exams/submit
   */
  static async submitExam(examId: string, startedAt: string | null, submittedAt: string, answers: SubmitAnswer[]): Promise<ExamSubmitResponse> {
    try {
      console.log('🔍 Submitting exam:', examId);
      console.log('📝 Answers:', answers);
      console.log('⏰ Started at:', startedAt);
      console.log('⏰ Submitted at:', submittedAt);

      // Format answers for API according to new structure
      const formattedAnswers = answers.map(answer => ({
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId || null,
        userAnswer: answer.userAnswer || null
      }));

      const requestBody: ExamSubmitRequest = {
        examId: examId,
        startedAt: startedAt,
        submittedAt: submittedAt,
        questionResults: formattedAnswers
      };

      console.log('📤 Sending request body:', requestBody);
      const response = await api.post('/student/exams/submit', requestBody);
      console.log('✅ Submit exam response:', response.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (response.data?.success && response.data?.data) {
        console.log('📦 Found data in response.data.data');
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting exam:', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết câu hỏi và options theo questionId
   * GET /api/questions/{questionId}
   */
  static async getQuestionDetails(questionId: string): Promise<{ options: QuestionOption[]; scope: string }> {
    try {
      console.log('🔍 Fetching question details for ID:', questionId);
      const response = await api.get(`/questions/${questionId}`);
      console.log('✅ Question details response:', response.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (response.data?.success && response.data?.data) {
        const questionData = response.data.data;
        console.log('📦 Found question data:', questionData);
        
        // Map API response options to our QuestionOption interface
        const options = questionData.options?.map((option: any) => ({
          optionId: option.id,
          content: option.content,
          isCorrect: option.isCorrect
        })) || [];
        
        return {
          options,
          scope: questionData.scope
        };
      }
      
      // Fallback to direct data if not wrapped
      const options = response.data.options?.map((option: any) => ({
        optionId: option.id,
        content: option.content,
        isCorrect: option.isCorrect
      })) || [];
      
      return {
        options,
        scope: response.data.scope
      };
    } catch (error) {
      console.error('❌ Error fetching question details:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách options của câu hỏi theo questionId
   * GET /api/options/by-question/{questionId}
   * @deprecated Use getQuestionDetails instead
   */
  static async getQuestionOptions(questionId: string): Promise<QuestionOption[]> {
    try {
      console.log('🔍 Fetching options for question ID:', questionId);
      const response = await api.get(`/options/by-question/${questionId}`);
      console.log('✅ Question options response:', response.data);
      
      // Check if response has the expected structure {success: true, data: [...]}
      if (response.data?.success && response.data?.data) {
        console.log('📦 Found data in response.data.data');
        // Map API response to our QuestionOption interface
        return response.data.data.map((option: any) => ({
          optionId: option.id,
          content: option.content,
          isCorrect: option.isCorrect
        }));
      }
      
      // Fallback to direct data if not wrapped
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching question options:', error);
      throw error;
    }
  }

  /**
   * Lấy kết quả bài thi theo ID - API endpoint chuẩn
   * GET /api/student/exams/result/{resultId}
   */
  static async getExamResult(resultId: string): Promise<ExamResult> {
    try {
      console.log('🔍 Fetching exam result for ID:', resultId);
      const response = await api.get(`/student/exams/result/${resultId}`);
      console.log('✅ Exam result response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching exam result:', error);
      throw error;
    }
  }
}
