import React, { useState } from 'react'
import { X, Star, Trash2, User } from 'lucide-react'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import type { Review } from '../../types/review'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  reviews: Review[]
  onDeleteReview: (reviewId: number) => Promise<void>
  courseTitle: string
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  reviews,
  onDeleteReview,
  courseTitle
}) => {
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0
    const total = reviews.reduce((sum, review) => sum + review.rating, 0)
    return total / reviews.length
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating: number) => {
    const maxStars = 5
    const fullStars = Math.floor(rating) // Số sao vàng đầy đủ
    const fractionalStar = rating - fullStars // Phần thập phân
    const stars = []

    for (let i = 0; i < maxStars; i++) {
      if (i < fullStars) {
        // Sao vàng đầy đủ
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-yellow-400 fill-yellow-400 inline-block"
          />
        )
      } else if (i === fullStars && fractionalStar > 0) {
        // Sao vàng một phần
        stars.push(
          <span key={i} className="relative inline-block w-4 h-4">
            <Star className="h-4 w-4 text-gray-300 absolute" />
            <span
              className="absolute overflow-hidden"
              style={{ width: `${fractionalStar * 100}%` }}
            >
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </span>
          </span>
        )
      } else {
        // Sao rỗng
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-gray-300 inline-block"
          />
        )
      }
    }

    return <div className="flex items-center gap-1">{stars}</div>
  }

  const handleDeleteConfirm = async () => {
    if (!deleteReviewId) return

    setIsDeleting(true)
    try {
      await onDeleteReview(deleteReviewId)
      setDeleteReviewId(null)
    } catch (error) {
      console.error('Error deleting review:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <button 
        className="fixed inset-0 backdrop-blur z-40 border-0 p-0 m-0 cursor-default"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose()
          }
        }}
        aria-label="Đóng modal"
        type="button"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Đánh giá khóa học
              </h2>
              <p className="text-gray-600 mt-1">{courseTitle}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center">
                  {renderStars(calculateAverageRating())}
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {calculateAverageRating().toFixed(1)}
                </span>
                <span className="text-gray-500">
                  ({reviews.length} đánh giá)
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">Chưa có đánh giá nào</p>
                <p className="text-gray-400 text-sm mt-1">
                  Khóa học này chưa nhận được đánh giá từ học viên
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {review.user.avatar ? (
                            <img
                              src={review.user.avatar}
                              alt={review.user.username}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const nextElement = target.nextElementSibling as HTMLElement
                                if (nextElement) {
                                  nextElement.classList.remove('hidden')
                                }
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center ${review.user.avatar ? 'hidden' : ''}`}>
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>

                        {/* Review Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {review.user.username}
                            </span>
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-gray-500">
                              {review.rating.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">
                            {review.comment}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteReviewId(review.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteReviewId !== null}
        onClose={() => setDeleteReviewId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa đánh giá"
        description="Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}
