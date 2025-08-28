import api from '../api/axios';

// Types for the new API
export interface PostResponse {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  username: string;
  avatar: string;
  commentsCount: number;
  likeInfo: {
    liked: boolean;
    totalLikes: number;
  };
}

export interface PostsAPIResponse {
  success: boolean;
  message: string;
  data: PostResponse[];
  timestamp: number;
}

export interface PresignResponse {
  success: boolean;
  message: string;
  data: Record<string, string>; // key-value pairs of avatar keys to presigned URLs
  timestamp: number;
}

export interface PresignRequest {
  keys: string[];
}

export interface CreatePostRequest {
  content: string;
}

export interface UpdatePostRequest {
  content: string;
}

export interface CreatePostResponse {
  success: boolean;
  message: string;
  data: PostResponse;
  timestamp: number;
}

export interface ReportPostRequest {
  content: string;
  postId: number;
}

export interface ReportCommentRequest {
  content: string;
  commentId: number;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    content: string;
    createdAt: string;
    userId: number;
    postId?: number;
    commentId?: number;
  };
  timestamp: number;
}

export interface UpdatePostResponse {
  success: boolean;
  message: string;
  data: PostResponse;
  timestamp: number;
}

export interface LikePostRequest {
  postId: number;
}

export interface LikePostResponse {
  success: boolean;
  message: string;
  data: {
    liked: boolean;
    totalLikes: number;
  };
  timestamp: number;
}

export class ForumAPIService {
  /**
   * Get all posts from the forum
   */
  async getAllPosts(): Promise<PostsAPIResponse> {
    try {
      const response = await api.get<PostsAPIResponse>('/posts');
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Get presigned URLs for avatar images
   */
  async getAvatarPresignedUrls(avatarKeys: string[]): Promise<PresignResponse> {
    try {
      const requestBody: PresignRequest = {
        keys: avatarKeys
      };
      
      const response = await api.post<PresignResponse>('/media/presign', requestBody);
      return response.data;
    } catch (error) {
      console.error('Error fetching avatar presigned URLs:', error);
      throw error;
    }
  }

  /**
   * Create a new post
   */
  async createPost(content: string): Promise<CreatePostResponse> {
    try {
      const requestBody: CreatePostRequest = {
        content
      };
      
      const response = await api.post<CreatePostResponse>('/posts', requestBody);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: number, content: string): Promise<UpdatePostResponse> {
    try {
      const requestBody: UpdatePostRequest = {
        content
      };
      
      console.log('🚀 Making PUT request to:', `/posts/${postId}`);
      console.log('📦 Request body:', requestBody);
      console.log('🔢 Post ID type:', typeof postId, 'value:', postId);
      console.log('📝 Content type:', typeof content, 'length:', content.length);
      
      const response = await api.put<UpdatePostResponse>(`/posts/${postId}`, requestBody);
      
      console.log('✅ PUT response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating post:', error);
      if (error instanceof Error) {
        console.error('📊 Error details:', {
          message: error.message,
          // Check if it's an axios error
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
   * Like or unlike a post
   */
  async likePost(postId: number): Promise<LikePostResponse> {
    try {
      const requestBody: LikePostRequest = {
        postId
      };
      
      console.log('❤️ Making POST request to like post:', `/post-likes`);
      console.log('📦 Request body:', requestBody);
      
      const response = await api.post<LikePostResponse>('/post-likes', requestBody);
      
      console.log('✅ Like response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error liking post:', error);
      if (error instanceof Error) {
        console.error('📊 Error details:', {
          message: error.message,
          // Check if it's an axios error
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
   * Get all posts with their avatar URLs resolved
   */
  async getPostsWithAvatars(): Promise<PostResponse[]> {
    try {
      // First, get all posts
      const postsResponse = await this.getAllPosts();
      
      if (!postsResponse.success || !postsResponse.data) {
        throw new Error('Failed to fetch posts');
      }

      const posts = postsResponse.data;

      // Extract all unique avatar keys that need presigned URLs
      const avatarKeys = posts
        .map(post => post.avatar)
        .filter(avatar => avatar && !avatar.startsWith('http')) // Only non-URL avatars
        .filter((avatar, index, arr) => arr.indexOf(avatar) === index); // Remove duplicates

      // If no avatars need presigning, return posts as-is
      if (avatarKeys.length === 0) {
        return posts;
      }

      // Get presigned URLs for avatars
      const presignResponse = await this.getAvatarPresignedUrls(avatarKeys);
      
      console.log('🔍 Presign response structure:', presignResponse);
      
      if (!presignResponse.success || !presignResponse.data) {
        console.warn('Failed to get presigned URLs, using original avatar values');
        return posts;
      }

      // Create a map of avatar key to presigned URL
      const avatarUrlMap = new Map<string, string>();
      
      // presignResponse.data is Record<string, string> - key-value pairs
      Object.entries(presignResponse.data).forEach(([key, url]) => {
        avatarUrlMap.set(key, url);
      });

      // Replace avatar keys with presigned URLs
      const postsWithAvatars = posts.map(post => ({
        ...post,
        avatar: avatarUrlMap.get(post.avatar) || post.avatar
      }));

      return postsWithAvatars;
    } catch (error) {
      console.error('Error getting posts with avatars:', error);
      throw error;
    }
  }

  /**
   * Helper function to format time ago
   */
  static formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa mới';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
    return `${Math.floor(diffInSeconds / 31536000)} năm trước`;
  }

  // Report post
  async reportPost(request: ReportPostRequest): Promise<ReportResponse> {
    try {
      console.log('Reporting post:', request);
      const response = await api.post('/post-reports', request);
      console.log('Report post response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error reporting post:', error);
      throw error;
    }
  }

  // Report comment
  async reportComment(request: ReportCommentRequest): Promise<ReportResponse> {
    try {
      console.log('Reporting comment:', request);
      const response = await api.post('/comment-reports', request);
      console.log('Report comment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error reporting comment:', error);
      throw error;
    }
  }
}

export const forumAPIService = new ForumAPIService();
