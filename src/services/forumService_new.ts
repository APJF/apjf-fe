import api from '../api/axios';

// POST API
export const postApi = {
  getAllPosts: async () => {
    const response = await api.get('/posts/list'); // Backend trả về danh sách post kèm comment + user
    return response.data;
  },

  getPostById: async (postId: number) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  createPost: async (postData: {
    content: string;
    userId?: string | number;
  }) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },

  updatePost: async (postId: string, postData: {
    content: string;
  }) => {
    const response = await api.put(`/posts/${postId}`, postData);
    return response.data;
  },

  deletePost: async (postId: string) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },
};

// COMMENT API
export const commentApi = {
  getCommentsByPost: async (postId: number) => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  },

  createComment: async (commentData: {
    content: string;
    userId?: string | number;
    postId: number;
  }) => {
    const response = await api.post('/comments', commentData);
    return response.data;
  },

  updateComment: async (commentId: string, commentData: {
    content: string;
    userId?: string | number;
    postId: string;
  }) => {
    const response = await api.put(`/comments/${commentId}`, commentData);
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
};
