"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar"
import { Button } from "../ui/Button"
import { Card, CardContent, CardHeader } from "../ui/Card"
import { Textarea } from "../ui/Textarea"
import { Heart, MessageCircle, MoreHorizontal, Trash2, Flag, Edit, Save, X } from "lucide-react"
import { CommentSection } from "./CommentSection"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu"

interface Comment {
  id: string
  author: string
  authorEmail?: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
}

interface Post {
  id: string
  author: string
  authorEmail?: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  isLiked: boolean
  comments: Comment[]
  showComments: boolean
  commentsCount: number
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
  onEdit,
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
  onEdit?: (newContent: string) => void
  onDeleteComment: (commentId: string) => void
  onReportComment: (commentId: string, reason: string) => void
  currentUserEmail?: string
  userAvatar?: string
}>) {
  const canModifyPost = currentUserEmail === (post.authorEmail || post.author)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)

  // Debug logging
  console.log(`📝 PostCard ${post.id}: isEditing=${isEditing}, editContent="${editContent.substring(0, 20)}...", post.content="${post.content.substring(0, 20)}..."`);

  // Only sync editContent when not in editing mode
  useEffect(() => {
    if (!isEditing) {
      console.log(`🔄 PostCard ${post.id}: Syncing editContent with post.content`);
      setEditContent(post.content)
    }
  }, [post.content, post.id, isEditing])

  const handleSaveEdit = () => {
    console.log(`💾 PostCard ${post.id}: Saving edit`);
    if (onEdit && editContent.trim() !== post.content) {
      onEdit(editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    console.log(`❌ PostCard ${post.id}: Canceling edit`);
    setEditContent(post.content)
    setIsEditing(false)
  }

  const handleStartEdit = () => {
    console.log(`✏️ PostCard ${post.id}: Starting edit mode`);
    setIsEditing(true);
  }

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
              {canModifyPost ? (
                <>
                  <DropdownMenuItem onClick={handleStartEdit} className="text-blue-600">
                    <Edit className="mr-2 h-4 w-4" />
                    Sửa bài viết
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa bài viết
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => onReport("")}>
                  <Flag className="mr-2 h-4 w-4" />
                  Báo cáo
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none"
              placeholder="Nội dung bài viết..."
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 mr-1" />
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || editContent.trim() === post.content}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-1" />
                Lưu
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 mb-4 leading-relaxed">{post.content}</p>
        )}
        
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
            <span>{post.commentsCount}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {post.showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Existing Comments */}
            <CommentSection
              comments={post.comments}
              commentInput={commentInput}
              onCommentInputChange={onCommentInputChange}
              onAddComment={onAddComment}
              onLikeComment={onLikeComment}
              onDeleteComment={onDeleteComment}
              onReportComment={onReportComment}
              currentUserEmail={currentUserEmail}
              userAvatar={userAvatar}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
