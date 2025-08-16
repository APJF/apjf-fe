import axios from 'axios';
import { refreshToken } from './authService';

const aiInstance = axios.create({
  baseURL: 'http://localhost:8000',
});

aiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔑 Token for AI request:', token ? `${token.substring(0, 20)}...` : 'No token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    console.log('🌐 Request URL:', (config.baseURL || '') + (config.url || ''));
    console.log('📦 Request data:', config.data);
    return config;
  },
  (error: unknown) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(new Error(error instanceof Error ? error.message : 'Request failed'));
  }
);

aiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshToken();
        const newToken = localStorage.getItem('access_token');
        if (newToken) {
          originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
          return aiInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login or handle as needed
        window.location.href = '/login';
      }
    }
    return Promise.reject(new Error(error instanceof Error ? error.message : 'Unknown error'));
  }
);

// Types for new chatbot API
export type SessionType = 'qna' | 'planner' | 'reviewer' | 'learning';

export interface ChatSession {
  id: number;
  session_name: string;
  type: string; // 'QNA', 'REVIEWER', 'PLANNER', 'LEARNING'
  updated_at: string;
}

export interface SessionsResponse {
  user_id: string;
  sessions: ChatSession[];
}

export interface CreateSessionRequest {
  user_id: string;
  session_type: SessionType;
  first_message: string;
  context?: {
    exam_result_id?: number;
  };
}

export interface CreateSessionResponse {
  session_id: number;
  session_name: string;
  ai_first_response: string;
}

export interface SendMessageRequest {
  session_id: number;
  user_input: string;
}

export interface SendMessageResponse {
  session_id: number;
  human_message_id: number;
  ai_message_id: number;
  ai_response: string;
}

export interface SessionMessage {
  id: number;
  order: number;
  type: 'human' | 'ai';
  content: string;
  created_at: string;
}

export interface SessionDetailResponse {
  session_id: number;
  messages: SessionMessage[];
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

/**
 * Utility function để lấy user ID từ localStorage
 */
export function getCurrentUserId(): string {
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return user.id || user.userId || '1'; // fallback to '1' if not found
    }
    return '1'; // default fallback
  } catch (error) {
    console.error('Error getting user ID:', error);
    return '1'; // default fallback
  }
}

/**
 * Utility function để lấy exam_result_id cho context của reviewer AI
 */
export function getExamResultId(): number | undefined {
  try {
    // Có thể lấy từ URL params hoặc từ state navigation
    const urlParams = new URLSearchParams(window.location.search);
    const examResultId = urlParams.get('exam_result_id');
    return examResultId ? parseInt(examResultId, 10) : undefined;
  } catch (error) {
    console.error('Error getting exam result ID:', error);
    return undefined;
  }
}

export const chatbotService = {
  /**
   * Tạo phiên chat mới với tin nhắn đầu tiên
   * POST /api/sessions
   */
  createSession: async (request: CreateSessionRequest): Promise<CreateSessionResponse> => {
    try {
      console.log('🔍 Creating new chat session:', request);
      console.log('📋 EXACT JSON BEING SENT TO API:');
      console.log('==================================');
      console.log(JSON.stringify(request, null, 2));
      console.log('==================================');
      
      const response = await aiInstance.post('/api/sessions/', request);
      console.log('✅ Session created:', response.data);
      console.log('📝 AI Response breakdown:');
      console.log('- session_id:', response.data.session_id, typeof response.data.session_id);
      console.log('- session_name:', response.data.session_name, typeof response.data.session_name);
      console.log('- ai_first_response length:', response.data.ai_first_response?.length || 0);
      console.log('- ai_first_response preview:', response.data.ai_first_response?.substring(0, 100) + '...');
      
      // Return direct response data (expecting 200 OK with the response format)
      return response.data;
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách phiên chat theo user ID
   * GET /api/sessions?user_id=xxx
   */
  getSessions: async (userId: string): Promise<ChatSession[]> => {
    try {
      console.log('🔍 Loading sessions for user:', userId);
      const response = await aiInstance.get(`/api/sessions/?user_id=${userId}`);
      console.log('✅ Sessions loaded:', response.data);
      
      // Handle response format: { user_id: string, sessions: ChatSession[] }
      if (response.data?.sessions) {
        return response.data.sessions;
      }
      
      // Fallback to direct data if not wrapped
      return response.data || [];
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
      throw error;
    }
  },

  /**
   * Gửi tin nhắn tiếp theo trong phiên chat
   * POST /api/messages
   */
  sendMessage: async (request: SendMessageRequest): Promise<SendMessageResponse> => {
    try {
      console.log('🔍 Sending message:', request);
      const response = await aiInstance.post('/api/messages/', request);
      console.log('✅ Message sent:', response.data);
      
      // Return direct response data (expecting 200 OK with the response format)
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  },

  /**
   * Lấy lịch sử messages của một session
   * GET /api/sessions/{sessionId}
   */
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      console.log('🔍 Loading messages for session:', sessionId);
      const response = await aiInstance.get(`/api/sessions/${sessionId}`);
      console.log('✅ Session detail loaded:', response.data);
      
      const sessionDetail: SessionDetailResponse = response.data;
      
      // Convert SessionMessage[] to ChatMessage[] and sort by order
      const sortedMessages = [...sessionDetail.messages].sort((a, b) => a.order - b.order);
      const chatMessages: ChatMessage[] = sortedMessages.map(msg => ({
          id: msg.id.toString(),
          content: msg.content,
          role: msg.type === 'human' ? 'user' : 'assistant',
          timestamp: msg.created_at // Sử dụng created_at từ API thay vì new Date()
        }));
      
      console.log('🔄 Converted messages:', chatMessages);
      return chatMessages;
    } catch (error) {
      console.error('❌ Error loading session messages:', error);
      return [];
    }
  },

  /**
   * Xóa một session
   * DELETE /api/sessions/{sessionId}
   */
  deleteSession: async (sessionId: number): Promise<void> => {
    try {
      console.log('🗑️ Deleting session:', sessionId);
      console.log('🌐 DELETE URL will be:', `http://localhost:8000/api/sessions/${sessionId}`);
      
      const response = await aiInstance.delete(`/api/sessions/${sessionId}`);
      console.log('✅ Session deleted successfully, response:', response);
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number; statusText?: string } };
        console.error('🔍 DELETE Error details:');
        console.error('- Status:', axiosError.response?.status);
        console.error('- Status Text:', axiosError.response?.statusText);
        console.error('- Response data:', axiosError.response?.data);
        console.error('- Full URL attempted:', `http://localhost:8000/api/sessions/${sessionId}`);
      }
      throw error;
    }
  },

  /**
   * Đổi tên session  
   * PATCH /api/sessions/{sessionId}
   */
  updateSessionName: async (sessionId: number, newName: string): Promise<ChatSession> => {
    try {
      console.log('✏️ Updating session name:', sessionId, 'to:', newName);
      console.log('🌐 PATCH URL will be:', `http://localhost:8000/api/sessions/${sessionId}`);
      console.log('📦 PATCH payload:', { name: newName });
      
      const response = await aiInstance.patch(`/api/sessions/${sessionId}`, {
        name: newName
      });
      console.log('✅ Session name updated, response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating session name:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number; statusText?: string } };
        console.error('🔍 PATCH Error details:');
        console.error('- Status:', axiosError.response?.status);
        console.error('- Status Text:', axiosError.response?.statusText);
        console.error('- Response data:', axiosError.response?.data);
        console.error('- Full URL attempted:', `http://localhost:8000/api/sessions/${sessionId}`);
        console.error('- Payload sent:', { name: newName });
      }
      throw error;
    }
  },

  renameSession: async (sessionId: string, newName: string): Promise<ChatSession> => {
    // Use the real updateSessionName method
    return await chatbotService.updateSessionName(parseInt(sessionId), newName);
  }
};
