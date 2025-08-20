import aiApi from '../api/aiApi';

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
export function getCurrentUserId(): string | null {
  try {
    // Try userInfo first (main auth storage)
    const userInfoJson = localStorage.getItem('userInfo');
    if (userInfoJson) {
      const userInfo = JSON.parse(userInfoJson);
      return userInfo.id?.toString() || null; // Return null if no ID
    }
    
    // Fallback to legacy 'user' key
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return user.id?.toString() || user.userId?.toString() || null; // Return null if no ID
    }
    
    console.warn('No user ID found in localStorage');
    return null; // Return null instead of '1' when no user
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null; // Return null instead of '1' when error
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
   * POST /api/sessions/
   */
  createSession: async (request: CreateSessionRequest): Promise<CreateSessionResponse> => {
    try {
      console.log('🚀 Creating new session with request:', request);
      
      const response = await aiApi.post('/sessions/', request);
      
      console.log('✅ Session created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating session:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách phiên chat theo user ID
   * GET /api/sessions/?user_id=xxx
   */
  getSessions: async (userId: string): Promise<ChatSession[]> => {
    try {
      console.log('🔍 Loading sessions for user:', userId);
      const response = await aiApi.get(`/sessions/?user_id=${userId}`);
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
   * POST /api/messages/
   */
  sendMessage: async (request: SendMessageRequest): Promise<SendMessageResponse> => {
    try {
      console.log('🔍 Sending message:', request);
      const response = await aiApi.post('/messages/', request);
      console.log('✅ Message sent:', response.data);
      
      // Return direct response data (expecting 200 OK with the response format)
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết phiên chat và tin nhắn
   * GET /api/sessions/{sessionId}
   */
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      console.log('🔍 Loading messages for session:', sessionId);
      const response = await aiApi.get(`/sessions/${sessionId}`);
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
      
      const response = await aiApi.delete(`/sessions/${sessionId}`);
      console.log('✅ Session deleted successfully, response:', response);
    } catch (error) {
      console.error('❌ Error deleting session:', error);
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
      
      const response = await aiApi.patch(`/sessions/${sessionId}`, {
        session_name: newName
      });
      console.log('✅ Session name updated, response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating session name:', error);
      throw error;
    }
  },

  /**
   * Alias cho updateSessionName để tương thích với code cũ
   */
  renameSession: async (sessionId: string, newName: string): Promise<ChatSession> => {
    // Use the real updateSessionName method
    return await chatbotService.updateSessionName(parseInt(sessionId), newName);
  }
};
