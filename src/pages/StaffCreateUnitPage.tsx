import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { AlertCircle, ArrowLeft, BookOpen, Hash, Info, Plus, FileText } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { StaffNavigation } from '../components/layout/StaffNavigation'
import { CourseService } from '../services/courseService'
import type { CreateUnitRequest, Chapter, Course } from '../types/course'
import { useToast } from '../hooks/useToast'

interface LocationState {
  course?: Course
  chapter?: Chapter
}

// Simplified material interface for form (we'll create materials separately)
interface MaterialFormData {
  id: number
  type: string
  description: string
  fileUrl: string
  expanded: boolean
}

const StaffCreateUnitPage: React.FC = () => {
  const navigate = useNavigate()
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const location = useLocation()
  const locationState = location.state as LocationState || {}
  const { showToast } = useToast()

  const [course, setCourse] = useState<Course | null>(locationState.course || null)
  const [chapter, setChapter] = useState<Chapter | null>(locationState.chapter || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    prerequisiteUnitId: ''
  })

  const [materials, setMaterials] = useState<MaterialFormData[]>([
    {
      id: 1,
      type: '',
      description: '',
      fileUrl: '',
      expanded: true
    }
  ])

  // Simple add material function
  const addMaterial = () => {
    const newId = Math.max(...materials.map(m => m.id)) + 1
    setMaterials(prev => [
      ...prev,
      {
        id: newId,
        type: '',
        description: '',
        fileUrl: '',
        expanded: true
      }
    ])
  }

  // Fetch data if not provided through location state
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !chapterId) {
        setError("ID khóa học hoặc chương không hợp lệ")
        return
      }

      // If we don't have course or chapter data, fetch them
      if (!course || !chapter) {
        setIsLoadingData(true)
        try {
          const [courseResult, chapterResult] = await Promise.all([
            course ? Promise.resolve({ data: course }) : CourseService.getCourseDetail(courseId),
            chapter ? Promise.resolve({ data: chapter }) : CourseService.getChapterDetail(chapterId)
          ])

          if (!course && courseResult.data) {
            setCourse(courseResult.data)
          }
          if (!chapter && chapterResult.data) {
            setChapter(chapterResult.data)
          }
        } catch (error) {
          console.error('Error fetching data:', error)
          setError('Không thể tải thông tin khóa học hoặc chương')
        } finally {
          setIsLoadingData(false)
        }
      }
    }

    fetchData()
  }, [courseId, chapterId, course, chapter])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBack = () => {
    if (courseId && chapterId && course && chapter) {
      navigate(`/staff/courses/${courseId}/chapters/${chapterId}`, { 
        state: { course, chapter } 
      })
    } else {
      navigate('/staff/courses')
    }
  }

  const isFormValid = formData.id.trim() &&
                     formData.title.trim() && 
                     formData.description.trim()
                     // Remove material validation for now since we'll simplify this

  const validateSubmitForm = (): boolean => {
    if (!isFormValid) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return false
    }

    if (!chapterId) {
      setError("Không tìm thấy ID chương")
      return false
    }

    return true
  }

  const createUnitData = (): CreateUnitRequest => {
    return {
      id: formData.id.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: "INACTIVE",
      chapterId: chapterId!,
      prerequisiteUnitId: formData.prerequisiteUnitId.trim() || null
    }
  }

  const handleSubmitSuccess = () => {
    showToast('success', 'Tạo bài học thành công!')
    
    navigate(`/staff/courses/${courseId}/chapters/${chapterId}`, {
      replace: true,
      state: { 
        course,
        chapter,
        message: 'Tạo bài học thành công!',
        refreshData: true,
        timestamp: Date.now()
      }
    })
  }

  const handleSubmitError = (error: unknown) => {
    console.error('❌ Error creating unit:', error)
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status: number, data?: unknown } }
      const errorData = axiosError.response?.data as { message?: string }
      const errorMsg = errorData?.message || 'Lỗi không xác định'
      
      let userFriendlyError = errorMsg
      if (axiosError.response?.status === 400) {
        if (errorMsg.includes('prerequisite') || errorMsg.includes('tiên quyết')) {
          userFriendlyError = 'Lỗi bài học tiên quyết: ' + errorMsg
        } else if (errorMsg.includes('duplicate') || errorMsg.includes('đã tồn tại')) {
          userFriendlyError = 'Tên bài học đã tồn tại trong chương này'
        } else {
          userFriendlyError = 'Dữ liệu không hợp lệ: ' + errorMsg
        }
      }
      
      const errorMessage = `Lỗi tạo bài học (${axiosError.response?.status}): ${userFriendlyError}`
      showToast('error', errorMessage)
      setError(errorMessage)
    } else {
      const fallbackError = 'Có lỗi xảy ra khi tạo bài học. Vui lòng thử lại.'
      showToast('error', fallbackError)
      setError(fallbackError)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateSubmitForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const unitData = createUnitData()

      console.log('📤 Sending unit data:', {
        ...unitData,
        prerequisiteNote: unitData.prerequisiteUnitId ? 'Has prerequisite' : 'No prerequisite (null)'
      })

      await CourseService.createUnit(unitData)
      handleSubmitSuccess()
    } catch (error) {
      handleSubmitError(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-blue-600 animate-pulse mb-4" />
            <p className="text-xl text-blue-600 font-medium">Đang tải thông tin khóa học và chương...</p>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  if (!course || !chapter) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">Không tìm thấy thông tin khóa học hoặc chương</p>
            <Button onClick={() => navigate('/staff/courses')} className="mt-4">
              Quay lại danh sách khóa học
            </Button>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  return (
    <StaffNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="p-2 hover:bg-blue-100 text-blue-600 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-900 mb-1">Thêm bài học mới</h1>
                <p className="text-blue-600 text-sm font-medium">Tạo bài học mới cho chương học</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">{error}</div>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Course & Chapter Info */}
            <div className="lg:col-span-1">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm sticky top-24">
                <CardContent className="p-8">
                  {/* Info Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                        <Info className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-blue-900">Thông tin</h2>
                    </div>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                  </div>

                  {/* Course Image */}
                  <div className="mb-6">
                    <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl border-2 border-blue-200 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                      {course.image && !course.image.includes('undefined') ? (
                        <img 
                          src={course.image || '/img/NhatBan.webp'}
                          alt="Course" 
                          className="w-full h-full object-cover rounded-lg relative z-10"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="relative z-10 text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-blue-600 font-medium text-xs">Ảnh khóa học</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-4 mb-8">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-blue-600 font-medium text-xs">ID KHÓA HỌC</span>
                        <Badge className="bg-blue-600 text-white font-mono text-xs">{course.id}</Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-blue-600 font-medium text-xs mb-1">TÊN KHÓA HỌC</div>
                      <h3 className="text-blue-900 font-bold text-sm leading-tight">{course.title}</h3>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-green-700 font-medium text-xs">MỨC ĐỘ</span>
                        <Badge className="bg-green-600 text-white text-xs">{course.level}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Chapter Info */}
                  <div className="border-t border-blue-100 pt-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-purple-600" />
                        <span className="text-purple-600 font-medium text-xs">CHƯƠNG</span>
                      </div>
                      <Badge className="bg-purple-600 text-white text-xs mb-2">{chapter.id}</Badge>
                    </div>

                    <div className="mb-4">
                      <div className="text-purple-600 font-medium text-xs mb-1">TÊN CHƯƠNG</div>
                      <h4 className="text-purple-900 font-bold text-sm leading-tight">{chapter.title}</h4>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-700 font-medium text-xs">SỐ BÀI HỌC HIỆN TẠI</span>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-orange-600" />
                          <span className="text-xl font-bold text-orange-800">{chapter.units?.length || 0}</span>
                          <span className="text-orange-600 text-xs">bài học</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Note */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mt-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                        <Info className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-amber-800 text-sm font-medium mb-1">Lưu ý về tài liệu</p>
                        <p className="text-amber-700 text-xs leading-relaxed">
                          Mỗi bài học cần có ít nhất một tài liệu học tập. Tài liệu sẽ được tạo tự động khi tạo bài học.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Unit Information */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Plus className="h-6 w-6" />
                      Thông tin bài học
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Unit ID */}
                      <div className="space-y-3">
                        <Label htmlFor="id" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                          Mã bài học <span className="text-red-500">*</span>
                          <div className="bg-blue-100 p-1 rounded-full">
                            <Hash className="h-3 w-3 text-blue-600" />
                          </div>
                        </Label>
                        <Input
                          id="id"
                          value={formData.id}
                          onChange={(e) => handleInputChange("id", e.target.value)}
                          placeholder="Ví dụ: UNIT01"
                          className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-base py-3 bg-white/80 backdrop-blur-sm"
                          required
                        />
                      </div>

                      {/* Unit Title */}
                      <div className="space-y-3">
                        <Label htmlFor="title" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                          Tên bài học <span className="text-red-500">*</span>
                          <div className="bg-blue-100 p-1 rounded-full">
                            <BookOpen className="h-3 w-3 text-blue-600" />
                          </div>
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          placeholder="Ví dụ: Ngữ pháp về Hiragana"
                          className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-base py-3 bg-white/80 backdrop-blur-sm"
                          required
                        />
                      </div>
                    </div>

                    {/* Unit Description */}
                    <div className="space-y-3 mt-6">
                      <Label htmlFor="description" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Mô tả bài học <span className="text-red-500">*</span>
                        <div className="bg-blue-100 p-1 rounded-full">
                          <Info className="h-3 w-3 text-blue-600" />
                        </div>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Mô tả chi tiết về nội dung bài học..."
                        rows={4}
                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 resize-none text-base bg-white/80 backdrop-blur-sm"
                        required
                      />
                      <p className="text-blue-600 text-xs">
                        Mô tả nội dung, mục tiêu học tập và những gì học viên sẽ đạt được
                      </p>
                    </div>

                    {/* Prerequisite Unit */}
                    <div className="space-y-3 mt-6">
                      <Label htmlFor="prerequisiteUnit" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Bài học tiên quyết (tùy chọn)
                        <div className="bg-blue-100 p-1 rounded-full">
                          <Hash className="h-3 w-3 text-blue-600" />
                        </div>
                      </Label>
                      <Input
                        id="prerequisiteUnit"
                        value={formData.prerequisiteUnitId}
                        onChange={(e) => handleInputChange("prerequisiteUnitId", e.target.value)}
                        placeholder="Ví dụ: UNIT00 (để trống nếu không có)"
                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-base py-3 bg-white/80 backdrop-blur-sm"
                      />
                      <p className="text-blue-600 text-xs">
                        Nhập mã bài học tiên quyết nếu bài học này cần học trước. Để trống nếu là bài học đầu tiên.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Materials */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Tài liệu học tập (Tùy chọn)
                      </CardTitle>
                      <Button
                        type="button"
                        onClick={addMaterial}
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm tài liệu
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                          <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-blue-800 text-sm font-medium mb-1">Chức năng đang phát triển</p>
                          <p className="text-blue-700 text-xs leading-relaxed">
                            Tính năng quản lý tài liệu sẽ được hoàn thiện trong phiên bản tiếp theo. 
                            Hiện tại bạn có thể tạo bài học trước, sau đó thêm tài liệu riêng biệt.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="px-8 py-3 border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent font-medium"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid || isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isLoading ? 'Đang tạo...' : 'Tạo bài học'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </StaffNavigation>
  )
}

export default StaffCreateUnitPage
