"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar"
import { Button } from "../ui/Button"
import { Card, CardContent } from "../ui/Card"
import { Textarea } from "../ui/Textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/Dialog"

interface CreatePostCardProps {
  readonly onCreatePost: (content: string) => void
  readonly userAvatar?: string
  readonly userName?: string
}

export function CreatePostCard({ onCreatePost, userAvatar, userName = "Bạn" }: CreatePostCardProps) {
  const [newPost, setNewPost] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const handleCreatePost = () => {
    if (!newPost.trim()) return
    onCreatePost(newPost)
    setNewPost("")
    setIsOpen(false) // Close dialog after posting
  }

  return (
    <Card className="mb-8 shadow-sm border border-gray-200 bg-white rounded-2xl">
      <CardContent className="p-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <div className="flex items-center space-x-4 cursor-pointer">
              <Avatar className="w-12 h-12 ring-2 ring-gray-100">
                <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <span className="text-gray-600 text-base">Bạn đang nghĩ gì?</span>
              </div>
            </div>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-white border border-gray-200 shadow-xl">
            <DialogHeader className="p-4 pb-2 border-b border-gray-100">
              <DialogTitle className="text-lg font-semibold text-center text-gray-900">Tạo bài viết</DialogTitle>
            </DialogHeader>

            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-900">{userName}</span>
              </div>

              <Textarea
                placeholder="Bạn đang nghĩ gì?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[120px] resize-none border-0 p-0 focus-visible:ring-0 text-base placeholder:text-gray-500 bg-transparent mb-6"
                autoFocus
              />

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Đăng bài
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
