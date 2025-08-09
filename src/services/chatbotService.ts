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


export const chatbotService = {
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

  createSession: async (sessionName: string) => {
    const response = await aiInstance.post('/sessions/', { session_name: sessionName });
    return response.data;
  },

  getSessions: async () => {
    const response = await aiInstance.get(`/sessions/`);
    return response.data;
  },

  getSessionHistory: async (sessionId: string) => {
    const response = await aiInstance.get(`/sessions/${sessionId}/history`);
    return response.data;
  },

  deleteSession: async (sessionId: string) => {
    const response = await aiInstance.delete(`/sessions/${sessionId}`);
    return response.data;
  },

  renameSession: async (sessionId: string, newName: string) => {
    const response = await aiInstance.put(`/sessions/${sessionId}/rename`, { new_name: newName });
    return response.data;
  },
};
