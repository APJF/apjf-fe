"use client"

import type React from "react"
import { useState } from "react"
import { StarInput } from "../ui/StarInput"
import { useLanguage } from "../../contexts/LanguageContext"

export interface NewReviewInput {
  rating: number
  comment: string
}

export default function ReviewForm({
  onSubmit,
  initialData,
  isEditing = false,
  onCancelEdit,
}: Readonly<{
  onSubmit: (data: NewReviewInput) => Promise<void> | void
  initialData?: NewReviewInput
  isEditing?: boolean
  onCancelEdit?: () => void
}>) {
  const { t } = useLanguage()
  const [rating, setRating] = useState(initialData?.rating || 0)
  const [comment, setComment] = useState(initialData?.comment || "")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    
    console.log('🔍 ReviewForm.handleSubmit - Starting validation');
    console.log('📊 Current rating value:', rating, 'type:', typeof rating);
    console.log('💬 Current comment:', comment.trim());
    
    if (!comment.trim() || comment.trim().length < 8) {
      setError(t('courseDetail.reviewMinLength'))
      return
    }
    if (rating === 0 || rating < 0.5 || rating > 5) {
      console.warn('⚠️ Invalid rating:', rating);
      setError(t('courseDetail.selectRating'))
      return
    }
    
    console.log('✅ Validation passed - submitting review');
    setSubmitting(true)
    try {
      await onSubmit({ rating, comment: comment.trim()})
      if (!isEditing) {
        setMessage(t('courseDetail.thankYouForReview'))
        setComment("")
        setRating(0)
      }
    } catch {
      setError(t('courseDetail.submitReviewError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
      {/* Review text (compact) */}
      <div>
        <label htmlFor="comment" className="text-xs font-semibold text-gray-700 mb-1 block">
          {isEditing ? t('courseDetail.editReview') : t('courseDetail.writeReview')}
        </label>
        <textarea
          id="comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:ring-1 focus:ring-rose-700 focus:border-transparent"
          placeholder={t('courseDetail.reviewPlaceholder')}
        />
      </div>

      {/* Stars + Submit: same row, tight spacing */}
      <div className="mt-1 flex items-center gap-3">
        <StarInput value={rating} onChange={setRating} />
        <div className="ml-auto flex items-center gap-2">
          {isEditing && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="h-8 px-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              {t('courseDetail.cancelEdit')}
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="h-8 px-3 rounded-lg bg-rose-700 text-white text-sm font-medium hover:bg-rose-800 disabled:opacity-60"
            aria-label={isEditing ? t('courseDetail.updateReview') : t('courseDetail.submitReview')}
          >
            {(() => {
              if (submitting) return t('courseDetail.submittingReview')
              if (isEditing) return t('courseDetail.updateReview')
              return t('courseDetail.submitReview')
            })()}
          </button>
        </div>
      </div>

      {/* Messages (only render when needed to avoid extra empty space) */}
      {(error || message) && (
        <div className="mt-1 text-xs" aria-live="polite">
          {error && <span className="text-rose-700">{error}</span>}
          {!error && message && <span className="text-green-600">{message}</span>}
        </div>
      )}
    </form>
  )
}
