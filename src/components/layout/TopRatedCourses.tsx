import { useState, useEffect } from "react"
import { Clock, Star, Users } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { CourseService } from "../../services/courseService"
import { useLanguage } from "../../contexts/LanguageContext"

import type { Course as APICourse } from "../../types/course"
import type { Topic } from "../../types/topic"

// Helper function to round rating to nearest 0.5
const roundRatingToHalf = (rating: number | null): number | null => {
  if (rating === null || rating === undefined) return null;
  return Math.round(rating * 2) / 2;
};

// Component to display stars based on rating
const StarDisplay: React.FC<{ rating: number | null; showText?: boolean }> = ({ 
  rating, 
  showText = true 
}) => {
  if (rating === null || rating === undefined) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <span className="text-sm font-medium">Chưa có đánh giá</span>
      </div>
    );
  }

  const roundedRating = roundRatingToHalf(rating) || 0;
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-star-${roundedRating}-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div key={`half-star-${roundedRating}`} className="relative w-4 h-4">
            <Star className="w-4 h-4 fill-gray-200 text-gray-200" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-star-${roundedRating}-${i}`} className="w-4 h-4 fill-gray-200 text-gray-200" />
        ))}
      </div>
      
      {showText && (
        <span className="text-sm font-medium text-gray-700">
          {roundedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

const CourseCard: React.FC<{ course: APICourse }> = ({ course }) => {
  const navigate = useNavigate()

  const handleCourseClick = () => {
    navigate(`/courses/${course.id}`)
  }

  const courseTopics = course.topics || []

  return (
    <button 
      type="button"
      className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-rose-300 cursor-pointer w-full text-left"
      onClick={handleCourseClick}
      aria-label={`Xem chi tiết khóa học ${course.id}`}
    >
      <div className="relative overflow-hidden">
        <img
          src={course.image || "/placeholder.svg"}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 bg-rose-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
          Miễn phí
        </div>
        
        {/* Topics indicator - subtle hint khi không hover */}
        {courseTopics.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium shadow-md group-hover:opacity-0 transition-opacity duration-300">
            {courseTopics.length} chủ đề
          </div>
        )}
        
        {/* Topics badges - chỉ hiển thị khi hover, đẹp và trong suốt hơn */}
        {courseTopics.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
            <div className="flex flex-wrap gap-2 max-w-[90%] justify-center">
              {courseTopics.slice(0, 3).map((topic: Topic, index) => (
                <div 
                  key={topic.id}
                  className="bg-white/95 backdrop-blur-md text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium shadow-xl border border-white/30 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300"
                  style={{ 
                    transitionDelay: `${index * 100}ms` 
                  }}
                >
                  {topic.name}
                </div>
              ))}
              {courseTopics.length > 3 && (
                <div 
                  className="bg-gradient-to-r from-blue-500/95 to-purple-500/95 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-xl border border-white/30 transform translate-y-3 group-hover:translate-y-0 transition-all duration-300"
                  style={{ 
                    transitionDelay: `${courseTopics.slice(0, 3).length * 100}ms` 
                  }}
                >
                  +{courseTopics.length - 3} khác
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-1 flex-1 mr-2">{course.id}</h3>
          <span className="text-rose-700 text-xs font-medium bg-rose-50 px-2 py-1 rounded-full whitespace-nowrap">
            {course.level}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.title}</p>
        <div className="flex items-center justify-between">
          <StarDisplay rating={course.averageRating || null} />
          <div className="flex items-center gap-3 text-gray-500">
            {course.totalEnrolled !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">{course.totalEnrolled}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{course.duration}h</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

export function TopRatedCourses() {
  const { t } = useLanguage()
  const [courses, setCourses] = useState<APICourse[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopRatedCourses = async () => {
      try {
        setLoading(true)
        const response = await CourseService.getTopRatedCourses()
        
        if (response.success) {
          setCourses(response.data)
        } else {
          setError(response.message)
        }
      } catch (err) {
        console.error("Error fetching top rated courses:", err)
        setError(t('home.errorLoadingCourses'))
      } finally {
        setLoading(false)
      }
    }

    fetchTopRatedCourses()
  }, [t])

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Khóa học đánh giá cao nhất</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home.loadingCourses')}
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
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Khóa học đánh giá cao nhất</h2>
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
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Khóa học đánh giá cao nhất</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Khám phá các khóa học tiếng Nhật được đánh giá cao nhất của chúng tôi
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500 text-lg">{t('courses.noCoursesFound')}</p>
            </div>
          ) : (
            courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))
          )}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/courses"
            className="inline-block px-8 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            {t('courses.allCourses')}
          </Link>
        </div>

        {/* CSS cho line-clamp */}
        <style>{`
          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </div>
    </section>
  )
}
