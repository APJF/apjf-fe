import axios from 'axios';
import { refreshToken } from './authService';

const apiInstance = axios.create({
  baseURL: 'http://localhost:8080/api/',
});

// Request interceptor: thêm access token vào header
apiInstance.interceptors.request.use(
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

// Response interceptor: tự động refresh token khi 401
apiInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config;

    if (err.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        await refreshToken();
        return apiInstance(originalConfig);
      } catch (_error: unknown) {
        return Promise.reject(new Error(_error instanceof Error ? _error.message : 'Token refresh failed'));
      }
    }

    return Promise.reject(new Error(err instanceof Error ? err.message : 'Response failed'));
  }
);

// POST API
export const postApi = {
  getAllPosts: async () => {
    const response = await apiInstance.get('/posts/list'); // Backend trả về danh sách post kèm comment + user
    return response.data;
  },

  getPostById: async (postId: number) => {
    const response = await apiInstance.get(`/posts/${postId}`);
    return response.data;
  },

  createPost: async (postData: {
    content: string;
    userId?: string;
  }) => {
    const response = await apiInstance.post('/posts', postData);
    return response.data;
  },

  updatePost: async (postId: string, postData: {
    content: string;
  }) => {
    const response = await apiInstance.put(`/posts/${postId}`, postData);
    return response.data;
  },

  deletePost: async (postId: string) => {
    const response = await apiInstance.delete(`/posts/${postId}`);
    return response.data;
  },
};

// COMMENT API
export const commentApi = {
  getCommentsByPost: async (postId: number) => {
    const response = await apiInstance.get(`/posts/${postId}/comments`);
    return response.data;
  },

  createComment: async (commentData: {
    content: string;
    userId?: string;
    postId: number;
  }) => {
    const response = await apiInstance.post('/comments', commentData);
    return response.data;
  },

  updateComment: async (commentId: string, commentData: {
    content: string;
    userId?: string;
    postId: string;
  }) => {
    const response = await apiInstance.put(`/comments/${commentId}`, commentData);
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    const response = await apiInstance.delete(`/comments/${commentId}`);
    return response.data;
  },
};
