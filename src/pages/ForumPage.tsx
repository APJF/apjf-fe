import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { forumAPIService } from "../services/forumAPIService";
import { commentAPIService } from "../services/commentAPIService";
import type { PostResponse } from "../services/forumAPIService";
import { Breadcrumb, type BreadcrumbItem } from '../components/ui/Breadcrumb';
import { CreatePostCard } from "../components/forum/CreatePostCard";
import { PostCard } from "../components/forum/PostCard";
import type { Post } from "../types/forum";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/Alert";

// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Vừa mới';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`;
  return `${Math.floor(diffInSeconds / 31536000)} năm trước`;
};

// Convert API post to UI post format
const convertAPIPostToUIPost = (apiPost: PostResponse): Post => {
  // Use updatedAt if available and different from createdAt, otherwise use createdAt
  const displayTime = apiPost.updatedAt && apiPost.updatedAt !== apiPost.createdAt 
    ? apiPost.updatedAt 
    : apiPost.createdAt;
    
  return {
    id: apiPost.id.toString(), // Convert number to string
    author: apiPost.email,
    avatar: apiPost.avatar,
    content: apiPost.content,
    timestamp: formatTimeAgo(displayTime), // Show most recent activity time
    likes: 0, // Not provided by current API
    isLiked: false,
    comments: [], // Create new empty array for each post
    showComments: false,
    commentsCount: apiPost.commentsCount
  };
};

export function ForumPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showReportMenu, setShowReportMenu] = useState(false);

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Cộng đồng' }
  ];

  // Load posts from API
  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apiPosts = await forumAPIService.getPostsWithAvatars();
      
      // Sort by "latest activity" - updatedAt if available, otherwise createdAt (newest first)
      apiPosts.sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime; // Newest first
      });
      
      // Then convert to UI format
      const uiPosts = apiPosts.map(convertAPIPostToUIPost);
      
      setPosts(uiPosts);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Không thể tải bài viết. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  // Handle create post
  const handleCreatePost = async (content: string) => {
    try {
      setError(null);
      
      // Call API to create post
      const response = await forumAPIService.createPost(content);
      
      if (response.success) {
        // Reload posts to show the new post
        await loadPosts();
      } else {
        setError('Không thể tạo bài viết. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Không thể tạo bài viết. Vui lòng thử lại.');
    }
  };

  // Handle like post
  const handleLikePost = async (postId: string) => {
    try {
      // TODO: Implement like post API call
      console.log('Liking post:', postId);
      
      // For now, just update UI optimistically
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // Handle toggle comments - load comments when expanding
  const handleToggleComments = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const isCurrentlyShowing = post.showComments;
      
      // If hiding comments, just toggle
      if (isCurrentlyShowing) {
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId 
              ? { ...p, showComments: false }
              : p
          )
        );
        return;
      }

      // If showing comments, toggle first then load if needed
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, showComments: true }
            : p
        )
      );

      // Load comments if we don't have any loaded yet
      if (post.comments.length === 0) {
        const comments = await commentAPIService.getCommentsWithAvatars(parseInt(postId));
        
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId 
              ? { ...p, comments: comments }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Handle comment input change
  const handleCommentInputChange = (postId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  // Handle add comment
  const handleAddComment = async (postId: string) => {
    try {
      const content = commentInputs[postId]?.trim();
      if (!content || !user?.id) return;

      const request = {
        content,
        userId: typeof user.id === 'string' ? parseInt(user.id) : user.id,
        postId: parseInt(postId)
      };

      const response = await commentAPIService.createComment(request);
      
      if (response.success) {
        // Clear input
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        
        // Reload comments for this post
        const comments = await commentAPIService.getCommentsWithAvatars(parseInt(postId));
        
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, comments: comments, commentsCount: comments.length }
              : post
          )
        );
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Không thể thêm bình luận. Vui lòng thử lại.');
    }
  };

  // Handle like comment
  const handleLikeComment = (commentId: string) => {
    // TODO: Implement like comment API call
    console.log('Liking comment:', commentId);
    
    // Update UI optimistically
    setPosts(prevPosts => 
      prevPosts.map(post => ({
        ...post,
        comments: post.comments.map(comment => 
          comment.id === commentId 
            ? { ...comment, isLiked: !comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 }
            : comment
        )
      }))
    );
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await commentAPIService.deleteComment(parseInt(commentId));
      
      if (response.success) {
        // Remove comment from UI and update count
        setPosts(prevPosts => 
          prevPosts.map(post => {
            const updatedComments = post.comments.filter(comment => comment.id !== commentId);
            return {
              ...post,
              comments: updatedComments,
              commentsCount: updatedComments.length
            };
          })
        );
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Không thể xóa bình luận. Vui lòng thử lại.');
    }
  };

  // Handle report comment
  const handleReportComment = (commentId: string, reason: string) => {
    // TODO: Implement report comment API call
    console.log('Reporting comment:', commentId, reason);
    // Show success message or handle response
  };

  // Handle report post
  const handleReportPost = (postId: string, reason: string) => {
    try {
      // TODO: Implement report API call
      console.log('Reporting post:', postId, reason);
      setShowReportMenu(false);
    } catch (err) {
      console.error('Error reporting post:', err);
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    try {
      // TODO: Implement delete API call
      console.log('Deleting post:', postId);
      
      // Remove from UI optimistically
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Handle edit post
  const handleEditPost = async (postId: string, newContent: string) => {
    try {
      setError(null);
      
      console.log('🔍 Editing post:', { postId, newContent });
      
      // Call API to update post
      const response = await forumAPIService.updatePost(parseInt(postId), newContent);
      
      if (response.success) {
        console.log('✅ API update successful');
        
        // Reload all posts to get updated timestamps and proper sorting
        await loadPosts();
      } else {
        setError('Không thể cập nhật bài viết. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error updating post:', err);
      setError('Không thể cập nhật bài viết. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 mx-auto mb-4 animate-spin border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="text-gray-600">Đang tải bài viết...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cộng đồng</h1>
            <p className="text-gray-600">Chia sẻ và thảo luận với cộng đồng học viên</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Create Post Card */}
        <div className="mb-8">
          <CreatePostCard 
            userAvatar={user?.avatar || '/img/default-avatar.svg'}
            onCreatePost={handleCreatePost}
          />
        </div>

        {/* Posts */}
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              commentInput={commentInputs[post.id] || ''}
              showReportMenu={showReportMenu}
              showCommentMenus={{}}
              onLike={() => handleLikePost(post.id)}
              onLikeComment={(commentId: string) => handleLikeComment(commentId)}
              onToggleComments={() => handleToggleComments(post.id)}
              onCommentInputChange={(value: string) => handleCommentInputChange(post.id, value)}
              onAddComment={() => handleAddComment(post.id)}
              onToggleReportMenu={() => setShowReportMenu(!showReportMenu)}
              onReport={(reason: string) => handleReportPost(post.id, reason)}
              onDelete={() => handleDeletePost(post.id)}
              onEdit={(newContent: string) => handleEditPost(post.id, newContent)}
              onDeleteComment={(commentId: string) => handleDeleteComment(commentId)}
              onReportComment={(commentId: string, reason: string) => 
                handleReportComment(commentId, reason)
              }
              currentUserEmail={user?.email}
              userAvatar={user?.avatar || '/img/default-avatar.svg'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ForumPage;
