import api from '../api/axios';
import type { 
  ExamOverview,
  ExamStartResponse, 
  ExamSubmitResponse,
  ExamSubmitRequest,
  ExamResult,
  QuestionOption,
  QuestionDetail
} from '../types/exam';

// Course exam type for listing exams by course
export interface CourseExam {
  examId: string;
  title: string;
  description: string;
  duration: number;
  totalQuestions: number;
  type: string;
}

// Exam detail response from /api/exams/{examId}
export interface ExamDetailResponse {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: string;
  examScopeType: string;
  gradingMethod: string;
  courseId: string;
  chapterId: string | null;
  unitId: string | null;
  createdAt: string;
  totalQuestions: number;
}

// API response type for course exams
interface CourseExamsResponse {
  success: boolean;
  message: string;
  data: CourseExam[];
  timestamp: number;
}

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
      
      // Gọi trực tiếp endpoint overview của student
      const response = await api.get(`/student/exams/${examId}/overview`);
      console.log('✅ Exam overview response:', response.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (response.data?.success && response.data?.data) {
        const examData = response.data.data;
        
        // Convert response to ExamOverview format
        const overview: ExamOverview = {
          examId: examData.id || examId,
          title: examData.title,
          description: examData.description,
          duration: examData.duration,
          totalQuestions: examData.totalQuestions,
          type: examData.type as 'MULTIPLE_CHOICE' | 'ESSAY' | 'MIXED'
        };
        
        return overview;
      }
      
      // Fallback to direct data if not wrapped
      const overview: ExamOverview = {
        examId: response.data.id || examId,
        title: response.data.title,
        description: response.data.description,
        duration: response.data.duration,
        totalQuestions: response.data.totalQuestions,
        type: response.data.type as 'MULTIPLE_CHOICE' | 'ESSAY' | 'MIXED'
      };
      
      return overview;
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
   * Lấy danh sách bài kiểm tra theo courseId
   * GET /api/courses/{courseId}/exams
   */
  static async getExamsByCourseId(courseId: string): Promise<CourseExamsResponse> {
    try {
      console.log('🔍 Fetching exams for course:', courseId);
      const response = await api.get(`/courses/${courseId}/exams`);
      console.log('✅ Course exams response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching course exams:', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết về bài thi (không bao gồm questions)
   * GET /api/exams/{examId}
   */
  static async getExamDetail(examId: string): Promise<ExamDetailResponse> {
    try {
      console.log('🔍 Fetching exam detail for ID:', examId);
      const response = await api.get(`/exams/${examId}`);
      console.log('✅ Exam detail response:', response.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching exam detail:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách câu hỏi của bài thi
   * GET /api/exams/{examId}/questions
   */
  static async getExamQuestions(examId: string): Promise<QuestionDetail[]> {
    try {
      console.log('🔍 Fetching questions for exam ID:', examId);
      const response = await api.get(`/exams/${examId}/questions`);
      console.log('✅ Exam questions response:', response.data);
      
      // Check if response has the expected structure {success: true, data: [...]}
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching exam questions:', error);
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
   * Bắt đầu làm bài thi - API endpoint đã được cập nhật
   * POST /api/student/exams/{examId}/start
   * Trả về tất cả thông tin cần thiết trong 1 lần gọi API
   */
  static async startExam(examId: string): Promise<ExamStartResponse> {
    try {
      console.log('🔍 Starting exam with ID:', examId);
      
      // Gọi API start exam để lấy TẤT CẢ thông tin cần thiết
      const startResponse = await api.post(`/student/exams/${examId}/start`);
      console.log('✅ Start exam response:', startResponse.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (startResponse.data?.success && startResponse.data?.data) {
        console.log('📦 Found data in response.data.data');
        return startResponse.data.data;
      } else {
        // Fallback to direct data if not wrapped
        console.log('� Using direct response data');
        return startResponse.data;
      }
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
   * Nộp bài thi - API endpoint chuẩn (Updated API)
   * POST /api/student/exams/submit
   * Returns only examResultId in response data
   */
  static async submitExam(examId: string, startedAt: string, submittedAt: string, answers: SubmitAnswer[]): Promise<{ examResultId: number }> {
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
      console.log('✅ Submit exam response raw:', response);
      console.log('✅ Submit exam response.data:', response.data);
      
      // Handle API wrapper response format {success: true, data: {examResultId: number}, message: string, timestamp: number}
      if (response.data?.success && response.data?.data) {
        console.log('📦 Found data in response.data.data:', response.data.data);
        return response.data.data;
      }
      
      console.log('📦 Using direct response.data as fallback');
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
        const options = questionData.options?.map((option: {
          id: string
          content: string
          isCorrect: boolean
        }) => ({
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
      const options = response.data.options?.map((option: {
        id: string
        content: string
        isCorrect: boolean
      }) => ({
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
   * GET /api/questions/{questionId}/options
   * @deprecated Use getQuestionDetails instead
   */
  static async getQuestionOptions(questionId: string): Promise<QuestionOption[]> {
    try {
      console.log('🔍 Fetching options for question ID:', questionId);
      const response = await api.get(`/questions/${questionId}/options`);
      console.log('✅ Question options response:', response.data);
      
      // Check if response has the expected structure {success: true, data: [...]}
      if (response.data?.success && response.data?.data) {
        console.log('📦 Found data in response.data.data');
        // Map API response to our QuestionOption interface
        return response.data.data.map((option: {
          id: string
          content: string
          isCorrect: boolean
        }) => ({
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
      console.log('🔍 Result ID type:', typeof resultId);
      console.log('🔍 Result ID length:', resultId?.length);
      console.log('🔍 Is Result ID valid:', !!resultId && resultId.trim() !== '');
      
      // Validate resultId
      if (!resultId || resultId.trim() === '') {
        throw new Error('Result ID is required and cannot be empty');
      }
      
      // Clean resultId (remove any whitespace)
      const cleanResultId = resultId.toString().trim();
      console.log('🔍 Clean Result ID:', cleanResultId);
      
      const url = `/student/exams/result/${cleanResultId}`;
      console.log('🔍 Making GET request to:', url);
      
      const response = await api.get(url);
      console.log('✅ Exam result response status:', response.status);
      console.log('✅ Exam result response:', response.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (response.data?.success && response.data?.data) {
        console.log('📦 Found data in response.data.data:', response.data.data);
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      console.log('📦 Using direct response.data as fallback');
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Error fetching exam result:', error);
      
      // Type-safe error handling
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: unknown } };
        console.error('❌ Error status:', axiosError.response?.status);
        console.error('❌ Error data:', axiosError.response?.data);
      }
      
      console.error('❌ Full error object:', error);
      throw error;
    }
  }
}
