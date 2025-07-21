import api from '../api/axios';
import type { 
  ExamApiResponse, 
  StartExamResponse, 
  SubmitExamResponse,
  SubmitExamAnswer
} from '../types/exam';

export class ExamService {
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
  static async getExamDetail(examId: string): Promise<ExamApiResponse> {
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
   * SIMPLE test - chỉ log và thử nghiệm cơ bản với endpoint chính xác
   */
  static async simpleStartExam(examId: string): Promise<StartExamResponse> {
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
   * Bắt đầu làm bài thi
   */
  static async startExam(examId: string): Promise<StartExamResponse> {
    // Gọi simple test trước
    return await this.simpleStartExam(examId);
  }

  /**
   * Nộp bài thi với endpoint chính xác từ API docs
   */
  static async debugSubmitExam(examId: string, answers: SubmitExamAnswer[]): Promise<SubmitExamResponse> {
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
   * Nộp bài thi
   */
  static async submitExam(examId: string, answers: SubmitExamAnswer[]): Promise<SubmitExamResponse> {
    // Temporarily use debug method to find correct endpoint
    return await this.debugSubmitExam(examId, answers);
  }

  /**
   * Lấy kết quả bài thi theo ID
   * Thử các endpoint khác nhau để tìm endpoint đúng
   */
  static async getExamResult(resultId: string): Promise<SubmitExamResponse> {
    console.log('🔍 Attempting to fetch exam result for ID:', resultId)
    
    // Thử endpoint 1: /exam-results/{resultId}
    try {
      console.log('Trying endpoint: /exam-results/' + resultId)
      const response = await api.get(`/exam-results/${resultId}`)
      console.log('✅ Success with /exam-results/{resultId}:', response.data)
      return response.data
    } catch (error) {
      console.log('❌ Failed with /exam-results/{resultId}:', error)
    }

    // Thử endpoint 2: /exam-results/result/{resultId}
    try {
      console.log('Trying endpoint: /exam-results/result/' + resultId)
      const response = await api.get(`/exam-results/result/${resultId}`)
      console.log('✅ Success with /exam-results/result/{resultId}:', response.data)
      return response.data
    } catch (error) {
      console.log('❌ Failed with /exam-results/result/{resultId}:', error)
    }

    // Thử endpoint 3: /exam-results/details/{resultId}
    try {
      console.log('Trying endpoint: /exam-results/details/' + resultId)
      const response = await api.get(`/exam-results/details/${resultId}`)
      console.log('✅ Success with /exam-results/details/{resultId}:', response.data)
      return response.data
    } catch (error) {
      console.log('❌ Failed with /exam-results/details/{resultId}:', error)
    }

    // Nếu tất cả đều thất bại, ném lỗi
    throw new Error(`Không thể tải kết quả bài kiểm tra với ID: ${resultId}. Vui lòng kiểm tra API endpoint.`)
  }
}
