import axios from 'axios';
import { refreshToken } from './authService';

const aiInstance = axios.create({
  baseURL: 'http://localhost:8090',
});

aiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(new Error(error instanceof Error ? error.message : 'Request failed'));
  }
);

aiInstance.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const originalConfig = err.config;

    if (err.response) {
      // Access Token was expired
      if (err.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;

        try {
          await refreshToken();
          return aiInstance(originalConfig);
        } catch (_error: unknown) {
          return Promise.reject(new Error(_error instanceof Error ? _error.message : 'Token refresh failed'));
        }
      }
    }

    return Promise.reject(new Error(err instanceof Error ? err.message : 'Response failed'));
  }
);

// Types for new chatbot API
export interface ChatSession {
  id: string;
  name: string;
  session_type: 'qna' | 'planner' | 'speaking' | 'reviewer' | 'learning';
  user_id: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface CreateSessionRequest {
  user_id: string;
  session_type: 'qna' | 'planner' | 'speaking' | 'reviewer' | 'learning';
  first_message: string;
  context?: Record<string, any>;
}

export interface UpdateSessionRequest {
  name?: string;
  session_type?: 'qna' | 'planner' | 'speaking' | 'reviewer' | 'learning';
  context?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  session_id: string;
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

export const chatbotService = {
  // Legacy methods (keep for backward compatibility)
  invokeStateless: async (userInput: string) => {
    const response = await aiInstance.post('/chat/invoke/stateless', { user_input: userInput });
    return response.data;
  },

  invoke: async (sessionId: string, userInput: string) => {
    const response = await aiInstance.post('/chat/invoke', { session_id: sessionId, user_input: userInput });
    return response.data;
  },

  editAndResubmit: async (sessionId: string, correctedInput: string) => {
    const response = await aiInstance.post('/chat/edit_and_resubmit', { session_id: sessionId, corrected_input: correctedInput });
    return response.data;
  },

  getSessionHistory: async (sessionId: string) => {
    const response = await aiInstance.get(`/sessions/${sessionId}/history`);
    return response.data;
  },

  // New API methods
  /**
   * Tạo phiên chat mới với tin nhắn đầu tiên
   * POST /api/sessions
   */
  createSession: async (request: CreateSessionRequest): Promise<ChatSession> => {
    try {
      console.log('🔍 Creating new chat session:', request);
      const response = await aiInstance.post('/api/sessions', request);
      console.log('✅ Session created:', response.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      return response.data;
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách phiên chat theo user ID
   * GET /api/sessions?user_id=
   */
  getSessions: async (userId?: string): Promise<ChatSession[]> => {
    try {
      const userIdToUse = userId || getCurrentUserId();
      console.log('🔍 Fetching sessions for user:', userIdToUse);
      const response = await aiInstance.get(`/api/sessions?user_id=${userIdToUse}`);
      console.log('✅ Sessions fetched:', response.data);
      
      // Check if response has the expected structure {success: true, data: [...]}
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Error fetching sessions:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin phiên chat (rename, change type, etc.)
   * PUT/PATCH /api/sessions/{id}
   */
  updateSession: async (sessionId: string, request: UpdateSessionRequest): Promise<ChatSession> => {
    try {
      console.log('🔍 Updating session:', sessionId, request);
      const response = await aiInstance.put(`/api/sessions/${sessionId}`, request);
      console.log('✅ Session updated:', response.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      return response.data;
    } catch (error) {
      console.error('❌ Error updating session:', error);
      throw error;
    }
  },

  /**
   * Xóa phiên chat
   * DELETE /api/sessions/{id}
   */
  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      console.log('🔍 Deleting session:', sessionId);
      await aiInstance.delete(`/api/sessions/${sessionId}`);
      console.log('✅ Session deleted');
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      throw error;
    }
  },

  /**
   * Rename session (wrapper cho updateSession)
   */
  renameSession: async (sessionId: string, newName: string): Promise<ChatSession> => {
    return chatbotService.updateSession(sessionId, { name: newName });
  },

  /**
   * Gửi tin nhắn trong phiên chat
   * POST /api/sessions/{id}/messages
   */
  sendMessage: async (sessionId: string, message: string): Promise<ChatMessage> => {
    try {
      console.log('🔍 Sending message to session:', sessionId, message);
      const response = await aiInstance.post(`/api/sessions/${sessionId}/messages`, {
        content: message
      });
      console.log('✅ Message sent:', response.data);
      
      // Check if response has the expected structure {success: true, data: {...}}
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  },

  /**
   * Lấy tin nhắn trong phiên chat
   * GET /api/sessions/{id}/messages
   */
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      console.log('🔍 Fetching messages for session:', sessionId);
      const response = await aiInstance.get(`/api/sessions/${sessionId}/messages`);
      console.log('✅ Messages fetched:', response.data);
      
      // Check if response has the expected structure {success: true, data: [...]}
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      
      // Fallback to direct data if not wrapped
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw error;
    }
  },
};
