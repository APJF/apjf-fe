"use client"

import { useState, useEffect } from "react"
import { Check, Loader2 } from "lucide-react"
import { CourseService } from "../../services/courseService"
import { useToast } from "../../hooks/useToast"

export default function EnrollButton({
  courseId,
  courseTitle,
  isEnrolled = false,
}: Readonly<{
  courseId: string
  courseTitle: string
  isEnrolled?: boolean
}>) {
  const [loading, setLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(isEnrolled)
  const { showToast } = useToast()

  // Update enrolled state when isEnrolled prop changes
  useEffect(() => {
    setEnrolled(isEnrolled)
  }, [isEnrolled])

  async function handleEnroll() {
    if (enrolled || loading) return
    
    setLoading(true)
    try {
      const response = await CourseService.enrollCourse(courseId)
      
      if (response.success) {
        setEnrolled(true)
        showToast('success', response.message || `Đã đăng ký khóa học ${courseTitle} thành công!`)
      } else {
        showToast('error', response.message || 'Đăng ký khóa học thất bại')
      }
    } catch (error) {
      console.error('Error enrolling in course:', error)
      showToast('error', 'Có lỗi xảy ra khi đăng ký khóa học. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading || enrolled}
      className={`inline-flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-medium transition-colors ${
        enrolled ? "bg-green-600 text-white" : "bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-60"
      }`}
      aria-label={enrolled ? "Enrolled" : `Enroll in ${courseTitle}`}
    >
      {(() => {
        if (loading) {
          return (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang đăng ký...
            </>
          )
        }
        if (enrolled) {
          return (
            <>
              <Check className="w-4 h-4" />
              Đã đăng ký
            </>
          )
        }
        return "Đăng ký khóa học"
      })()}
    </button>
  )
}
