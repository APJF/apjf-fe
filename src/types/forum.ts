export type PostType = {
  id: number
  title: string
  content: string
  author: string
  authorAvatar?: string
  createdAt: string
  comments: CommentType[]
}

export type CommentType = {
  id: number
  content: string
  author: string
  replies?: CommentType[]
  parentId?: number
  postId: number
}

export type WebSocketMessage = {
  type: "NEW_POST" | "NEW_COMMENT" | "NEW_REPLY" | "CREATE_POST"
  data: any
}

// New types for the updated forum design
export interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
  postId: string
}

export interface Post {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
  comments: Comment[]
  showComments: boolean
  commentsCount: number
}

export interface ForumPost {
  id: string
  content: string
  createdAt: string
  email: string
  avatar: string
  comments: ForumComment[]
}

export interface ForumComment {
  id: string
  content: string
  createdAt: string
  email: string
  avatar: string
  postId: string
}

export interface CreatePostRequest {
  content: string
  userId?: number
}

export interface CreateCommentRequest {
  postId: number
  userId?: number
  content: string
}

export interface UpdatePostRequest {
  content: string
}

export interface UpdateCommentRequest {
  postId: string
  userId?: number
  content: string
}
