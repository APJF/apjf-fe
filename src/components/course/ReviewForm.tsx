"use client"

import type React from "react"
import { useState } from "react"
import { StarInput } from "../ui/StarInput"

export interface NewReviewInput {
  rating: number
  comment: string
  user?: string
}

export default function ReviewForm({
  onSubmit,
}: Readonly<{
  onSubmit: (data: NewReviewInput) => Promise<void> | void
}>) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!comment.trim() || comment.trim().length < 8) {
      setError("Vui lòng viết đánh giá ít nhất 8 ký tự.")
      return
    }
    if (rating === 0) {
      setError("Vui lòng chọn số sao đánh giá.")
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ rating, comment: comment.trim() })
      setMessage("Cảm ơn bạn đã đánh giá!")
      setComment("")
      setRating(0)
    } catch {
      setError("Không thể gửi đánh giá. Vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
      {/* Review text (compact) */}
      <div>
        <label htmlFor="comment" className="text-xs font-semibold text-gray-700 mb-1 block">
          Đánh giá của bạn
        </label>
        <textarea
          id="comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2.5 text-sm focus:ring-1 focus:ring-rose-700 focus:border-transparent"
          placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
        />
      </div>

      {/* Stars + Submit: same row, tight spacing */}
      <div className="mt-1 flex items-center gap-3">
        <StarInput value={rating} onChange={setRating} />
        <button
          type="submit"
          disabled={submitting}
          className="ml-auto h-8 px-3 rounded-lg bg-rose-700 text-white text-sm font-medium hover:bg-rose-800 disabled:opacity-60"
          aria-label="Submit review"
        >
          {submitting ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
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
