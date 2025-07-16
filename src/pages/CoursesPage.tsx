import React, { useState, useEffect, useCallback } from "react";
import { Link } from 'react-router-dom';
import { BookOpen, AlertCircle, Clock, Users } from "lucide-react";
import type { Course, CourseFilters as CourseFiltersType } from '../types/course';
import { CourseService } from '../services/courseService';

interface CourseFiltersProps {
  onSearch: (title: string) => void;
  onLevelFilter: (level: string | null) => void;
  onSort: (sortBy: string, direction: string) => void;
  currentLevel: string | null;
  currentSort: { sortBy: string; direction: string };
}

const CourseFilters: React.FC<CourseFiltersProps> = ({
  onSearch,
  onLevelFilter,
  onSort,
  currentLevel,
  currentSort
}) => {
  const [searchInput, setSearchInput] = useState("");
  
  const levels = ["N5", "N4", "N3", "N2", "N1"];
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="space-y-2">
          <label htmlFor="search-input" className="text-sm font-medium text-gray-700">Tìm kiếm</label>
          <div className="flex gap-2">
            <input
              id="search-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Nhập tên khóa học..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Tìm
            </button>
          </div>
        </form>

        {/* Level Filter */}
        <div className="space-y-2">
          <label htmlFor="level-select" className="text-sm font-medium text-gray-700">Trình độ</label>
          <select
            id="level-select"
            value={currentLevel || ""}
            onChange={(e) => onLevelFilter(e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả trình độ</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">Sắp xếp</label>
          <select
            id="sort-select"
            value={`${currentSort.sortBy}-${currentSort.direction}`}
            onChange={(e) => {
              const [sortBy, direction] = e.target.value.split('-');
              onSort(sortBy, direction);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="title-asc">Tên A-Z</option>
            <option value="title-desc">Tên Z-A</option>
            <option value="level-asc">Trình độ tăng dần</option>
            <option value="level-desc">Trình độ giảm dần</option>
          </select>
        </div>
      </div>
    </div>
  );
};

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'N5': return 'bg-green-100 text-green-800';
      case 'N4': return 'bg-blue-100 text-blue-800';
      case 'N3': return 'bg-yellow-100 text-yellow-800';
      case 'N2': return 'bg-orange-100 text-orange-800';
      case 'N1': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-red-50 to-red-100">
        {course.image ? (
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-red-600" />
          </div>
        )}
        
        <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
          {course.level}
        </span>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {course.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{course.duration} phút</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{course.status}</span>
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

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-gray-700">
        Hiển thị {startItem} - {endItem} trong tổng số {totalElements} khóa học
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Trước
        </button>
        
        <span className="px-3 py-2 text-sm text-gray-700">
          Trang {currentPage + 1} / {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sau
        </button>
      </div>
    </div>
  );
};

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(12);

  // Filter states
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: CourseFiltersType = {
        page: currentPage,
        size: pageSize,
        sortBy,
        sortDirection: sortDirection as 'asc' | 'desc',
      };

      if (searchTitle) filters.searchTitle = searchTitle;
      if (selectedLevel) filters.level = selectedLevel;

      const response = await CourseService.getCourses(filters);

      if (response.success) {
        setCourses(response.data.content);
        setTotalPages(response.data.totalPages);
        setTotalElements(response.data.totalElements);
      } else {
        setError(response.message || "Không thể tải danh sách khóa học");
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortDirection, searchTitle, selectedLevel]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearch = (title: string) => {
    setSearchTitle(title);
    setCurrentPage(0);
  };

  const handleLevelFilter = (level: string | null) => {
    setSelectedLevel(level);
    setCurrentPage(0);
  };

  const handleSort = (newSortBy: string, direction: string) => {
    setSortBy(newSortBy);
    setSortDirection(direction);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Khóa học tiếng Nhật</h1>
              <p className="text-red-600 text-sm">日本語コース</p>
            </div>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Khám phá các khóa học tiếng Nhật từ cơ bản đến nâng cao. Học cùng với hàng nghìn học viên và đạt được mục tiêu của bạn.
          </p>
        </div>

        {/* Filters */}
        <CourseFilters
          onSearch={handleSearch}
          onLevelFilter={handleLevelFilter}
          onSort={handleSort}
          currentLevel={selectedLevel}
          currentSort={{ sortBy, direction: sortDirection }}
        />

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

        {/* Courses Grid */}
        {!loading && !error && (
          <>
            {courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy khóa học</h3>
                <p className="text-gray-600 mb-4">Không có khóa học nào phù hợp với bộ lọc của bạn.</p>
                <button
                  onClick={() => {
                    setSearchTitle("");
                    setSelectedLevel(null);
                    setCurrentPage(0);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Xóa bộ lọc
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
      </main>
    </div>
  );
};

export default CoursesPage;
