"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"

export default function EnrollButton({
  courseTitle,
}: Readonly<{
  courseId: string
  courseTitle: string
}>) {
  const [loading, setLoading] = useState(false)
  const [enrolled, setEnrolled] = useState(false)

  async function handleEnroll() {
    if (enrolled || loading) return
    setLoading(true)
    // Simulate API call for enrollment
    await new Promise((r) => setTimeout(r, 900))
    setEnrolled(true)
    setLoading(false)
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
