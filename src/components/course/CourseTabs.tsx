"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/Tabs"
import { Avatar, AvatarFallback } from "../ui/Avatar"
import { StarDisplay } from "../ui/StarDisplay"
import ReviewForm, { type NewReviewInput } from "./ReviewForm"
import { useMemo, useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ExamService, type CourseExam } from "../../services/examService"
import { Clock, FileText, AlertCircle } from "lucide-react"
import { useLanguage } from "../../contexts/LanguageContext"

export interface Chapter {
  id: string
  title: string
  duration: number // minutes
}

export interface ReviewItem {
  id: number
  user: string
  rating: number
  comment: string
  date: string
}

export default function CourseTabs({
  description,
  chapters,
  initialReviews,
}: Readonly<{
  description: string
  chapters: Chapter[]
  initialReviews: ReviewItem[]
}>) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews)
  const [exams, setExams] = useState<CourseExam[]>([])
  const [examsLoading, setExamsLoading] = useState(false)
  const [examsError, setExamsError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { courseId } = useParams()
  const { t } = useLanguage()

  // Controls: sort and min rating filter
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  const [minStars, setMinStars] = useState<number>(0)

  // Fetch exams khi component mount hoặc courseId thay đổi
  useEffect(() => {
    const fetchExams = async () => {
      if (!courseId) return
      
      setExamsLoading(true)
      setExamsError(null)
      
      try {
        const response = await ExamService.getExamsByCourseId(courseId)
        if (response.success) {
          setExams(response.data)
        } else {
          setExamsError(response.message || t('courseDetail.errorLoading'))
        }
      } catch (error) {
        console.error('Error fetching exams:', error)
        setExamsError(t('courseDetail.errorLoading'))
      } finally {
        setExamsLoading(false)
      }
    }

    if (courseId) {
      fetchExams()
    }
  }, [courseId, t])

  function addReview(input: NewReviewInput) {
    const newItem: ReviewItem = {
      id: Date.now(),
      user: "Bạn",
      rating: input.rating,
      comment: input.comment,
      date: new Date().toISOString(),
    }
    setReviews((prev) => [newItem, ...prev])
  }

  const handleChapterClick = (chapterId: string) => {
    navigate(`/courses/${courseId}/chapters/${chapterId}`)
  }

  const handleExamClick = (examId: string) => {
    navigate(`/exam/${examId}/prepare`)
  }

  const visibleReviews = useMemo(() => {
    const filtered = reviews.filter((r) => r.rating >= minStars)
    return filtered.sort((a, b) => (sortOrder === "desc" ? b.rating - a.rating : a.rating - b.rating))
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
            className={`h-8 px-2 rounded-md text-xs font-medium border ${
              value === n
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
          className={`h-8 px-2 rounded-md text-xs font-medium border ${
            value === 0
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

        {/* Chapters - one column, number badge + title only */}
        <TabsContent value="chapters" className="mt-4">
          <div className="space-y-3">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => handleChapterClick(ch.id)}
                className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50/50 transition-colors cursor-pointer w-full text-left"
              >
                <span className="flex-none inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                  {chapters.indexOf(ch) + 1}
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
          {/* Form */}
          <ReviewForm onSubmit={(r) => addReview(r)} />

          {/* Controls row: filter left, sort right (no labels) */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <MinStarFilter value={minStars} onChange={setMinStars} />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="h-9 px-3 rounded-md border border-gray-300 text-sm focus:ring-1 focus:ring-rose-700 focus:border-transparent ml-auto"
              aria-label="Sort reviews"
              title="Sort"
            >
              <option value="desc">Cao nhất trước</option>
              <option value="asc">Thấp nhất trước</option>
            </select>
          </div>

          {/* List */}
          {visibleReviews.length === 0 ? (
            <div className="p-6 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg bg-white">
              Không có đánh giá nào phù hợp với bộ lọc của bạn.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleReviews.map((r) => {
                const initial = (r.user?.[0] || "U").toUpperCase()
                return (
                  <article
                    key={r.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                    aria-label={`Review by ${r.user}`}
                  >
                    <header className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-rose-50 text-rose-700 text-sm">{initial}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{r.user}</div>
                          <div className="text-[11px] text-gray-500">{new Date(r.date).toLocaleDateString("vi-VN")}</div>
                        </div>
                      </div>
                      <StarDisplay rating={r.rating} size={14} />
                    </header>
                    <p className="mt-3 text-sm text-gray-800 leading-6">{r.comment}</p>
                  </article>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
