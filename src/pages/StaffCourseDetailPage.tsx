import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { AlertCircle, BookOpen, Star, ChevronDown, ChevronRight, Eye, Edit, Plus, ArrowLeft, CheckCircle, FileText, Clock } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StaffNavigation } from '../components/layout/StaffNavigation'
import { StaffCourseService } from '../services/staffCourseService'
import { StaffChapterService, type Chapter } from '../services/staffChapterService'
import { StaffExamService } from '../services/staffExamService'
import type { StaffCourseDetail } from '../types/staffCourse'
import type { ExamSummary } from '../types/exam'

// Hàm sắp xếp chapters theo thứ tự prerequisite
const sortChaptersByPrerequisite = (chapters: Chapter[]): Chapter[] => {
  const sorted: Chapter[] = []
  const remaining = [...chapters]
  
  // Thêm các chapters không có prerequisite trước
  const chaptersWithoutPrereq = remaining.filter(chapter => !chapter.prerequisiteChapterId)
  sorted.push(...chaptersWithoutPrereq)
  
  // Loại bỏ các chapters đã thêm khỏi danh sách còn lại
  chaptersWithoutPrereq.forEach(chapter => {
    const index = remaining.findIndex(c => c.id === chapter.id)
    if (index > -1) remaining.splice(index, 1)
  })
  
  // Thêm các chapters có prerequisite theo thứ tự
  while (remaining.length > 0) {
    const nextChapters = remaining.filter(chapter => 
      chapter.prerequisiteChapterId && 
      sorted.some(sortedChapter => sortedChapter.id === chapter.prerequisiteChapterId)
    )
    
    if (nextChapters.length === 0) {
      // Nếu không tìm thấy prerequisite, thêm tất cả chapters còn lại
      sorted.push(...remaining)
      break
    }
    
    sorted.push(...nextChapters)
    nextChapters.forEach(chapter => {
      const index = remaining.findIndex(c => c.id === chapter.id)
      if (index > -1) remaining.splice(index, 1)
    })
  }
  
  return sorted
}

// Hàm lấy màu sắc theo status
const getStatusColor = (status: string) => {
  switch (status) {
    case 'INACTIVE':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

// Hàm lấy text hiển thị cho status
const getStatusText = (status: string) => {
  switch (status) {
    case 'INACTIVE':
      return 'Chưa kích hoạt'
    case 'REJECTED':
      return 'Từ chối'
    case 'ACTIVE':
      return 'Đã kích hoạt'
    default:
      return status
  }
}

export const StaffCourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [course, setCourse] = useState<StaffCourseDetail | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchCourseData = useCallback(async () => {
    if (!courseId) return

    setIsLoading(true)
    setError(null)

    try {
      // Lấy thông tin cơ bản và chi tiết với chapters
      const [courseRes, chaptersRes] = await Promise.all([
        StaffCourseService.getCourseDetail(courseId),
        StaffChapterService.getChaptersByCourse(courseId)
      ]);

      if (courseRes.success) {
        // Convert Course to StaffCourseDetail by adding chapters
        const courseData: StaffCourseDetail = {
          ...courseRes.data,
          description: courseRes.data.description || '',
          requirement: courseRes.data.requirement || '',
          chapters: [],
          enrollmentCount: 0,
          rating: courseRes.data.averageRating || 0
        };
        setCourse(courseData);
      } else {
        setError(courseRes.message || "Không thể tải thông tin khóa học");
      }

      if (chaptersRes.success) {
        const sortedChapters = sortChaptersByPrerequisite(chaptersRes.data || [])
        setChapters(sortedChapters);
      } else {
        console.error('Error fetching chapters:', chaptersRes.message);
      }

      // Load exams for this course
      try {
        const examsData = await StaffExamService.getExamsByScope('course', courseId);
        setExams(examsData);
      } catch (examError) {
        console.log('Exam service error:', examError);
        setExams([]);
      }
    } catch (error) {
      console.error('Error fetching course data:', error)
      setError("Không thể tải thông tin khóa học. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (!courseId) {
      setError("ID khóa học không hợp lệ")
      setIsLoading(false)
      return
    }

    fetchCourseData()
  }, [courseId, fetchCourseData])

  // Handle success message from navigation
  useEffect(() => {
    const state = location.state as { message?: string; refreshData?: boolean; timestamp?: number } | null
    if (state?.message) {
      setSuccessMessage(state.message)
      // Auto hide message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
      
      // Force refresh data if needed
      if (state.refreshData || state.timestamp) {
        fetchCourseData()
      }
      
      // Clear the state to prevent showing message on back navigation
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, navigate, location.pathname, fetchCourseData])

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId)
      } else {
        newSet.add(chapterId)
      }
      return newSet
    })
  }

  const handleViewChapter = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId)
    if (chapter && course) {
      navigate(`/staff/courses/${course.id}/chapters/${chapterId}`, {
        state: { course, chapter }
      })
    }
  }


  const handleAddChapter = () => {
    if (courseId && course) {
      navigate(`/staff/courses/${courseId}/chapters/new`, {
        state: { course }
      })
    }
  }

  if (isLoading) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-blue-600 animate-pulse mb-4" />
            <p className="text-xl text-blue-600 font-medium">Đang tải thông tin khóa học...</p>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  if (error) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <h3 className="font-semibold">Lỗi tải dữ liệu</h3>
              <p className="text-sm mt-1">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => fetchCourseData()}
                  size="sm"
                >
                  Thử lại
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/staff/courses')}
                  size="sm"
                >
                  Quay lại danh sách
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      </StaffNavigation>
    )
  }

  if (!course) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">Không tìm thấy khóa học</p>
            <Button 
              onClick={() => navigate('/staff/courses')}
              className="mt-4"
            >
              Quay lại danh sách khóa học
            </Button>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  return (
    <StaffNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-6 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/staff/courses')}
              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Trở về danh sách khóa học</span>
            </Button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <Alert className="bg-green-50 border-green-200 text-green-800 mb-6">
              <CheckCircle className="h-4 w-4" />
              <div className="ml-2">{successMessage}</div>
            </Alert>
          )}

          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Course Image */}
              <div className="lg:col-span-1">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  {!imageError ? (
                    <img
                      src={course.image || '/img/NhatBan.webp'}
                      alt={course.title}
                      className={`w-full h-64 object-cover transition-opacity duration-300 ${
                        imageLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageError(true)
                        setImageLoading(false)
                      }}
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-blue-400" />
                    </div>
                  )}
                  
                  {imageLoading && !imageError && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Course Info */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {course.level}
                    </Badge>
                    <Badge variant="outline" className={`border ${getStatusColor(course.status)}`}>
                      {getStatusText(course.status)}
                    </Badge>
                  </div>
                  
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {course.title}
                  </h1>
                  
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {chapters.length}
                      </div>
                      <div className="text-sm text-blue-500 font-medium">Chương</div>
                    </div>
                    
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-1 flex items-center justify-center gap-1">
                        {course.rating ? (
                          <>
                            {course.rating.toFixed(1)}
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          </>
                        ) : (
                          "0"
                        )}
                      </div>
                      <div className="text-sm text-purple-500 font-medium">Đánh giá</div>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        0
                      </div>
                      <div className="text-sm text-orange-500 font-medium">Học viên</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Course Details */}
            <div className="space-y-6">
              {/* Course Info Card */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Thông tin khóa học
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Mã khóa học</span>
                    <div className="text-lg font-mono font-bold text-blue-900 mt-1">{course.id}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Thời gian</span>
                    <div className="text-base text-blue-800 mt-1">{course.duration} giờ</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Trình độ</span>
                    <div className="text-base text-blue-800 mt-1">{course.level}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Trạng thái</span>
                    <div className="text-base text-blue-800 mt-1">{course.status}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Edit className="h-5 w-5 text-green-600" />
                    Thao tác nhanh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => navigate(`/staff/courses/${course.id}/edit`, { state: { course } })}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa khóa học
                  </Button>
                  {/* <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/staff/course/${course.id}/students`)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Xem học viên {course.enrollmentCount ? `(${course.enrollmentCount})` : '(0)'}
                  </Button> */}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/staff/course/${course.id}/reviews`)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Xem đánh giá ({course.rating ? `${course.rating.toFixed(1)}★` : "0★"})
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Chapters */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Description */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Mô tả chi tiết
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {course.description}
                  </p>
                </CardContent>
              </Card>

              {/* Exams List */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Bài kiểm tra ({exams.length})
                    </CardTitle>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => navigate('/staff/create-exam', { 
                        state: { 
                          scope: 'course', 
                          scopeId: course.id, 
                          scopeName: course.title 
                        } 
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo bài kiểm tra
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {exams.length > 0 ? (
                      exams.map((exam) => (
                        <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{exam.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{exam.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {exam.duration} phút
                                </span>
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {exam.questionCount || 0} câu hỏi
                                </span>
                                <Badge className={exam.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                  {exam.status === 'ACTIVE' ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/staff/exams/${exam.id}/edit`, {
                                  state: {
                                    scope: 'course',
                                    scopeId: course.id,
                                    scopeName: course.title
                                  }
                                })}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Chỉnh sửa
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-purple-300 mb-3" />
                        <p className="text-purple-600 font-medium mb-1">Chưa có bài kiểm tra nào</p>
                        <p className="text-sm text-purple-500 mb-4">
                          Tạo bài kiểm tra đầu tiên cho khóa học này
                        </p>
                        <Button 
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => navigate('/staff/create-exam', { 
                            state: { 
                              scope: 'course', 
                              scopeId: course.id, 
                              scopeName: course.title 
                            } 
                          })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tạo bài kiểm tra
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chapters List */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      Danh sách chương ({chapters.length})
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleAddChapter}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm chương
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`space-y-4 ${chapters.length > 6 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
                    {chapters.length > 0 ? (
                      chapters.map((chapter, index) => (
                        <div key={chapter.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Chapter Header */}
                          <button
                            type="button"
                            className="w-full text-left bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleChapterExpansion(chapter.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                toggleChapterExpansion(chapter.id)
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* Chapter Number */}
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium flex-shrink-0">
                                  {index + 1}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleChapterExpansion(chapter.id)
                                  }}
                                >
                                  {expandedChapters.has(chapter.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                      {chapter.title}
                                    </h3>
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(chapter.status)}`}>
                                      {getStatusText(chapter.status)}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600 text-sm mt-1">
                                    {chapter.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewChapter(chapter.id)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Xem chi tiết
                                </Button>
                              </div>
                            </div>
                          </button>

                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="h-16 w-16 mx-auto text-green-300 mb-4" />
                        <p className="text-green-600 font-medium mb-2">Chưa có chương nào</p>
                        <p className="text-sm text-green-500 mb-6">
                          Thêm chương đầu tiên cho khóa học này
                        </p>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleAddChapter}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Thêm chương mới
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </StaffNavigation>
  )
}

export default StaffCourseDetailPage
