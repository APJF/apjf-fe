import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { AlertCircle, ArrowLeft, BookOpen, Info } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { StaffNavigation } from '../components/layout/StaffNavigation'
import { StaffChapterService, type UpdateChapterRequest, type Chapter } from '../services/staffChapterService'
import { CourseService } from '../services/courseService'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import type { ChapterDetail, StaffCourseDetail } from '../types/staffCourse'

interface LocationState {
  chapter?: ChapterDetail
  course?: StaffCourseDetail
}

interface UpdateChapterFormData {
  id: string
  title: string
  description: string
  prerequisiteChapterId: string
  courseId: string
}

const StaffUpdateChapterPage: React.FC = () => {
  const navigate = useNavigate()
  const { chapterId } = useParams<{ chapterId: string }>()
  const location = useLocation()
  const locationState = location.state as LocationState || {}

  const [chapter, setChapter] = useState<ChapterDetail | null>(locationState.chapter || null)
  const [course] = useState<StaffCourseDetail | null>(locationState.course || null)
  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<UpdateChapterFormData>({
    id: '',
    title: '',
    description: '',
    prerequisiteChapterId: '',
    courseId: ''
  })

  useEffect(() => {
    if (!chapterId) {
      setError("ID chương không hợp lệ")
      return
    }

    if (!chapter) {
      fetchChapterData()
    } else {
      initializeFormData(chapter)
    }
    
    // Fetch available chapters for prerequisite selection
    fetchAvailableChapters()
  }, [chapterId, chapter])

  const fetchChapterData = async () => {
    if (!chapterId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await StaffChapterService.getChapterDetail(chapterId)
      if (response.success && response.data) {
        // Convert Chapter to ChapterDetail
        const chapterDetail: ChapterDetail = {
          ...response.data,
          description: response.data.description || '',
          units: []
        }
        setChapter(chapterDetail)
        initializeFormData(chapterDetail)
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

  const fetchAvailableChapters = async () => {
    if (!chapter?.courseId && !course?.id) return

    try {
      const courseId = chapter?.courseId || course?.id
      if (courseId) {
        const response = await CourseService.getChaptersByCourseId(courseId)
        if (response.success && response.data) {
          // Filter out current chapter
          const filtered = response.data.filter(c => c.id !== chapterId)
          setAvailableChapters(filtered)
        }
      }
    } catch (error) {
      console.error('Error fetching available chapters:', error)
    }
  }

  const initializeFormData = (chapterData: ChapterDetail) => {
    setFormData({
      id: chapterData.id || '',
      title: chapterData.title || '',
      description: chapterData.description || '',
      prerequisiteChapterId: chapterData.prerequisiteChapterId || '',
      courseId: chapterData.courseId || ''
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBack = () => {
    if (chapter) {
      navigate(`/staff/courses/${chapter.courseId}/chapters/${chapter.id}`, { 
        state: { chapter, course } 
      })
    } else {
      navigate('/staff/courses')
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-600'
      case 'INACTIVE': return 'bg-yellow-600'
      default: return 'bg-red-600'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (!chapterId) {
      setError("ID chương không hợp lệ")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const updateData: UpdateChapterRequest = {
        id: chapter?.id || formData.id.trim(), // Giữ nguyên ID gốc
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: chapter?.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        courseId: chapter?.courseId || formData.courseId.trim(), // Giữ nguyên courseId gốc
        prerequisiteChapterId: formData.prerequisiteChapterId.trim() || null, // Cho phép cập nhật prerequisite
        exams: chapter?.exams || []
      }

      const response = await StaffChapterService.updateChapter(chapterId, updateData)
      
      if (response.success && response.data) {
        // Navigate back to chapter detail with updated data and success message
        navigate(`/staff/courses/${chapter?.courseId}/chapters/${chapterId}`, {
          replace: true,
          state: { 
            chapter: response.data,
            course: course,
            message: 'Cập nhật chương thành công!',
            refreshData: true,
            timestamp: Date.now()
          }
        })
      } else {
        setError(response.message || 'Cập nhật chương thất bại')
      }
    } catch (error) {
      console.error('Error updating chapter:', error)
      setError('Có lỗi xảy ra khi cập nhật chương. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.title.trim() && 
                     formData.description.trim()

  if (isLoading && !chapter) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-blue-600 animate-pulse mb-4" />
            <p className="text-xl text-blue-600 font-medium">Đang tải thông tin chương...</p>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  if (error && !chapter) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <h3 className="font-semibold">Lỗi tải dữ liệu</h3>
              <p className="text-sm mt-1">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={fetchChapterData} size="sm">
                  Thử lại
                </Button>
                <Button variant="outline" onClick={() => navigate('/staff/courses')} size="sm">
                  Quay lại danh sách
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">Không tìm thấy thông tin chương</p>
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
                <h1 className="text-2xl font-bold text-blue-900 mb-1">Chỉnh sửa chương</h1>
                <p className="text-blue-600 text-sm font-medium">Cập nhật thông tin chương học</p>
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
            {/* Left Sidebar - Chapter Info */}
            <div className="lg:col-span-1">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm sticky top-24">
                <CardContent className="p-8">
                  {/* Info Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                        <Info className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-blue-900">Thông tin hiện tại</h2>
                    </div>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                  </div>

                  {/* Chapter Details */}
                  <div className="space-y-4 mb-8">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-blue-600 font-medium text-xs">ID CHƯƠNG</span>
                        <Badge className="bg-blue-600 text-white font-mono text-xs">{chapter.id}</Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-blue-600 font-medium text-xs mb-1">TÊN CHƯƠNG</div>
                      <h3 className="text-blue-900 font-bold text-sm leading-tight">{chapter.title}</h3>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-green-700 font-medium text-xs">TRẠNG THÁI</span>
                        <Badge className={`text-xs text-white ${getStatusBadgeColor(chapter.status)}`}>
                          {chapter.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700 font-medium text-xs">SỐ BÀI HỌC</span>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-purple-600" />
                          <span className="text-lg font-bold text-purple-800">{chapter.units?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    {course && (
                      <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-700 font-medium text-xs">KHÓA HỌC</span>
                          <Badge className="bg-indigo-600 text-white text-xs">{course.title}</Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Note */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                        <Info className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-amber-800 text-sm font-medium mb-1">Lưu ý khi chỉnh sửa</p>
                        <p className="text-amber-700 text-xs leading-relaxed">
                          Thay đổi sẽ được lưu với trạng thái INACTIVE. Chương cần được phê duyệt lại sau khi chỉnh sửa.
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
                {/* Basic Information */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <BookOpen className="h-6 w-6" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Chapter ID - Read only */}
                      <div className="space-y-3">
                        <Label htmlFor="chapterId" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                          Mã chương
                          <div className="bg-blue-100 p-1 rounded-full">
                            <BookOpen className="h-3 w-3 text-blue-600" />
                          </div>
                        </Label>
                        <Input
                          id="chapterId"
                          value={formData.id}
                          className="border-blue-300 bg-gray-100 text-gray-600 cursor-not-allowed text-base py-3"
                          readOnly
                          pointer-events-none
                        />
                        <p className="text-amber-600 text-xs mt-1">
                          ⚠️ Mã chương không thể thay đổi sau khi tạo
                        </p>
                      </div>

                      {/* Course ID - Read only */}
                      <div className="space-y-3">
                        <Label htmlFor="courseId" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                          Mã khóa học
                          <div className="bg-indigo-100 p-1 rounded-full">
                            <BookOpen className="h-3 w-3 text-indigo-600" />
                          </div>
                        </Label>
                        <Input
                          id="courseId"
                          value={formData.courseId}
                          className="border-blue-300 bg-gray-100 text-gray-600 cursor-not-allowed text-base py-3"
                          readOnly
                          pointer-events-none
                        />
                        <p className="text-amber-600 text-xs mt-1">
                          ⚠️ Không thể thay đổi khóa học
                        </p>
                      </div>
                    </div>

                    {/* Chapter Title */}
                    <div className="space-y-3 mt-6">
                      <Label htmlFor="title" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Tiêu đề chương <span className="text-red-500">*</span>
                        <div className="bg-blue-100 p-1 rounded-full">
                          <BookOpen className="h-3 w-3 text-blue-600" />
                        </div>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Ví dụ: Hiragana cơ bản"
                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-base py-3 bg-white/80 backdrop-blur-sm"
                        required
                      />
                    </div>

                    {/* Chapter Description */}
                    <div className="space-y-3 mt-6">
                      <Label htmlFor="description" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Mô tả chương <span className="text-red-500">*</span>
                        <div className="bg-blue-100 p-1 rounded-full">
                          <Info className="h-3 w-3 text-blue-600" />
                        </div>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Mô tả chi tiết về nội dung và mục tiêu của chương học..."
                        rows={4}
                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 resize-none text-base bg-white/80 backdrop-blur-sm"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Information */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Info className="h-6 w-6" />
                      Thông tin bổ sung
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    {/* Prerequisite Chapter - SearchableSelect */}
                    <div className="space-y-3 relative z-20">
                      <Label htmlFor="prerequisite" className="text-blue-800 font-semibold text-base">
                        Chương tiên quyết
                      </Label>
                      <SearchableSelect
                        value={formData.prerequisiteChapterId}
                        onChange={(value) => handleInputChange("prerequisiteChapterId", value)}
                        options={availableChapters.map(chapter => ({
                          id: chapter.id,
                          title: chapter.title,
                          subtitle: `Mã: ${chapter.id} • Trạng thái: ${chapter.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}`
                        }))}
                        placeholder="Chọn hoặc tìm kiếm chương tiên quyết..."
                        emptyText="Không có chương tiên quyết"
                        className="bg-white/80 backdrop-blur-sm"
                      />
                      <p className="text-blue-600 text-xs mt-1">
                        💡 Chọn chương mà học viên cần hoàn thành trước khi học chương này
                      </p>
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
                    {isLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
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

export default StaffUpdateChapterPage
