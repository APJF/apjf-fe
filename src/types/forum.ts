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
