import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from 'react-router-dom';
import { BookOpen, AlertCircle, Clock, Search, Star, X, Menu, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import type { Course } from '../types/course';
import { CourseService } from '../services/courseService';

// Utility Components
const StarRating: React.FC<{
  rating: number
  onRatingChange?: (rating: number) => void
  interactive?: boolean
}> = ({ rating, onRatingChange, interactive = false }) => {
  const [hoverRating, setHoverRating] = useState(0)

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  const handleStarHover = (starRating: number) => {
    if (interactive) {
      setHoverRating(starRating)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  const getStarFill = (starIndex: number) => {
    const currentRating = hoverRating || rating
    if (currentRating >= starIndex) {
      return "fill-yellow-400 text-yellow-400"
    } else if (currentRating >= starIndex - 0.5) {
      return "fill-yellow-400/50 text-yellow-400"
    }
    return "fill-gray-200 text-gray-300"
  }

  return (
    <fieldset className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <button
          key={starIndex}
          type="button"
          onClick={() => handleStarClick(starIndex)}
          onMouseEnter={() => handleStarHover(starIndex)}
          className={`w-4 h-4 transition-all duration-200 ${
            interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
          }`}
          disabled={!interactive}
        >
          <Star className={`w-full h-full transition-colors duration-200 ${getStarFill(starIndex)}`} />
        </button>
      ))}
      {interactive && <span className="ml-2 text-xs text-gray-500">{rating > 0 ? `${rating}+ sao` : "Bất kỳ"}</span>}
    </fieldset>
  )
}

const FilterSection: React.FC<{
  title: string
  children: React.ReactNode
}> = ({ title, children }) => {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'N5': return 'bg-red-50 text-red-900';
      case 'N4': return 'bg-red-100 text-red-800';
      case 'N3': return 'bg-red-200 text-red-700';
      case 'N2': return 'bg-red-300 text-red-600';
      case 'N1': return 'bg-red-400 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200">
      <div className="relative overflow-hidden">
        {course.image ? (
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-red-600" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold shadow-lg ${getLevelColor(course.level)}`}>
          {course.level}
        </div>
        
        {course.averageRating && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {course.averageRating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 flex-1 mr-2">{course.title}</h3>
          {course.topics && course.topics.length > 0 && (
            <span className="text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full whitespace-nowrap">
              {course.topics[0].name}
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {course.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {course.averageRating ? (
              <>
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">{course.averageRating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Chưa có đánh giá</span>
            )}
          </div>

          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{course.duration || 0} phút</span>
          </div>
        </div>

        {course.topics && course.topics.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {course.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic.id}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                >
                  {topic.name}
                </span>
              ))}
              {course.topics.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                  +{course.topics.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        <Link
          to={`/courses/${course.id}`}
          className="block w-full text-center bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
};

const Pagination: React.FC<{
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = []

    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else if (currentPage === 1) {
      pages.push(1, 2)
    } else if (currentPage === totalPages) {
      pages.push(currentPage - 1, currentPage)
    } else {
      pages.push(currentPage - 1, currentPage, currentPage + 1)
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Trước
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page) => (
          <button
            key={`page-${page}`}
            onClick={() => typeof page === "number" && onPageChange(page)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              page === currentPage
                ? "bg-red-600 text-white"
                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Sau
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

const CoursesPage: React.FC = () => {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"averageRating" | "duration" | "title" | "level" | "id">("id")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterLevel, setFilterLevel] = useState<string>("all")
  const [filterTopic, setFilterTopic] = useState<string>("all")
  const [minRating, setMinRating] = useState(0)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(1000)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)

  const levels = ["all", "N5", "N4", "N3", "N2", "N1"]

  // Get unique topics from courses
  const topics = useMemo(() => {
    const uniqueTopics = new Set<string>()
    allCourses.forEach(course => {
      course.topics?.forEach(topic => {
        uniqueTopics.add(topic.name)
      })
    })
    return ["all", ...Array.from(uniqueTopics)]
  }, [allCourses])

  // Filtered and sorted courses
  const filteredAndSortedCourses = useMemo(() => {
    const filtered = allCourses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesLevel = filterLevel === "all" || course.level === filterLevel
      
      const matchesTopic = filterTopic === "all" || 
        course.topics?.some(topic => topic.name === filterTopic)
      
      const matchesRating = (course.averageRating || 0) >= minRating
      
      // Price filter - for future use
      const matchesPrice = true // course.price >= minPrice && course.price <= maxPrice

      return matchesSearch && matchesLevel && matchesTopic && matchesRating && matchesPrice
    })

    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number
      
      switch (sortBy) {
        case "averageRating":
          aValue = a.averageRating || 0
          bValue = b.averageRating || 0
          break
        case "duration":
          aValue = a.duration || 0
          bValue = b.duration || 0
          break
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "level": {
          const levelOrder: Record<string, number> = { "N5": 1, "N4": 2, "N3": 3, "N2": 4, "N1": 5 }
          aValue = levelOrder[a.level] || 0
          bValue = levelOrder[b.level] || 0
          break
        }
        case "id":
          aValue = a.id
          bValue = b.id
          break
        default:
          return 0
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [allCourses, searchTerm, sortBy, sortOrder, filterLevel, filterTopic, minRating])

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedCourses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCourses = filteredAndSortedCourses.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, sortOrder, filterLevel, filterTopic, minRating])

  // Active filters count
  const activeFiltersCount = [
    filterLevel !== "all",
    filterTopic !== "all",
    minRating > 0,
    minPrice > 0 || maxPrice < 1000,
  ].filter(Boolean).length

  const clearAllFilters = () => {
    setFilterLevel("all")
    setFilterTopic("all")
    setMinRating(0)
    setMinPrice(0)
    setMaxPrice(1000)
    setSearchTerm("")
    setCurrentPage(1)
  }

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await CourseService.getCourses({});

      if (response.success) {
        const coursesData = response.data || [];
        setAllCourses(coursesData);
      } else {
        setError(response.message || "Không thể tải danh sách khóa học");
        setAllCourses([]);
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-0 sm:px-1 lg:px-2 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div
            className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none lg:bg-transparent
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          >
            <div className="h-full overflow-y-auto">
              <div className="p-6 lg:p-0">
                {/* Mobile header */}
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filters */}
                <div className="space-y-6">
                  {/* Filter Header */}
                  <div className="hidden lg:flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
                      {activeFiltersCount > 0 && (
                        <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                          {activeFiltersCount}
                        </span>
                      )}
                    </div>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Xóa tất cả
                      </button>
                    )}
                  </div>

                  {/* Level Filter */}
                  <FilterSection title="Trình độ">
                    <div className="space-y-2">
                      {levels.map((level) => (
                        <label key={level} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="level"
                            value={level}
                            checked={filterLevel === level}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                            {level === "all" ? "Tất cả trình độ" : level}
                          </span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Topic Filter */}
                  <FilterSection title="Chủ đề">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {topics.map((topic) => (
                        <label key={topic} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="topic"
                            value={topic}
                            checked={filterTopic === topic}
                            onChange={(e) => setFilterTopic(e.target.value)}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                            {topic === "all" ? "Tất cả chủ đề" : topic}
                          </span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Rating Filter */}
                  <FilterSection title="Đánh giá tối thiểu">
                    <StarRating 
                      rating={minRating} 
                      onRatingChange={setMinRating} 
                      interactive={true} 
                    />
                  </FilterSection>

                  {/* Price Filter - for future use */}
                  <FilterSection title="Khoảng giá (Tương lai)">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="relative w-16">
                          <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="0"
                            value={minPrice}
                            onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
                            className="w-full pl-3 pr-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-transparent outline-none"
                          />
                        </div>
                        <span className="text-gray-400 text-xs">—</span>
                        <div className="relative w-16">
                          <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            placeholder="1000"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(Number(e.target.value) || 1000)}
                            className="w-full pl-3 pr-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">
                          ${minPrice} - ${maxPrice}
                        </span>
                      </div>
                    </div>
                  </FilterSection>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay */}
          {sidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden cursor-pointer"
              onClick={() => setSidebarOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                  setSidebarOpen(false)
                }
              }}
              aria-label="Đóng menu bộ lọc"
            />
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-900">Khóa học tiếng Nhật</h1>
                  <p className="text-red-600 text-sm">日本語コース</p>
                </div>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 text-center max-w-2xl mx-auto">
                Khám phá các khóa học tiếng Nhật từ cơ bản đến nâng cao. Học cùng với hàng nghìn học viên và đạt được mục tiêu của bạn.
              </p>
            </div>

            {/* Search and Sort */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm khóa học..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div className="lg:w-64">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-")
                      setSortBy(field as typeof sortBy)
                      setSortOrder(order as typeof sortOrder)
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  >
                    <option value="id-desc">Mới nhất</option>
                    <option value="id-asc">Cũ nhất</option>
                    <option value="averageRating-desc">Đánh giá: Cao đến thấp</option>
                    <option value="averageRating-asc">Đánh giá: Thấp đến cao</option>
                    <option value="duration-asc">Thời lượng: Ngắn đến dài</option>
                    <option value="duration-desc">Thời lượng: Dài đến ngắn</option>
                    <option value="title-asc">Tên: A đến Z</option>
                    <option value="title-desc">Tên: Z đến A</option>
                    <option value="level-asc">Trình độ: N5 đến N1</option>
                    <option value="level-desc">Trình độ: N1 đến N5</option>
                  </select>
                </div>
              </div>

              {/* Results */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{filteredAndSortedCourses.length}</span> khóa học được tìm thấy
                  {totalPages > 1 && (
                    <span className="text-gray-500">
                      {" "}
                      • Trang {currentPage} / {totalPages}
                    </span>
                  )}
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium lg:hidden"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-600">Đang tải khóa học...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-8">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Có lỗi xảy ra</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
                <button
                  onClick={fetchCourses}
                  className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Course Grid */}
            {!loading && !error && (
              <>
                {currentCourses.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentCourses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>

                    {/* Pagination */}
                    <Pagination 
                      currentPage={currentPage} 
                      totalPages={totalPages} 
                      onPageChange={setCurrentPage} 
                    />
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-gray-400 mb-4">
                      <BookOpen className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy khóa học</h3>
                    <p className="text-gray-600 mb-6">Thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc của bạn</p>
                    <button
                      onClick={clearAllFilters}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Japanese Motivation */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 text-center mt-12">
              <div className="text-3xl mb-3">🎌</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                <span className="text-red-600">頑張って!</span> (Ganbatte!)
              </h3>
              <p className="text-gray-600">Hãy bắt đầu hành trình học tiếng Nhật của bạn ngay hôm nay!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Line clamp CSS */}
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default CoursesPage;
