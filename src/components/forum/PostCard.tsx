"use client"

import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar"
import { Button } from "../ui/Button"
import { Card, CardContent, CardHeader } from "../ui/Card"
import { Input } from "../ui/Input"
import { Heart, MessageCircle, MoreHorizontal, Trash2, Flag, Send } from "lucide-react"
import { CommentSection } from "./CommentSection"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu"

interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
}

interface Post {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
  comments: Comment[]
  showComments: boolean
}

export function PostCard({
  post,
  commentInput,
  onLike,
  onLikeComment,
  onToggleComments,
  onCommentInputChange,
  onAddComment,
  onReport,
  onDelete,
  onToggleCommentMenu,
  onDeleteComment,
  onReportComment,
  currentUserEmail,
  userAvatar
}: Readonly<{
  post: Post
  commentInput: string
  showReportMenu: boolean
  showCommentMenus: { [key: string]: boolean }
  onLike: () => void
  onLikeComment: (commentId: string) => void
  onToggleComments: () => void
  onCommentInputChange: (value: string) => void
  onAddComment: () => void
  onToggleReportMenu: () => void
  onReport: (reason: string) => void
  onDelete: () => void
  onToggleCommentMenu: (commentId: string) => void
  onDeleteComment: (commentId: string) => void
  onReportComment: (commentId: string, reason: string) => void
  currentUserEmail?: string
  userAvatar?: string
}>) {
  const canModifyPost = currentUserEmail === post.author

  return (
    <Card className="bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 ring-2 ring-gray-100">
              <AvatarImage src={post.avatar} alt={post.author} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {post.author.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{post.author}</p>
              <p className="text-sm text-gray-500">{post.timestamp}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {canModifyPost && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa bài viết
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onReport("Nội dung không phù hợp")}>
                <Flag className="mr-2 h-4 w-4" />
                Báo cáo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-6 py-2 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={`flex items-center space-x-2 ${
              post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span>{post.likes}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleComments}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.comments.length}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {post.showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Existing Comments */}
            <CommentSection
              comments={post.comments}
              commentInput={commentInput}
              showCommentMenus={{}}
              onCommentInputChange={onCommentInputChange}
              onAddComment={onAddComment}
              onLikeComment={onLikeComment}
              onToggleCommentMenu={onToggleCommentMenu}
              onDeleteComment={onDeleteComment}
              onReportComment={onReportComment}
              currentUserEmail={currentUserEmail}
              userAvatar={userAvatar}
            />
            
            {/* Add New Comment */}
            <div className="flex items-center space-x-3 mt-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={userAvatar} alt="Your avatar" />
                <AvatarFallback>
                  {currentUserEmail?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex space-x-2">
                <Input
                  placeholder="Viết bình luận..."
                  value={commentInput}
                  onChange={(e) => onCommentInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      onAddComment()
                    }
                  }}
                  className="rounded-full bg-gray-50 border-gray-200"
                />
                <Button
                  size="sm"
                  onClick={onAddComment}
                  disabled={!commentInput.trim()}
                  className="rounded-full bg-blue-500 hover:bg-blue-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
