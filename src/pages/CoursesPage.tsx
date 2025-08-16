"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Star, Clock, BookOpen, AlertCircle } from "lucide-react"
import PaginationButton from "../components/ui/PaginationButton"
import type { Course } from '../types/course'
import { CourseService } from '../services/courseService'
import { Breadcrumb, type BreadcrumbItem } from '../components/ui/Breadcrumb'
import { useLanguage } from '../contexts/LanguageContext'

interface ProcessedCourse {
  id: string
  title: string
  image: string | null
  rating: number
  duration: number // hours
  price: number
  topic: string
  level: "N5" | "N4" | "N3" | "N2" | "N1"
  description: string
}

// Star rating selector with whole number selection only
const StarRating: React.FC<{ rating: number; onRatingChange: (rating: number) => void }> = ({
  rating,
  onRatingChange,
}) => {
  const [hover, setHover] = useState(0)

  const handleClick = (starNumber: number) => {
    onRatingChange(starNumber)
  }

  const handleMouseEnter = (starNumber: number) => {
    setHover(starNumber)
  }

  const handleMouseLeave = () => {
    setHover(0)
  }

  const getStarColor = (starNumber: number) => {
    const current = hover || rating
    return current >= starNumber 
      ? "fill-yellow-400 text-yellow-400" 
      : "fill-gray-200 text-gray-300"
  }

  return (
    <fieldset 
      className="flex items-center gap-2" 
      onMouseLeave={handleMouseLeave}
    >
      <legend className="sr-only">Rating filter</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => handleMouseEnter(i)}
            onClick={() => handleClick(i)}
            className="w-4 h-4 hover:scale-[1.08] transition-transform"
            aria-label={`Set minimum rating to ${i}`}
          >
            <Star className={`w-full h-full ${getStarColor(i)}`} />
          </button>
        ))}
      </div>
      <span className="text-[11px] text-gray-600">{rating > 0 ? `${rating}+` : "Any"}</span>
    </fieldset>
  )
}

const CourseCard: React.FC<{ course: ProcessedCourse }> = ({ course }) => {
  const navigate = useNavigate()

  const handleCourseClick = () => {
    navigate(`/courses/${course.id}`)
  }

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
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700">{course.rating || "Chưa có"}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{course.duration}h</span>
          </div>
        </div>

      </div>
    </button>
  )
}

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (p: number) => void; t: (key: string) => string }> = ({
  currentPage,
  totalPages,
  onPageChange,
  t,
}) => {
  if (totalPages <= 1) return null
  
  // Logic mới: hiển thị trang đầu tiên, trang hiện tại, trang cuối cùng
  const firstPage = 1
  const lastPage = totalPages
  
  return (
    <div className="flex items-center justify-center gap-3 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-28 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {t('courses.previous')}
      </button>

      <div className="grid grid-cols-3 gap-2">
        {/* Trang đầu tiên */}
        <PaginationButton 
          page={currentPage === firstPage ? null : firstPage} 
          onClick={onPageChange} 
        />
        
        {/* Trang hiện tại */}
        <PaginationButton 
          page={currentPage} 
          isActive 
          onClick={onPageChange} 
        />
        
        {/* Trang cuối cùng */}
        <PaginationButton 
          page={currentPage === lastPage ? null : lastPage} 
          onClick={onPageChange} 
        />
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-28 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        {t('courses.next')}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}

export default function CoursesPage() {
  const { t } = useLanguage()
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"rating" | "level">("rating")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterTopic, setFilterTopic] = useState<string>("all")
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [minRating, setMinRating] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)

  // Convert backend courses to display format
  const processedCourses = useMemo((): ProcessedCourse[] => {
    return allCourses.map(course => ({
      id: course.id,
      title: course.title,
      image: course.image,
      rating: course.averageRating || 0,
      duration: course.duration || 0, // Use hours from API directly
      price: 0, // All courses are free
      topic: course.topics?.[0]?.name || "Tiếng Nhật",
      level: course.level,
      description: course.description || ""
    }))
  }, [allCourses])

  const topics = ["all", "Tiếng Nhật"] // Simplified since API doesn't return topics
  const levels = ["all", "N5", "N4", "N3", "N2", "N1"]

  const filteredAndSorted = useMemo(() => {
    const filtered = processedCourses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTopic = filterTopic === "all" || c.topic === filterTopic
      const matchesLevel = filterLevel === "all" || c.level === filterLevel
      const matchesRating = c.rating >= minRating
      return matchesSearch && matchesTopic && matchesLevel && matchesRating
    })

    filtered.sort((a, b) => {
      if (sortBy === "rating") {
        const aVal = a.rating
        const bVal = b.rating
        return sortOrder === "desc" ? bVal - aVal : aVal - bVal
      } else if (sortBy === "level") {
        // Level order: N5 (lowest) -> N4 -> N3 -> N2 -> N1 (highest)
        const levelOrder: { [key: string]: number } = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 }
        const aVal = levelOrder[a.level] || 0
        const bVal = levelOrder[b.level] || 0
        return sortOrder === "desc" ? bVal - aVal : aVal - bVal
      }
      return 0
    })

    return filtered
  }, [processedCourses, searchTerm, sortBy, sortOrder, filterTopic, filterLevel, minRating])

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage) || 1
  const start = (currentPage - 1) * itemsPerPage
  const currentCourses = filteredAndSorted.slice(start, start + itemsPerPage)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, sortOrder, filterTopic, filterLevel, minRating])

  const clearAll = () => {
    setSearchTerm("")
    setSortBy("rating")
    setSortOrder("desc")
    setFilterTopic("all")
    setFilterLevel("all")
    setMinRating(0)
    setCurrentPage(1)
  }

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await CourseService.getCourses({})

      if (response.success) {
        const coursesData = response.data || []
        // Only show active courses
        const activeCourses = coursesData.filter(course => course.status === "ACTIVE")
        setAllCourses(activeCourses)
      } else {
        setError(response.message || t('courses.errorOccurred'))
        setAllCourses([])
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.")
      console.error("Error fetching courses:", err)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  // Create breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t('header.home'), href: '/' },
    { label: t('courses.title') } // Current page - no href
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />
        
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5 mb-8">
          {/* Row 1: Search + Sort (compact) */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative sm:w-[70%]">
              <label htmlFor="search-input" className="sr-only">{t('courses.searchPlaceholder')}</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="search-input"
                type="text"
                placeholder={t('courses.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full pl-9 pr-3 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-rose-700 focus:border-transparent outline-none"
              />
            </div>
            <div className="sm:w-[30%]">
              <label htmlFor="sort-select" className="sr-only">{t('courses.sortBy')}</label>
              <select
                id="sort-select"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [f, o] = e.target.value.split("-")
                  setSortBy(f as "rating" | "level")
                  setSortOrder(o as "asc" | "desc")
                }}
                className="h-9 w-full px-3 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-rose-700 focus:border-transparent"
              >
                <option value="rating-desc">{t('courses.rating')}: {t('courses.highest')}</option>
                <option value="rating-asc">{t('courses.rating')}: {t('courses.lowest')}</option>
                <option value="level-desc">{t('courses.level')}: {t('courses.highest')} (N1)</option>
                <option value="level-asc">{t('courses.level')}: {t('courses.lowest')} (N5)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Filters (compact, 1 hàng trên màn rộng) */}
          <div className="mt-3 flex flex-wrap items-end gap-3">
            {/* Topic */}
            <div className="flex flex-col min-w-[160px]">
              <label htmlFor="topic-select" className="text-xs font-semibold text-gray-600 mb-1">{t('courses.topic')}</label>
              <select
                id="topic-select"
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-rose-700 focus:border-transparent"
              >
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic === "all" ? t('courses.allTopics') : topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div className="flex flex-col min-w-[150px]">
              <label htmlFor="level-select" className="text-xs font-semibold text-gray-600 mb-1">{t('courses.level')}</label>
              <select
                id="level-select"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-rose-700 focus:border-transparent"
              >
                {levels.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv === "all" ? t('courses.allLevels') : lv}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div className="flex flex-col min-w-[180px]">
              <span className="text-xs font-semibold text-gray-600 mb-1">{t('courses.minRating')}</span>
              <div className="h-9 flex items-center px-3 border border-gray-300 rounded-lg focus-within:ring-1 focus-within:ring-rose-700">
                <StarRating rating={minRating} onRatingChange={setMinRating} />
              </div>
            </div>

            {/* Clear ngay cạnh Rating */}
            <div className="flex flex-col min-w-[92px]">
              <span className="text-xs font-semibold text-gray-600 mb-1 invisible">Clear</span>
              <button
                type="button"
                onClick={clearAll}
                className="h-9 px-3 text-sm font-medium text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg"
              >
                {t('courses.clearFilters')}
              </button>
            </div>

            {/* Results giống các cột khác */}
            <div className="ml-auto flex flex-col min-w-[130px]">
              <span className="text-xs font-semibold text-gray-600 mb-1">{t('courses.results')}</span>
              <div className="h-9 flex items-center px-3 border border-gray-300 rounded-lg text-sm bg-white">
                <span className="font-semibold text-gray-900">{filteredAndSorted.length}</span>
                <span className="ml-1 text-gray-700">{t('courses.coursesText')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">{t('courses.loading')}</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-8">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">{t('courses.errorOccurred')}</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchCourses}
              className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              {t('courses.retry')}
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <>
            {currentCourses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentCourses.map((c) => (
                    <CourseCard key={c.id} course={c} />
                  ))}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} t={t} />
              </>
            ) : (
              <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
                <div className="text-gray-400 mb-4">
                  <BookOpen className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('courses.noCoursesFound')}</h3>
                <p className="text-gray-600 mb-6">{t('courses.adjustSearchCriteria')}</p>
                <button
                  onClick={clearAll}
                  className="inline-flex items-center px-4 py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors"
                >
                  {t('courses.resetFilters')}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center text-sm text-gray-600">
          {t('courses.copyright')}
        </div>
      </footer>

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
  )
}
