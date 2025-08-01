import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { AlertCircle, BookOpen, ArrowLeft, Plus, Edit, Eye } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StaffNavigation } from '../components/layout/StaffNavigation'
import { StaffChapterService } from '../services/staffChapterService'
import { StaffUnitService } from '../services/staffUnitService'
import type { StaffCourseDetail, ChapterDetail, Unit } from '../types/staffCourse'

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

  const [course] = useState<StaffCourseDetail | null>(locationState.course || null)
  const [chapter, setChapter] = useState<ChapterDetail | null>(locationState.chapter || null)
  const [isLoading, setIsLoading] = useState(!locationState.chapter)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(locationState.message || null)

  useEffect(() => {
    if (!chapterId) {
      setError("ID chương không hợp lệ")
      setIsLoading(false)
      return
    }

    // Nếu đã có dữ liệu từ location state thì không cần fetch
    if (locationState.chapter && !locationState.refreshData) {
      return
    }

    fetchChapterData()
  }, [chapterId, locationState.chapter, locationState.refreshData])

  // Handle success message cleanup
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const fetchChapterData = async () => {
    if (!chapterId) return

    setIsLoading(true)
    setError(null)

    try {
      const [chapterResponse, unitsResponse] = await Promise.all([
        StaffChapterService.getChapterDetail(chapterId),
        StaffUnitService.getUnitsByChapter(chapterId)
      ])
      
      if (chapterResponse.success && chapterResponse.data) {
        // Create ChapterDetail with units
        const chapterData: ChapterDetail = {
          ...chapterResponse.data,
          description: chapterResponse.data.description || '',
          units: unitsResponse.success ? 
            sortUnitsByPrerequisite(unitsResponse.data.map(unit => ({
              ...unit,
              description: unit.description || '',
              chapterId: chapterResponse.data.id,
              exams: []
            })) || []) : []
        }
        setChapter(chapterData)
      } else {
        setError("Không tìm thấy thông tin chương")
      }
    } catch (error) {
      console.error('Error fetching chapter data:', error)
      setError("Không thể tải thông tin chương. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewUnit = (unitId: string) => {
    const unit = chapter?.units.find(u => u.id === unitId)
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
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm sticky top-6">
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
                          src={course.image || '/img/NhatBan.webp'}
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
                  <Button 
                    variant="outline" 
                    className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
                    onClick={() => navigate('/staff/create-exam', { 
                      state: { 
                        scope: 'chapter', 
                        scopeId: chapter.id, 
                        scopeName: chapter.title 
                      } 
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo Exam
                  </Button>
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
                    <div className="flex gap-2">
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
                        Tạo Exam
                      </Button>
                      <Button 
                        onClick={handleAddUnit}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm bài học
                      </Button>
                    </div>
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
            </div>
          </div>
        </div>
      </div>
    </StaffNavigation>
  )
}

export default StaffChapterDetailPage
