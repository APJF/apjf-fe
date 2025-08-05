"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import { Card, CardContent, CardHeader } from "../ui/Card"
import { Input } from "../ui/Input"
import { Textarea } from "../ui/Textarea"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar"
import { Separator } from "../ui/Separator"
import { MessageSquare, Flag, Send, MoreHorizontal, AlertTriangle, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/DropdownMenu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/Dialog"
import { postApi, commentApi } from "../../services/forumService"
import { reportApi } from "../../services/reportService"
import { useAuth } from "../../hooks/useAuth"

interface Comment {
  id: string
  content: string
  createdAt: string
  email: string
  avatar: string
  postId: string
}

interface Post {
  id: string
  content: string
  createdAt: string
  email: string
  avatar: string
  comments: Comment[]

}

const formatTimeAgo = (dateString: string) => {
  const now = new Date()
  const postDate = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} giây trước`
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} phút trước`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} giờ trước`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ngày trước`
  } else {
    return postDate.toLocaleDateString("vi-VN")
  }
}

export default function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState({ content: "" })
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({})
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportTarget, setReportTarget] = useState<{ type: "post" | "comment"; id: string } | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<{ id: string; content: string } | null>(null)
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null)

  const { user } = useAuth();

  // Add polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts()
    }, 60000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Fetch initial posts
  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const data = await postApi.getAllPosts()
      setPosts(data.data)
    } catch (error) {
      console.error("Error fetching posts:", error)
    }
  }


  const createPost = async () => {
    if (!newPost.content.trim()) return

    try {
      await postApi.createPost({
        content: newPost.content,
        userId: user?.id, // ID thực tế của user hiện tại
      })
      setNewPost({ content: "" })
      setIsCreatePostOpen(false)
      fetchPosts()
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }


  const addComment = async (postId: string) => {
    const content = newComment[postId]?.trim()
    if (!content) return

    try {
      await commentApi.createComment({
        postId: Number(postId),
        userId: user?.id, // ID thực tế của user hiện tại
        content,
      })
      setNewComment((prev) => ({ ...prev, [postId]: "" }))
      fetchPosts()
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const reportContent = async () => {
    if (!reportTarget || !reportReason.trim()) {
      return
    }

    try {
      await reportApi.createReport({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason,
      })

      setIsReportOpen(false)
      setReportReason("")
      setReportTarget(null)
      
      // Show success message
      console.log("Report submitted successfully")
    } catch (error) {
      console.error("Error reporting content:", error)
    }
  }

  const openReport = (type: "post" | "comment", id: string) => {
    setReportTarget({ type, id })
    setIsReportOpen(true)
  }
  const deletePost = async (postId: string) => {
    try {
      await postApi.deletePost(
        postId
      )
      fetchPosts()
    } catch (error) {
      console.error("Error delete post:", error)
    }

  }

  const updatePost = async (postId: string, content: string) => {
    try {
      await postApi.updatePost(postId, {
        content
      })
      setEditingPost(null)
      fetchPosts()
    } catch (error) {
      console.error("Error update post:", error)
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await commentApi.deleteComment(commentId)
      fetchPosts()
    } catch (error) {
      console.error("Error delete comment:", error)
    }
  }

  const updateComment = async (commentId: string, content: string, postId: string) => {
    try {
      await commentApi.updateComment(commentId, {
        postId: postId,
        userId: user?.id,
        content,
      })
      setEditingComment(null)
      fetchPosts()
    } catch (error) {
      console.error("Error update comment:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-0 py-8">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 mb-8">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 ring-2 ring-blue-200">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.username} />

              </Avatar>
              <div className="flex-1">
                <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                  <DialogTrigger asChild>
                    <div className="bg-slate-50 hover:bg-slate-100 rounded-full px-6 py-3 cursor-pointer transition-colors border border-slate-200">
                      <span className="text-slate-500">Bạn đang nghĩ gì?</span>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] bg-white rounded-2xl border-0 shadow-2xl">
                    <DialogHeader className="space-y-3">
                      <DialogTitle className="text-2xl font-bold text-slate-800">Tạo bài viết</DialogTitle>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.username} />

                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-800">{user?.username}</p>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                        placeholder="Bạn đang nghĩ gì?"
                        className="border-0 resize-none text-lg placeholder:text-slate-400 focus:ring-0 min-h-[120px]"
                      />

                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Thêm vào bài viết của bạn</span>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
                            <span className="text-green-500 text-xl">📷</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
                            <span className="text-blue-500 text-xl">👥</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0">
                            <span className="text-yellow-500 text-xl">😊</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={createPost}
                        disabled={!newPost.content.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Đăng
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2"
                >
                  <span className="text-red-500 text-xl">❤️</span>
                  <span className="font-medium">Cảm xúc</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2"
                >
                  <span className="text-green-500 text-xl">📷</span>
                  <span className="font-medium">Ảnh/Video</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2"
                >
                  <span className="text-blue-500 text-xl">📍</span>
                  <span className="font-medium">Check in</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="space-y-8">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-14 h-14 ring-4 ring-white shadow-lg">
                        <AvatarImage src={post.avatar || "/placeholder.svg"} alt={post.email} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-lg">
                          {post.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="font-medium text-slate-600">{post.email}</span>
                        <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                        <span>{formatTimeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-full hover:bg-slate-100">
                        <MoreHorizontal className="w-5 h-5 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-xl shadow-lg border-0 ml-auto" >
                      {post.email === user?.email && (
                        <>
                          <DropdownMenuItem
                            onClick={() => setEditingPost({ id: post.id, content: post.content })}
                            className="rounded-lg text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deletePost(post.id)}
                            className="rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => openReport("post", post.id)}
                        className="rounded-lg text-orange-600 focus:text-orange-700 focus:bg-orange-50"
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Báo cáo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

              </CardHeader>

              <CardContent className="p-8">
                {editingPost?.id === post.id ? (
                  <div className="space-y-4 mb-6">

                    <Textarea
                      value={editingPost.content}
                      onChange={(e) => setEditingPost((prev) => (prev ? { ...prev, content: e.target.value } : null))}
                      placeholder="Nội dung bài viết..."
                      rows={4}
                      className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => updatePost(post.id, editingPost.content)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-amber-50"
                      >
                        Lưu
                      </Button>
                      <Button variant="outline" onClick={() => setEditingPost(null)} className="rounded-xl">
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 text-lg leading-relaxed mb-6">{post.content}</p>
                )}

                <div className="flex items-center gap-6 mb-6">
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => likePost(post.id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 ${
                      post.isLiked
                        ? "text-red-500 bg-red-50 hover:bg-red-100"
                        : "text-slate-600 hover:text-red-500 hover:bg-red-50"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.isLiked ? "fill-current" : ""}`} />
                    <span className="font-medium">{post.likes}</span>
                  </Button> */}

                  <div className="flex items-center gap-2 text-slate-500">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium">{post.comments.length} bình luận</span>
                  </div>
                </div>

                <Separator className="my-6 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Comments Section */}
                <div className="space-y-4">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 group">
                      <Avatar className="w-10 h-10 ring-2 ring-slate-100">
                        <AvatarImage src={comment.avatar || "/placeholder.svg"} alt={comment.email} />
                        <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-600 text-white text-sm">
                          {comment.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-800 text-sm">{comment.email}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="rounded-xl shadow-lg border-0 ml-auto" >
                                {comment.email === user?.email && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                                      className="rounded-lg text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Chỉnh sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => deleteComment(comment.id)}
                                      className="rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Xóa
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={() => openReport("comment", comment.id)}
                                  className="rounded-lg text-orange-600 focus:text-orange-700 focus:bg-orange-50"
                                >
                                  <Flag className="w-4 h-4 mr-2" />
                                  Báo cáo
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {editingComment?.id === comment.id ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editingComment.content}
                                onChange={(e) =>
                                  setEditingComment((prev) => (prev ? { ...prev, content: e.target.value } : null))
                                }
                                className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => updateComment(comment.id, editingComment.content, post.id)}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-amber-50"
                                >
                                  Lưu
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingComment(null)}
                                  className="rounded-xl"
                                >
                                  Hủy
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-700 leading-relaxed">{comment.content}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 ml-4">{formatTimeAgo(comment.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="flex gap-4 mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl">
                  <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.username} />
                  </Avatar>
                  <div className="flex-1 flex gap-3">
                    <Input
                      placeholder="Viết bình luận..."
                      value={newComment[post.id] || ""}
                      onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          addComment(post.id)
                        }
                      }}
                      className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white/80"
                    />
                    <Button
                      size="sm"
                      onClick={() => addComment(post.id)}
                      disabled={!newComment[post.id]?.trim()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl px-4 shadow-lg disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Dialog */}
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl">
            <DialogHeader className="space-y-3">
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                Báo cáo nội dung
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Vui lòng cho biết lý do báo cáo nội dung này
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <Textarea
                placeholder="Mô tả lý do báo cáo..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                className="rounded-xl border-slate-200 focus:border-red-500 focus:ring-red-500/20 resize-none"
              />
            </div>
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setIsReportOpen(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button
                onClick={reportContent}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg"
              >
                Gửi báo cáo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
