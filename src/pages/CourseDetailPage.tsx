import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BookOpen, Clock } from 'lucide-react'
import { CourseService } from '../services/courseService'
import type { Course } from '../types/course'
import EnrollButton from '../components/course/EnrollButton'
import { StarDisplay } from '../components/ui/StarDisplay'
import CourseTabs from '../components/course/CourseTabs'

interface Chapter {
  id: string
  title: string
  duration: number // minutes
}

interface ReviewItem {
  id: number
  user: string
  rating: number
  comment: string
  date: string
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('Course ID not provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await CourseService.getCourseById(courseId)
        
        if (response.success && response.data) {
          setCourse(response.data)
        } else {
          setError('Course not found')
        }
      } catch (err) {
        setError('Failed to load course')
        console.error('Error fetching course:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Đang tải khóa học...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <div>
            <p className="text-red-800 font-medium">Có lỗi xảy ra</p>
            <p className="text-red-600 text-sm">{error || 'Không tìm thấy khóa học'}</p>
          </div>
          <Link
            to="/courses"
            className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    )
  }

  // Mock data for chapters and reviews - can be replaced with API calls
  const chapters: Chapter[] = Array.from({ length: 8 }).map((_, i) => ({
    id: (i + 1).toString(),
    title: `Chapter ${i + 1}: ${course.title.split(" ")[0]} Essentials`,
    duration: 12 + i * 3,
  }))

  const reviews: ReviewItem[] = [
    { id: 1, user: "Anh Tran", rating: 5, comment: "Khóa học rất chất lượng, giảng viên dễ hiểu.", date: "2025-05-12" },
    {
      id: 2,
      user: "Minh Nguyen",
      rating: 4.5,
      comment: "Nội dung đầy đủ, có thể thêm bài tập nâng cao.",
      date: "2025-04-03",
    },
    { id: 3, user: "Lan Pham", rating: 4, comment: "Tổng quan tốt, phần cuối hơi nhanh.", date: "2025-03-21" },
  ]

  const description = course.description || "This course provides a comprehensive overview with hands-on projects, best practices, and real-world examples to help you master the topic efficiently."

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm">
        <Link to="/courses" className="text-rose-700 hover:underline">
          Courses
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-700">{course.title}</span>
      </div>

      {/* Layout 10 cột: trái 7/10 cho detail + tabs */}
      <section className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {/* Card detail */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Ảnh cover */}
            <img
              src={course.image || "/placeholder.svg"}
              alt={course.title}
              className="w-full h-56 sm:h-72 object-cover"
            />

            {/* Nội dung detail */}
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-gray-900">{course.title}</h1>

              {/* Hàng: Duration + Topic + Level (cùng hàng) */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {Math.round((course.duration || 0) / 60)}h
                </span>
                <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  {course.topics?.[0]?.name || "Tiếng Nhật"}
                </span>
                <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                  Level {course.level}
                </span>
              </div>

              {/* Rating ngay dưới */}
              <div className="mt-3">
                <StarDisplay rating={course.averageRating || 0} />
              </div>

              {/* Hàng: Giá + Enroll (cùng hàng) */}
              <div className="mt-4 flex items-center gap-4">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">Miễn phí</div>
                <div className="ml-auto">
                  <EnrollButton courseId={courseId!} courseTitle={course.title} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Chapters / Overview / Reviews (có form review + chọn rating) */}
          <CourseTabs description={description} chapters={chapters} initialReviews={reviews} courseId={courseId!} />
        </div>

        {/* Cột phải 3/10 (để trống cho mở rộng sau) */}
        <div className="hidden lg:block lg:col-span-3" />
      </section>
    </main>
  )
}