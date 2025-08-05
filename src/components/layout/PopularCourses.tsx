import { useState, useEffect } from "react"
import { Clock, Users, Star } from "lucide-react"
import { Link } from "react-router-dom"
import { CourseService } from "../../services/courseService"

import type { Course as APICourse, PopularCourseUI } from "../../types/course"

// Helper function to convert API courses to component courses
const convertAPICourse = (course: APICourse): PopularCourseUI => {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    level: course.level || "N5",
    duration: `${course.duration} tiếng`,
    students: Math.floor(Math.random() * 10000) + 1000,
    rating: course.averageRating || 4.0,
    price: "Free",
    image: course.image || "",
    features: [
      "JLPT Preparation",
      "Interactive Exercises",
      "Native Speakers",
      "Practice Tests"
    ]
  }
}

export function PopularCourses() {
  const [courses, setCourses] = useState<PopularCourseUI[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopRatedCourses = async () => {
      try {
        setLoading(true)
        const response = await CourseService.getTopRatedCourses()
        
        if (response.success) {
          const convertedCourses = response.data.map(convertAPICourse)
          setCourses(convertedCourses)
        } else {
          setError(response.message)
        }
      } catch (err) {
        console.error("Error fetching top rated courses:", err)
        setError("Không thể tải danh sách khóa học phổ biến. Vui lòng thử lại sau.")
      } finally {
        setLoading(false)
      }
    }

    fetchTopRatedCourses()
  }, [])

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-blue-100 text-blue-800"
      case "All Levels":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Khóa Học Phổ Biến</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Đang tải khóa học phổ biến...
            </p>
          </div>
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Khóa Học Phổ Biến</h2>
            <p className="text-xl text-red-600 max-w-2xl mx-auto">
              {error}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Khóa Học Phổ Biến</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Chọn từ các khóa học được thiết kế cẩn thận để đưa bạn từ người mới bắt đầu đến thành thạo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500 text-lg">Không tìm thấy khóa học phổ biến nào.</p>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <span className={`absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(course.level)}`}>
                  {course.level}
                </span>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-4">{course.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{course.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-sm mb-2">Bạn sẽ học được:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {course.features.map((feature) => (
                      <li key={feature} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-2xl font-bold text-red-600">{course.price}</div>
                  <button className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
                    {course.price === "Free" ? "Bắt đầu miễn phí" : "Đăng ký ngay"}
                  </button>
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/courses"
            className="inline-block px-8 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Xem tất cả khóa học
          </Link>
        </div>
      </div>
    </section>
  )
}
