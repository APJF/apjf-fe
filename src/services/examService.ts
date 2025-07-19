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
   * SIMPLE test - chỉ log và thử nghiệm cơ bản
   */
  static async simpleStartExam(examId: string): Promise<StartExamResponse> {
    console.log('=== SIMPLE START EXAM TEST ===');
    console.log('ExamId:', examId);
    
    // Check user auth
    const userJson = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    console.log('User data:', userJson);
    console.log('Has token:', !!token);
    
    let userId = '2';
    if (userJson) {
      const user = JSON.parse(userJson);
      userId = user.id || '2';
    }
    
    console.log('Using userId:', userId);
    
    // Test call - most basic
    try {
      console.log('Attempting simple POST to:', `/exam-results/exams/${examId}/start`);
      const response = await api.post(`/exam-results/exams/${examId}/start`);
      console.log('SUCCESS - Simple POST worked!', response);
      return response.data;
    } catch (e) {
      console.log('Simple POST failed:', e);
    }
    
    // Test call - with query param
    try {
      const url = `/exam-results/exams/${examId}/start?userId=${userId}`;
      console.log('Attempting POST with query param to:', url);
      const response = await api.post(url);
      console.log('SUCCESS - Query param POST worked!', response);
      return response.data;
    } catch (e) {
      console.log('Query param POST failed:', e);
    }
    
    // Test call - with body
    try {
      console.log('Attempting POST with body');
      const response = await api.post(`/exam-results/exams/${examId}/start`, { userId });
      console.log('SUCCESS - Body POST worked!', response);
      return response.data;
    } catch (e) {
      console.log('Body POST failed:', e);
    }
    
    throw new Error('All tests failed');
  }

  /**
   * Bắt đầu làm bài thi
   */
  static async startExam(examId: string): Promise<StartExamResponse> {
    // Gọi simple test trước
    return await this.simpleStartExam(examId);
  }

  /**
   * DEBUG: Test multiple submit endpoints
   */
  static async debugSubmitExam(examId: string, answers: SubmitExamAnswer[]): Promise<SubmitExamResponse> {
    console.log('🧪 DEBUG SUBMIT EXAM');
    console.log('ExamId:', examId);
    console.log('Original answers:', answers);
    
    // Transform answers to server format - keep selectedOptionId (no 's')
    const formattedAnswers = answers.map(answer => ({
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId || "" // Server expects 'selectedOptionId' (no 's')
    }));
    
    const requestBody = {
      examId: examId,
      answers: formattedAnswers
    };
    
    console.log('Formatted request body:', JSON.stringify(requestBody, null, 2));
    
    // Test 1: /exam-results/submit
    console.log('\n=== TEST 1: /exam-results/submit ===');
    try {
      const response1 = await api.post('/exam-results/submit', requestBody);
      console.log('✅ SUCCESS with /exam-results/submit:', response1.data);
      return response1.data;
    } catch (e) {
      console.log('❌ FAILED /exam-results/submit:', e);
    }
    
    // Test 2: /exam-results/exams/{examId}/submit
    console.log('\n=== TEST 2: /exam-results/exams/{examId}/submit ===');
    try {
      const response2 = await api.post(`/exam-results/exams/${examId}/submit`, requestBody);
      console.log('✅ SUCCESS with /exam-results/exams/{examId}/submit:', response2.data);
      return response2.data;
    } catch (e) {
      console.log('❌ FAILED /exam-results/exams/{examId}/submit:', e);
    }
    
    // Test 3: /exam-results/{examId}/submit  
    console.log('\n=== TEST 3: /exam-results/{examId}/submit ===');
    try {
      const response3 = await api.post(`/exam-results/${examId}/submit`, requestBody);
      console.log('✅ SUCCESS with /exam-results/{examId}/submit:', response3.data);
      return response3.data;
    } catch (e) {
      console.log('❌ FAILED /exam-results/{examId}/submit:', e);
    }
    
    throw new Error('All submit tests failed');
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
   */
  static async getExamResult(resultId: string): Promise<SubmitExamResponse> {
    try {
      const response = await api.get(`/exam-results/${resultId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exam result:', error);
      throw error;
    }
  }
}
