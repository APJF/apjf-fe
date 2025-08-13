// Types for the new Forum API

export interface ForumAPIPost {
  id: number;
  content: string;
  createdAt: string;
  email: string;
  avatar: string;
}

export interface ForumAPIResponse {
  success: boolean;
  message: string;
  data: ForumAPIPost[];
  timestamp: number;
}

export interface AvatarPresignResponse {
  success: boolean;
  message: string;
  data: Record<string, string>; // key-value pairs of avatar keys to presigned URLs
  timestamp: number;
}

export interface AvatarPresignRequest {
  keys: string[];
}
