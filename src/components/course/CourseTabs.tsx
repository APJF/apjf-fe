"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/Tabs"
import { Avatar, AvatarFallback } from "../ui/Avatar"
import { StarDisplay } from "../ui/StarDisplay"
import ReviewForm, { type NewReviewInput } from "./ReviewForm"
import { useMemo, useState, useEffect, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ExamService, type CourseExam } from "../../services/examService"
import { Clock, FileText, AlertCircle, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useLanguage } from "../../contexts/LanguageContext"
import { ReviewService, type CreateReviewData } from "../../services/reviewService"
import type { Review } from "../../types/review"
import { useToast } from "../../hooks/useToast"
import { useAuth } from "../../hooks/useAuth"
import { ConfirmDialog } from "../ui/ConfirmDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu"

export interface Chapter {
  id: string
  title: string
  duration: number // minutes
}

export default function CourseTabs({
  description,
  chapters,
}: Readonly<{
  description: string
  chapters: Chapter[]
}>) {
  const { courseId } = useParams<{ courseId: string }>()
  const { t } = useLanguage()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  // State for reviews
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewsError, setReviewsError] = useState<string | null>(null)

  // State for exams
  const [exams, setExams] = useState<CourseExam[]>([])
  const [examsLoading, setExamsLoading] = useState(false)
  const [examsError, setExamsError] = useState<string | null>(null)

  // State for review form/editing
  const [isEditing, setIsEditing] = useState<Review | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null)

  // Controls: sort and min rating filter
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  const [minStars, setMinStars] = useState<number>(0)

  const fetchExams = useCallback(async () => {
    if (!courseId) return
    setExamsLoading(true)
    setExamsError(null)
    try {
      const response = await ExamService.getExamsByCourseId(courseId)
      if (response.success) {
        setExams(response.data)
      } else {
        setExamsError(response.message || t("courseDetail.errorLoading"))
      }
    } catch (error) {
      console.error("Error fetching exams:", error)
      setExamsError(t("courseDetail.errorLoading"))
    } finally {
      setExamsLoading(false)
    }
  }, [courseId, t])

  const fetchReviews = useCallback(async () => {
    if (!courseId) return
    setReviewsLoading(true)
    setReviewsError(null)
    try {
      const response = await ReviewService.getReviewsByCourseId(courseId)
      if (response.success) {
        setReviews(response.data || [])
      } else {
        setReviewsError(response.message || t("courseDetail.errorLoadingReviews"))
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      setReviewsError(t("courseDetail.errorLoadingReviews"))
    } finally {
      setReviewsLoading(false)
    }
  }, [courseId, t])

  useEffect(() => {
    if (courseId) {
      fetchExams()
      fetchReviews()
    }
  }, [courseId, fetchExams, fetchReviews])

  const handleReviewSubmit = async (data: NewReviewInput) => {
    if (isEditing) {
      await handleUpdateReview(data)
    } else {
      await handleAddReview(data)
    }
  }

  const handleAddReview = async (data: NewReviewInput) => {
    if (!courseId) return

    try {
      console.log(courseId, data.comment, data.rating)
      const response = await ReviewService.createReview({ courseId, ...data });
      if (response.success) {
        showToast("success", t("courseDetail.reviewAddedSuccess"))
        setReviews((prev) => [response.data, ...prev])
      } else {
        showToast("error", t("courseDetail.reviewAddedError"))
      }
    } catch (error) {
      showToast("error", t("courseDetail.reviewAddedError"))
    }
  }

  const handleUpdateReview = async (data: NewReviewInput) => {
    if (!isEditing) return

    try {
      const response = await ReviewService.updateReview(isEditing.id, { courseId: courseId!, ...data });
      if (response.success) {
        showToast("success", t("courseDetail.reviewUpdateSuccess"))
        setReviews((prev) =>
          prev.map((r) => (r.id === isEditing.id ? response.data : r))
        )
        setIsEditing(null)
      } else {
        showToast("error", t("courseDetail.reviewUpdateError"))
      }
    } catch (error) {
      showToast("error", t("courseDetail.reviewUpdateError"))
    }
  }

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return

    try {
      const response = await ReviewService.deleteReview(reviewToDelete.id)
      if (response.success) {
        showToast("success", t("courseDetail.reviewDeleteSuccess"))
        setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id))
      } else {
        showToast("error", t("courseDetail.reviewDeleteError"))
      }
    } catch (error) {
      showToast("error", t("courseDetail.reviewDeleteError"))
    } finally {
      setIsDeleteDialogOpen(false)
      setReviewToDelete(null)
    }
  }

  const openDeleteDialog = (review: Review) => {
    setReviewToDelete(review)
    setIsDeleteDialogOpen(true)
  }

  const handleChapterClick = (chapterId: string) => {
    navigate(`/courses/${courseId}/chapters/${chapterId}`)
  }

  const handleExamClick = (examId: string) => {
    navigate(`/exam/${examId}/prepare`)
  }

  const visibleReviews = useMemo(() => {
    const filtered = reviews.filter((r) => r.rating >= minStars)
    return filtered.sort((a, b) => {
      if (sortOrder === "desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [reviews, sortOrder, minStars])

  function MinStarFilter({
    value,
    onChange,
  }: {
    value: number
    onChange: (v: number) => void
  }) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            className={`h-8 px-2 rounded-md text-xs font-medium border ${value === n
              ? "bg-rose-700 text-white border-rose-700"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            aria-pressed={value === n}
            aria-label={`Filter ${n}+ stars`}
            title={`${n}+`}
          >
            {n}+
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`h-8 px-2 rounded-md text-xs font-medium border ${value === 0
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          aria-label="No minimum rating"
          title="Any"
        >
          Tất cả
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
      <Tabs defaultValue="chapters" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chapters">{t('courseDetail.chapters')}</TabsTrigger>
          <TabsTrigger value="exams">{t('courseDetail.exams')}</TabsTrigger>
          <TabsTrigger value="overview">{t('courseDetail.overview')}</TabsTrigger>
          <TabsTrigger value="reviews">{t('courseDetail.reviews')}</TabsTrigger>
        </TabsList>

        {/* Chapters */}
        <TabsContent value="chapters" className="mt-4">
          <div className="space-y-3">
            {chapters.map((ch, index) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => handleChapterClick(ch.id)}
                className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50/50 transition-colors cursor-pointer w-full text-left"
              >
                <span className="flex-none inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm text-gray-900 font-medium break-words">{ch.title}</div>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="mt-4">
          {examsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">{t('courseDetail.loadingExams')}</span>
              </div>
            </div>
          ) : examsError ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-gray-600">{examsError}</p>
              </div>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">{t('courseDetail.noExams')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.map((exam, index) => (
                <button
                  key={exam.examId}
                  type="button"
                  onClick={() => handleExamClick(exam.examId)}
                  className="group flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50/50 transition-colors cursor-pointer w-full text-left"
                >
                  <span className="flex-none inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 break-words">{exam.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{exam.description}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(exam.duration)}{t('courseDetail.examDuration')}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {exam.totalQuestions} {t('courseDetail.examQuestions')}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {exam.type}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('courseDetail.courseDescription')}</h2>
          <p className="text-gray-700 leading-7">{description}</p>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews" className="mt-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('courseDetail.studentReviews')}
          </h2>

          {/* Form for adding/editing a review */}
          {user ? (
            <ReviewForm
              key={isEditing ? isEditing.id : 'new'}
              onSubmit={handleReviewSubmit}
              initialData={isEditing ? { rating: isEditing.rating, comment: isEditing.comment } : undefined}
              isEditing={!!isEditing}
              onCancelEdit={() => setIsEditing(null)}
            />
          ) : (
            <div className="text-sm text-center text-gray-600 p-4 border border-dashed rounded-lg">
              {t('courseDetail.loginToReview')}
            </div>
          )}

          {/* Controls row: filter left, sort right */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <MinStarFilter value={minStars} onChange={setMinStars} />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="h-9 px-3 rounded-md border border-gray-300 text-sm focus:ring-1 focus:ring-rose-700 focus:border-transparent ml-auto"
              aria-label="Sort reviews"
              title="Sort"
            >
              <option value="desc">{t('courseDetail.sortNewest')}</option>
              <option value="asc">{t('courseDetail.sortOldest')}</option>
            </select>
          </div>

          {/* List of reviews */}
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviewsError ? (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              {reviewsError}
            </div>
          ) : visibleReviews.length === 0 ? (
            <div className="p-6 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg bg-white text-center">
              {t('courseDetail.noMatchingReviews')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleReviews.map((r) => {
                const isOwnReview = r.user.id === user?.id
                return (
                  <article
                    key={r.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                    aria-label={`Review by ${r.user.username}`}
                  >
                    <header className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-rose-50 text-rose-700 text-sm">{r.user?.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{r.user.username || 'Anonymous'}</div>
                          <div className="text-[11px] text-gray-500">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={r.rating} size={14} />
                        {isOwnReview && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-full hover:bg-gray-100">
                                <MoreVertical size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="right-0 mt-2">
                              <DropdownMenuItem onClick={() => setIsEditing(r)}>
                                <Pencil size={14} className="mr-2" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteDialog(r)} className="text-red-600">
                                <Trash2 size={14} className="mr-2" />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </header>
                    <p className="mt-3 text-sm text-gray-800 leading-6">{r.comment}</p>
                  </article>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteReview}
        title={t('courseDetail.deleteReviewTitle')}
        description={t('courseDetail.deleteReviewDescription')}
      />
    </div>
  )
}
