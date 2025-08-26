import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { AlertCircle, BookOpen, ArrowLeft, Plus, Edit, Eye, XCircle, CheckCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { StaffNavigation } from '../../components/layout/StaffNavigation'
import { StaffChapterService } from '../../services/staffChapterService'
import { StaffCourseService } from '../../services/staffCourseService'
import { CourseService } from '../../services/courseService'
import api from '../../api/axios'
import type { Course, Chapter } from '../../types/course'
import type { Unit } from '../../types/unit'
import type { Exam } from '../../types/exam'

// Type aliases for compatibility
type StaffCourseDetail = Course
type ChapterDetail = Chapter

// Hàm sắp xếp units theo thứ tự prerequisite
const sortUnitsByPrerequisite = (units: Unit[]): Unit[] => {
  const sorted: Unit[] = []
  const remaining = [...units]
  
  // Thêm các units không có prerequisite trước
  const unitsWithoutPrereq = remaining.filter(unit => !unit.prerequisiteUnitId)
  sorted.push(...unitsWithoutPrereq)
  
  // Loại bỏ các units đã thêm khỏi danh sách còn lại
  unitsWithoutPrereq.forEach(unit => {
    const index = remaining.findIndex(u => u.id === unit.id)
    if (index > -1) remaining.splice(index, 1)
  })
  
  // Thêm các units có prerequisite theo thứ tự
  while (remaining.length > 0) {
    const nextUnits = remaining.filter(unit => 
      unit.prerequisiteUnitId && 
      sorted.some(sortedUnit => sortedUnit.id === unit.prerequisiteUnitId)
    )
    
    if (nextUnits.length === 0) {
      // Nếu không tìm thấy prerequisite, thêm tất cả units còn lại
      sorted.push(...remaining)
      break
    }
    
    sorted.push(...nextUnits)
    nextUnits.forEach(unit => {
      const index = remaining.findIndex(u => u.id === unit.id)
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

interface LocationState {
  course?: StaffCourseDetail
  chapter?: ChapterDetail
  message?: string
  refreshData?: boolean
  timestamp?: number
}

export const StaffChapterDetailPage: React.FC = () => {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState || {}

  const [course, setCourse] = useState<StaffCourseDetail | null>(locationState.course || null)
  const [chapter, setChapter] = useState<ChapterDetail | null>(locationState.chapter || null)
  const [isLoading, setIsLoading] = useState(!locationState.chapter)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(locationState.message || null)

  const fetchChapterData = useCallback(async () => {
    if (!chapterId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch chapter details and exams in parallel
      const [chapterResponse, examsResponse] = await Promise.all([
        StaffChapterService.getChapterDetail(chapterId),
        CourseService.getExamsByChapterId(chapterId)
      ])
      
      console.log('🔍 Chapter response:', chapterResponse)
      console.log('🔍 Exams response:', examsResponse)
      
      // Fetch units using the correct API endpoint  
      let unitsData: Array<{ id: string; title: string; description: string | null; status: string; prerequisiteUnitId: string | null }> = []
      try {
        const unitsResponse = await CourseService.getUnitsByChapterId(chapterId)
        console.log('🔍 Units response from CourseService:', unitsResponse)
        
        if (unitsResponse.success && unitsResponse.data) {
          unitsData = unitsResponse.data
        }
      } catch (unitsError) {
        console.warn('CourseService failed, trying direct API...')
        // Fallback to direct API call
        try {
          const response = await api.get(`/chapters/${chapterId}/units`)
          console.log('🔍 Units response from direct API:', response.data)
          
          if (response.data.success && response.data.data) {
            unitsData = response.data.data
          }
        } catch (directError) {
          console.error('Both units API calls failed:', { unitsError, directError })
        }
      }

      // Get exams data
      let examsData: Array<any> = []
      if (examsResponse.success && examsResponse.data) {
        examsData = examsResponse.data
        console.log('✅ Chapter exams loaded:', examsData)
      } else {
        console.error('❌ Chapter exams fetch failed:', examsResponse.message)
      }
      
      if (chapterResponse.success && chapterResponse.data) {
        // Create ChapterDetail with units and exams
        const chapterData: ChapterDetail = {
          ...chapterResponse.data,
          description: chapterResponse.data.description || '',
          units: unitsData.length > 0 ? 
            sortUnitsByPrerequisite(unitsData.map((unit: { id: string; title: string; description: string | null; status: string; prerequisiteUnitId: string | null }) => ({
              ...unit,
              description: unit.description || '',
              status: (unit.status === 'REJECTED' ? 'INACTIVE' : unit.status) as 'INACTIVE' | 'ACTIVE' | 'ARCHIVED',
              chapterId: chapterResponse.data.id,
              exams: []
            }))) : [],
          exams: examsData
        }
        
        console.log('📦 Final chapter data with units and exams:', chapterData)
        console.log('📊 Units count:', chapterData.units?.length || 0)
        console.log('📊 Exams count:', chapterData.exams?.length || 0)
        setChapter(chapterData)

        // Fetch course info if not available
        if (!course && courseId) {
          try {
            const courseResponse = await StaffCourseService.getCourseDetail(courseId)
            if (courseResponse.success && courseResponse.data) {
              setCourse(courseResponse.data)
            }
          } catch (courseError) {
            console.error('Error fetching course data:', courseError)
            // Don't fail the whole operation if course fetch fails
          }
        }
      } else {
        setError("Không tìm thấy thông tin chương")
      }
    } catch (error) {
      console.error('Error fetching chapter data:', error)
      setError("Không thể tải thông tin chương. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }, [chapterId])

  useEffect(() => {
    if (!chapterId) {
      setError("ID chương không hợp lệ")
      setIsLoading(false)
      return
    }

    // Luôn fetch data để đảm bảo có units đầy đủ
    fetchChapterData()
  }, [chapterId, fetchChapterData])

  // Handle success message cleanup
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleViewUnit = (unitId: string) => {
    const unit = chapter?.units?.find((u: Unit) => u.id === unitId)
    if (unit && chapter && course) {
      navigate(`/staff/courses/${courseId}/chapters/${chapterId}/units/${unitId}`, {
        state: { course, chapter, unit }
      })
    }
  }

  const handleAddUnit = () => {
    if (course && chapter) {
      navigate(`/staff/courses/${courseId}/chapters/${chapterId}/units/new`, {
        state: { course, chapter }
      })
    }
  }

  const handleEditChapter = () => {
    if (course && chapter) {
      navigate(`/staff/chapters/${chapterId}/edit`, {
        state: { course, chapter }
      })
    }
  }

  const handleDeactivateChapter = async () => {
    if (!chapterId || !chapter) return

    const confirmDeactivate = window.confirm(
      `Bạn có chắc chắn muốn hủy kích hoạt chương "${chapter.title}"?\n\nHành động này sẽ khiến chương không còn hiển thị cho người dùng.`
    )

    if (!confirmDeactivate) return

    try {
      setIsLoading(true)
      // Sử dụng service chuẩn axios
      const result = await StaffChapterService.deactivateChapter(chapterId)
      if (result.success) {
        setSuccessMessage('Đã hủy kích hoạt chương thành công!')
        await fetchChapterData()
      } else {
        setError(result.message || 'Có lỗi xảy ra khi hủy kích hoạt chương')
      }
    } catch (error) {
      console.error('Error deactivating chapter:', error)
      setError('Có lỗi xảy ra khi hủy kích hoạt chương')
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivateChapter = async () => {
    if (!chapterId || !chapter) return

    const confirmActivate = window.confirm(
      `Bạn có chắc chắn muốn kích hoạt lại chương "${chapter.title}"?`
    )

    if (!confirmActivate) return

    try {
      setIsLoading(true)
      
      // Tạo payload với tất cả thông tin cũ nhưng status chuyển thành ACTIVE
      const updatePayload = {
        id: chapter.id,
        title: chapter.title,
        description: chapter.description || '',
        status: 'ACTIVE' as const,
        courseId: courseId!,
        prerequisiteChapterId: chapter.prerequisiteChapterId,
        exams: chapter.exams || []
      }
      
      console.log('🔄 Activating chapter with payload:', updatePayload)
      const result = await StaffChapterService.updateChapter(chapterId, updatePayload)
      
      if (result.success) {
        setSuccessMessage('Đã kích hoạt lại chương thành công!')
        // Refresh chapter data to show updated status
        await fetchChapterData()
      } else {
        setError(result.message || 'Có lỗi xảy ra khi kích hoạt lại chương')
      }
    } catch (error) {
      console.error('Error activating chapter:', error)
      setError('Có lỗi xảy ra khi kích hoạt lại chương')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-blue-600 animate-pulse mb-4" />
            <p className="text-xl text-blue-600 font-medium">Đang tải thông tin chương...</p>
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
                  onClick={() => fetchChapterData()}
                  size="sm"
                >
                  Thử lại
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  size="sm"
                >
                  Quay lại
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      </StaffNavigation>
    )
  }

  if (!chapter) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">Không tìm thấy thông tin chương</p>
            <Button 
              onClick={() => navigate(-1)}
              className="mt-4"
            >
              Quay lại
            </Button>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  const getStatusBadge = (status: string) => {
    return <Badge className={`${getStatusColor(status)}`}>{getStatusText(status)}</Badge>
  }

  return (
    <StaffNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-6 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/staff/courses/${courseId}`)}
              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Trở về trang khóa học</span>
            </Button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-1 rounded-full">
                  <BookOpen className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium">{successMessage}</span>
              </div>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Course Info */}
            <div className="space-y-6">
              {/* Course Info Card */}
              {course && (
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Thông tin khóa học
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Course Image */}
                    <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl border-2 border-blue-200 flex items-center justify-center relative overflow-hidden">
                      {course.image && !course.image.includes('undefined') ? (
                        <img 
                          src={course.image}
                          alt="Course" 
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : (
                        <BookOpen className="h-16 w-16 text-blue-400" />
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-blue-600 font-medium text-sm">Mã khóa học</span>
                        <div className="text-base font-mono font-bold text-blue-900 mt-1">{course.id}</div>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium text-sm">Tiêu đề</span>
                        <div className="text-base text-blue-800 mt-1">{course.title}</div>
                      </div>
                      {/* Temporary comment out topics display */}
                      {/* <div>
                        <span className="text-blue-600 font-medium text-sm">Chủ đề</span>
                        <div className="text-base text-blue-800 mt-1">
                          {course.topics.map((topic, idx) => (
                            <span key={topic.id}>
                              {topic.name}
                              {idx < course.topics.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </div> */}
                      <div>
                        <span className="text-blue-600 font-medium text-sm">Trình độ</span>
                        <div className="text-base text-blue-800 mt-1">{course.level}</div>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium text-sm">Thời gian</span>
                        <div className="text-base text-blue-800 mt-1">{course.duration} giờ</div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-blue-600 font-medium text-sm">Mô tả</span>
                      <div className="text-sm text-blue-700 mt-1">{course.description}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    onClick={handleEditChapter}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa chương
                  </Button>
                  
                  {chapter.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                      onClick={handleDeactivateChapter}
                      disabled={isLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {isLoading ? 'Đang xử lý...' : 'Hủy kích hoạt chương'}
                    </Button>
                  )}

                  {chapter.status === 'INACTIVE' && (
                    <Button
                      variant="outline"
                      className="w-full border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                      onClick={handleActivateChapter}
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isLoading ? 'Đang xử lý...' : 'Kích hoạt lại chương'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Chapter Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Chapter Header */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  {/* Page Title */}
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-blue-900">Chi tiết chương</h1>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3 mb-6">
                    {getStatusBadge(chapter.status)}
                  </div>

                  {/* Chapter Details */}
                  <div className="space-y-6">
                    <div>
                      <span className="text-blue-600 font-medium text-sm">Mã chương</span>
                      <div className="text-lg font-mono font-bold text-blue-900 mt-1">{chapter.id}</div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium text-sm">Tiêu đề chương</span>
                      <div className="text-xl font-bold text-blue-900 mt-1">{chapter.title}</div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium text-sm">Mô tả chương</span>
                      <div className="text-base text-blue-800 mt-1 whitespace-pre-line">{chapter.description}</div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium text-sm">Chương tiên quyết</span>
                      <div className="text-base text-blue-800 mt-1">
                        {chapter.prerequisiteChapterId || "Không có"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Units List */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      Danh sách bài học ({chapter.units?.length || 0})
                    </CardTitle>
                    <Button 
                      onClick={handleAddUnit}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm bài học
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`space-y-4 ${chapter.units && chapter.units.length > 6 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
                    {chapter.units && chapter.units.length > 0 ? (
                      chapter.units.map((unit: Unit, index: number) => (
                        <div 
                          key={unit.id} 
                          className="p-4 bg-white rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                                  {index + 1}
                                </div>
                                <h4 className="font-semibold text-blue-900 text-lg">{unit.title}</h4>
                                {getStatusBadge(unit.status)}
                              </div>
                              <p className="text-blue-700 text-sm mb-2 ml-11">{unit.description}</p>
                              <div className="text-xs text-blue-500 ml-11">
                                <div>Mã bài học: {unit.id}</div>
                                {unit.prerequisiteUnitId && (
                                  <div>Bài học tiên quyết: {unit.prerequisiteUnitId}</div>
                                )}
                                {unit.exams && unit.exams.length > 0 && (
                                  <div>Số bài kiểm tra: {unit.exams.length}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewUnit(unit.id)}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Xem chi tiết
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <BookOpen className="h-16 w-16 mx-auto text-blue-300 mb-4" />
                        <p className="text-blue-600 font-medium mb-2">Chưa có bài học nào</p>
                        <p className="text-sm text-blue-500 mb-6">
                          Thêm bài học đầu tiên cho chương này
                        </p>
                        <Button 
                          onClick={handleAddUnit}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Thêm bài học
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Exams List */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-purple-600" />
                      Danh sách bài kiểm tra ({chapter.exams?.length || 0})
                    </CardTitle>
                    <Button 
                      variant="outline"
                      className="text-purple-600 border-purple-300 hover:bg-purple-50"
                      onClick={() => navigate('/staff/create-exam', { 
                        state: { 
                          scope: 'chapter', 
                          scopeId: chapter.id, 
                          scopeName: chapter.title 
                        } 
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo bài kiểm tra
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`space-y-4 ${chapter.exams && chapter.exams.length > 4 ? 'max-h-80 overflow-y-auto pr-2' : ''}`}>
                    {chapter.exams && chapter.exams.length > 0 ? (
                      chapter.exams.map((exam: Exam, index: number) => (
                        <div 
                          key={exam.id} 
                          className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-medium">
                                  {index + 1}
                                </div>
                                <h4 className="font-semibold text-purple-900 text-lg">{exam.title}</h4>
                                
                              </div>
                              <p className="text-purple-700 text-sm mb-2 ml-11">{exam.description}</p>
                              <div className="text-xs text-purple-500 ml-11">
                                <div>Mã bài kiểm tra: {exam.id}</div>
                                <div>Thời gian: {exam.duration} phút</div>
                                <div>Số câu hỏi: {exam.totalQuestions || 0}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/staff/exams/${exam.id}/edit`, {
                                  state: {
                                    scope: 'chapter',
                                    scopeId: chapter.id,
                                    scopeName: chapter.title,
                                    courseId: courseId,
                                    courseName: course?.title || '',
                                    chapterId: chapter.id,
                                    chapterName: chapter.title,
                                    returnUrl: `/staff/courses/${courseId}/chapters/${chapter.id}`,
                                    returnState: { course, chapter }
                                  }
                                })}
                                className="text-purple-600 border-purple-300 hover:bg-purple-50"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Chỉnh sửa
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <AlertCircle className="h-16 w-16 mx-auto text-purple-300 mb-4" />
                        <p className="text-purple-600 font-medium mb-2">Chưa có bài kiểm tra nào</p>
                        <p className="text-sm text-purple-500 mb-6">
                          Thêm bài kiểm tra đầu tiên cho chương này
                        </p>
                        <Button 
                          onClick={() => navigate('/staff/create-exam', { 
                            state: { 
                              scope: 'chapter', 
                              scopeId: chapter.id, 
                              scopeName: chapter.title 
                            } 
                          })}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tạo bài kiểm tra
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

export default StaffChapterDetailPage
