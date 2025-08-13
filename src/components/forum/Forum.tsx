"use client"

import { useState, useEffect } from "react"
import { CreatePostCard } from "./CreatePostCard"
import { PostCard } from "./PostCard"
import { useAuth } from "../../hooks/useAuth"
import { postApi, commentApi } from "../../services/forumService"
import { reportApi } from "../../services/reportService"
import type { Post, Comment, ForumPost, ForumComment } from "../../types/forum"

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

const convertForumPostToPost = (forumPost: ForumPost): Post => {
  return {
    id: forumPost.id,
    author: forumPost.email,
    avatar: forumPost.avatar || "/placeholder.svg",
    content: forumPost.content,
    timestamp: formatTimeAgo(forumPost.createdAt),
    likes: 0, // Backend doesn't provide likes yet
    isLiked: false,
    comments: forumPost.comments.map(convertForumCommentToComment),
    showComments: false
  }
}

const convertForumCommentToComment = (forumComment: ForumComment): Comment => {
  return {
    id: forumComment.id,
    author: forumComment.email,
    avatar: forumComment.avatar || "/placeholder.svg",
    content: forumComment.content,
    timestamp: formatTimeAgo(forumComment.createdAt),
    likes: 0, // Backend doesn't provide likes yet
    isLiked: false
  }
}

export default function SocialForum() {
  const [posts, setPosts] = useState<Post[]>([])
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({})
  const [showReportMenu, setShowReportMenu] = useState<{[key: string]: boolean}>({})
  const [showCommentMenus, setShowCommentMenus] = useState<{[key: string]: boolean}>({})

  const { user } = useAuth()

  // Fetch posts from backend
  useEffect(() => {
    fetchPosts()
  }, [])

  // Add polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPosts()
    }, 60000) // Poll every minute

    return () => clearInterval(interval)
  }, [])

  const fetchPosts = async () => {
    try {
      const data = await postApi.getAllPosts()
      const convertedPosts = data.data.map(convertForumPostToPost)
      setPosts(convertedPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
    }
  }

  const handleCreatePost = async (content: string) => {
    try {
      await postApi.createPost({
        content,
        userId: user?.id,
      })
      fetchPosts() // Refresh posts after creating
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        }
      }
      return post
    }))
  }

  const handleLikeComment = (postId: string, commentId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: !comment.isLiked,
                likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
              }
            }
            return comment
          })
        }
      }
      return post
    }))
  }

  const toggleComments = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return { ...post, showComments: !post.showComments }
      }
      return post
    }))
  }

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId]
    if (!commentText?.trim()) return

    try {
      await commentApi.createComment({
        postId: Number(postId),
        userId: user?.id,
        content: commentText,
      })
      setCommentInputs({ ...commentInputs, [postId]: "" })
      fetchPosts() // Refresh posts after adding comment
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const updateCommentInput = (postId: string, value: string) => {
    setCommentInputs({ ...commentInputs, [postId]: value })
  }

  const toggleReportMenu = (postId: string) => {
    setShowReportMenu(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  const handleReport = async (postId: string, reason: string) => {
    try {
      await reportApi.createReport({
        targetType: "post",
        targetId: postId,
        reason: reason,
      })
      alert(`Đã báo cáo bài viết với lý do: ${reason}`)
      setShowReportMenu(prev => ({ ...prev, [postId]: false }))
    } catch (error) {
      console.error("Error reporting post:", error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await postApi.deletePost(postId)
        fetchPosts() // Refresh posts after deletion
      } catch (error) {
        console.error("Error deleting post:", error)
      }
    }
  }

  const toggleCommentMenu = (postId: string, commentId: string) => {
    const key = `${postId}-${commentId}`
    setShowCommentMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      try {
        await commentApi.deleteComment(commentId)
        fetchPosts() // Refresh posts after deletion
      } catch (error) {
        console.error("Error deleting comment:", error)
      }
    }
    const key = `${postId}-${commentId}`
    setShowCommentMenus(prev => ({ ...prev, [key]: false }))
  }

  const handleReportComment = async (postId: string, commentId: string, reason: string) => {
    try {
      await reportApi.createReport({
        targetType: "comment",
        targetId: commentId,
        reason: reason,
      })
      alert(`Đã báo cáo bình luận với lý do: ${reason}`)
      const key = `${postId}-${commentId}`
      setShowCommentMenus(prev => ({ ...prev, [key]: false }))
    } catch (error) {
      console.error("Error reporting comment:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      <main className="max-w-2xl mx-auto px-4 py-8 relative">
        <CreatePostCard 
          onCreatePost={handleCreatePost}
          userAvatar={user?.avatar || undefined}
          userName={user?.username || user?.email || "Bạn"}
        />

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              commentInput={commentInputs[post.id] || ""}
              showReportMenu={showReportMenu[post.id] || false}
              showCommentMenus={Object.fromEntries(
                Object.entries(showCommentMenus)
                  .filter(([key]) => key.startsWith(`${post.id}-`))
                  .map(([key, value]) => [key.split('-')[1], value])
              )}
              onLike={() => handleLike(post.id)}
              onLikeComment={(commentId) => handleLikeComment(post.id, commentId)}
              onToggleComments={() => toggleComments(post.id)}
              onCommentInputChange={(value) => updateCommentInput(post.id, value)}
              onAddComment={() => handleAddComment(post.id)}
              onToggleReportMenu={() => toggleReportMenu(post.id)}
              onReport={(reason) => handleReport(post.id, reason)}
              onDelete={() => handleDeletePost(post.id)}
              onToggleCommentMenu={(commentId) => toggleCommentMenu(post.id, commentId)}
              onDeleteComment={(commentId) => handleDeleteComment(post.id, commentId)}
              onReportComment={(commentId, reason) => handleReportComment(post.id, commentId, reason)}
              currentUserEmail={user?.email}
              userAvatar={user?.avatar || undefined}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
