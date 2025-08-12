import api from '../api/axios';
import { ForumAPIService } from './forumAPIService';

const forumAPIService = new ForumAPIService();
import type { Comment } from '../types/forum';

// Comment interfaces
interface CommentResponse {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  username: string;
  avatar: string;
  postId: number;
  isEdited: boolean;
}

export interface CommentsAPIResponse {
  success: boolean;
  message: string;
  data: CommentResponse[];
  timestamp: number;
}

export interface CreateCommentRequest {
  content: string;
  userId: number;
  postId: number;
}

export interface UpdateCommentRequest {
  content: string;
  userId: number;
  postId: number;
}

export interface CreateCommentResponse {
  success: boolean;
  message: string;
  data: CommentResponse;
  timestamp: number;
}

export interface UpdateCommentResponse {
  success: boolean;
  message: string;
  data: CommentResponse;
  timestamp: number;
}

export interface DeleteCommentResponse {
  success: boolean;
  message: string;
  timestamp: number;
}

export class CommentAPIService {
  /**
   * Get all comments for a specific post
   */
  async getCommentsByPostId(postId: number): Promise<CommentsAPIResponse> {
    try {
      const response = await api.get<CommentsAPIResponse>(`/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Create a new comment
   */
  async createComment(request: CreateCommentRequest): Promise<CreateCommentResponse> {
    try {
      console.log('🚀 Creating comment:', request);
      
      const response = await api.post<CreateCommentResponse>('/comments', request);
      
      console.log('✅ Comment created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating comment:', error);
      if (error instanceof Error) {
        console.error('📊 Error details:', {
          message: error.message,
          ...(error && typeof error === 'object' && 'response' in error && {
            response: (error as { response?: { data?: unknown; status?: number; statusText?: string } }).response?.data,
            status: (error as { response?: { status?: number } }).response?.status,
            statusText: (error as { response?: { statusText?: string } }).response?.statusText
          })
        });
      }
      throw error;
    }
  }

  /**
   * Update an existing comment
   */
  async updateComment(commentId: number, request: UpdateCommentRequest): Promise<UpdateCommentResponse> {
    try {
      console.log('🚀 Updating comment:', commentId, request);
      
      const response = await api.put<UpdateCommentResponse>(`/comments/${commentId}`, request);
      
      console.log('✅ Comment updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating comment:', error);
      if (error instanceof Error) {
        console.error('📊 Error details:', {
          message: error.message,
          ...(error && typeof error === 'object' && 'response' in error && {
            response: (error as { response?: { data?: unknown; status?: number; statusText?: string } }).response?.data,
            status: (error as { response?: { status?: number } }).response?.status,
            statusText: (error as { response?: { statusText?: string } }).response?.statusText
          })
        });
      }
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: number): Promise<DeleteCommentResponse> {
    try {
      console.log('🚀 Deleting comment:', commentId);
      
      const response = await api.delete<DeleteCommentResponse>(`/comments/${commentId}`);
      
      console.log('✅ Comment deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      if (error instanceof Error) {
        console.error('📊 Error details:', {
          message: error.message,
          ...(error && typeof error === 'object' && 'response' in error && {
            response: (error as { response?: { data?: unknown; status?: number; statusText?: string } }).response?.data,
            status: (error as { response?: { status?: number } }).response?.status,
            statusText: (error as { response?: { statusText?: string } }).response?.statusText
          })
        });
      }
      throw error;
    }
  }

  /**
   * Helper function to convert API comment to UI comment format
   */
  convertAPICommentToUIComment(apiComment: CommentResponse): Comment {
    return {
      id: apiComment.id.toString(),
      author: apiComment.username || apiComment.email, // Prefer username, fallback to email
      authorEmail: apiComment.email, // Keep email for permission checking
      avatar: apiComment.avatar,
      content: apiComment.content,
      timestamp: ForumAPIService.formatTimeAgo(apiComment.createdAt),
      likes: 0, // Not provided by API yet
      isLiked: false, // Not provided by API yet
      postId: apiComment.postId.toString()
    };
  }

  /**
   * Get comments for a post with avatars resolved
   */
  async getCommentsWithAvatars(postId: number): Promise<Comment[]> {
    try {
      const response = await this.getCommentsByPostId(postId);
      
      if (!response.success || !response.data) {
        return [];
      }

      // Convert to UI format first
      const comments = response.data.map(comment => this.convertAPICommentToUIComment(comment));

      // Extract avatar keys that need presigning
      const avatarKeys = response.data
        .map(comment => comment.avatar)
        .filter(avatar => avatar && !avatar.startsWith('http'))
        .filter((avatar, index, arr) => arr.indexOf(avatar) === index);

      // If no avatars need presigning, return as-is
      if (avatarKeys.length === 0) {
        return comments;
      }

            // Get presigned URLs for avatars  
      const presignResponse = await forumAPIService.getAvatarPresignedUrls(avatarKeys);
      
      if (!presignResponse.success || !presignResponse.data) {
        console.warn('Failed to get presigned URLs for comments, using original avatar values');
        return comments;
      }

      // Create a map of avatar key to presigned URL
      const avatarUrlMap = new Map<string, string>();
      
      // presignResponse.data is Record<string, string> - key-value pairs
      Object.entries(presignResponse.data).forEach(([key, url]) => {
        avatarUrlMap.set(key, url);
      });

      // Update avatar URLs
      return comments.map(comment => {
        const originalComment = response.data.find(c => c.id.toString() === comment.id);
        const avatarKey = originalComment?.avatar;
        return {
          ...comment,
          avatar: avatarKey ? (avatarUrlMap.get(avatarKey) || comment.avatar) : comment.avatar
        };
      });

    } catch (error) {
      console.error('Error getting comments with avatars:', error);
      return [];
    }
  }
}

// Export singleton instance
export const commentAPIService = new CommentAPIService();
