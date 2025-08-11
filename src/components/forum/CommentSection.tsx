"use client"

import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Send, MoreHorizontal, Trash2, Flag, Heart } from "lucide-react"
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

interface CommentSectionProps {
  readonly comments: Comment[]
  readonly commentInput: string
  readonly onCommentInputChange: (value: string) => void
  readonly onAddComment: () => void
  readonly onLikeComment: (commentId: string) => void
  readonly onDeleteComment: (commentId: string) => void
  readonly onReportComment: (commentId: string, reason: string) => void
  readonly currentUserEmail?: string
  readonly userAvatar?: string
}

export function CommentSection({
  comments,
  commentInput,
  onCommentInputChange,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onReportComment,
  currentUserEmail,
  userAvatar
}: CommentSectionProps) {
  return (
    <div className="mt-6 pt-4 border-t border-gray-100">
      {/* Existing Comments */}
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-3 mb-4 group">
          <Avatar className="w-10 h-10 ring-2 ring-gray-100">
            <AvatarImage src={comment.avatar || "/placeholder.svg"} alt={comment.author} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-semibold text-sm">
              {comment.author.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="bg-gray-50 rounded-2xl px-4 py-3 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900 mb-1">{comment.author}</p>
                  <p className="text-gray-800 text-sm leading-relaxed">{comment.content}</p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 rounded-full hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-44 border border-gray-200 shadow-lg">
                    {comment.author === currentUserEmail ? (
                      <DropdownMenuItem
                        onClick={() => onDeleteComment(comment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Xóa bình luận
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onReportComment(comment.id, "Nội dung không phù hợp")}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
                      >
                        <Flag className="h-3 w-3 mr-2" />
                        Báo cáo bình luận
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Comment Actions */}
            <div className="flex items-center space-x-4 mt-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLikeComment(comment.id)}
                className={`flex items-center space-x-1 rounded-full px-2 py-1 text-xs transition-all duration-200 ${
                  comment.isLiked ? "text-red-600 bg-red-50 hover:bg-red-100" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Heart className={`h-3 w-3 ${comment.isLiked ? "fill-current" : ""}`} />
                {comment.likes > 0 && <span className="font-medium">{comment.likes}</span>}
              </Button>
              <p className="text-xs text-gray-500">{comment.timestamp}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Add Comment */}
      <div className="flex space-x-3 mt-4">
        <Avatar className="w-10 h-10 ring-2 ring-gray-100">
          <AvatarImage src={userAvatar || "/placeholder.svg"} alt="Bạn" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
            B
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex space-x-3">
          <Input
            placeholder="Viết bình luận..."
            value={commentInput}
            onChange={(e) => onCommentInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAddComment()
              }
            }}
            className="rounded-full border-gray-200 bg-gray-50 focus:bg-white transition-colors px-4 py-2.5"
          />
          <Button
            size="icon"
            onClick={onAddComment}
            disabled={!commentInput.trim()}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
