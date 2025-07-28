import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { AlertCircle, ArrowLeft, BookOpen, Hash, Info, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { StaffNavigation } from '../components/layout/StaffNavigation'
import { StaffChapterService } from '../services/staffChapterService'
import { StaffCourseService } from '../services/staffCourseService'
import type { CreateChapterRequest, StaffCourseDetail } from '../types/staffCourse'

interface LocationState {
  course?: StaffCourseDetail
}

const StaffCreateChapterPage: React.FC = () => {
  const navigate = useNavigate()
  const { courseId } = useParams<{ courseId: string }>()
  const location = useLocation()
  const locationState = location.state as LocationState || {}

  const [course, setCourse] = useState<StaffCourseDetail | null>(locationState.course || null)
  const [chapterCount, setChapterCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    prerequisiteChapterId: ''
  })

  useEffect(() => {
    if (!courseId) {
      setError("ID khóa học không hợp lệ")
      return
    }

    if (!course) {
      fetchCourseData()
    } else {
      setChapterCount(course.chapters?.length || 0)
    }
  }, [courseId, course])

  const fetchCourseData = async () => {
    if (!courseId) return

    setIsLoading(true)
    setError(null)

    try {
      const [courseData, courseDetailData] = await Promise.all([
        StaffCourseService.getCourseDetail(courseId),
        StaffCourseService.getCourseWithChapters(courseId)
      ])

      if (courseData.success && courseData.data) {
        setCourse(courseData.data)
        setChapterCount(courseDetailData.data?.course.chapters?.length || 0)
      } else {
        setError("Không tìm thấy khóa học")
      }
    } catch (error) {
      console.error('Error fetching course data:', error)
      setError("Không thể tải thông tin khóa học. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBack = () => {
    if (courseId && course) {
      navigate(`/staff/courses/${courseId}`, { state: { course } })
    } else {
      navigate('/staff/courses')
    }
  }

  const isFormValid = formData.id.trim() && 
                     formData.title.trim() && 
                     formData.description.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (!courseId) {
      setError("Không tìm thấy ID khóa học")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const chapterData: CreateChapterRequest = {
        id: formData.id.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: "DRAFT",
        courseId,
        prerequisiteChapterId: formData.prerequisiteChapterId.trim() || null,
        units: []
      }

      await StaffChapterService.createChapter(chapterData)
      
      // Navigate back to course detail with success message and force refresh
      navigate(`/staff/courses/${courseId}`, {
        replace: true,
        state: { 
          message: 'Tạo chương thành công!',
          refreshData: true,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.error('Error creating chapter:', error)
      setError('Có lỗi xảy ra khi tạo chương. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!course && isLoading) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-blue-600 animate-pulse mb-4" />
            <p className="text-xl text-blue-600 font-medium">Đang tải thông tin khóa học...</p>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  if (error && !course) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <h3 className="font-semibold">Lỗi tải dữ liệu</h3>
              <p className="text-sm mt-1">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => fetchCourseData()} size="sm">
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

  if (!course) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">Không tìm thấy khóa học</p>
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
                <h1 className="text-2xl font-bold text-blue-900 mb-1">Thêm chương mới</h1>
                <p className="text-blue-600 text-sm font-medium">Tạo chương học mới cho khóa học tiếng Nhật</p>
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
            {/* Left Sidebar - Course Info */}
            <div className="lg:col-span-1">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm sticky top-24">
                <CardContent className="p-8">
                  {/* Course Info Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-blue-900">Thông tin khóa học</h2>
                    </div>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                  </div>

                  {/* Course Image */}
                  <div className="mb-6">
                    <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl border-2 border-blue-200 flex items-center justify-center relative overflow-hidden">
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
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                            <BookOpen className="h-8 w-8 text-white" />
                          </div>
                          <p className="text-blue-600 font-medium text-sm">Ảnh khóa học</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-600 font-medium text-sm">ID Khóa học</span>
                        <Badge className="bg-blue-600 text-white font-mono text-xs">{course.id}</Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-blue-600 font-medium text-sm mb-2">Tên khóa học</div>
                      <h3 className="text-blue-900 font-bold text-lg leading-tight">{course.title}</h3>
                    </div>

                    <div>
                      <div className="text-blue-600 font-medium text-sm mb-2">Trình độ</div>
                      <Badge className="bg-green-100 text-green-800 font-medium">{course.level}</Badge>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-700 font-medium text-sm">Số chương hiện tại</span>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-green-600" />
                          <span className="text-2xl font-bold text-green-800">{chapterCount}</span>
                          <span className="text-green-600 text-sm">chương</span>
                        </div>
                      </div>
                    </div>

                    {/* Info Note */}
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-start gap-3">
                        <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                          <Info className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-amber-800 text-sm font-medium mb-1">Lưu ý về thứ tự</p>
                          <p className="text-amber-700 text-xs leading-relaxed">
                            Chương được hiển thị theo thứ tự tiên quyết. Chương không có tiên quyết sẽ hiển thị đầu tiên.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Plus className="h-6 w-6" />
                    Thông tin chương mới
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Chapter ID */}
                    <div className="space-y-3">
                      <Label htmlFor="chapterId" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Mã chương <span className="text-red-500">*</span>
                        <div className="bg-blue-100 p-1 rounded-full">
                          <Hash className="h-3 w-3 text-blue-600" />
                        </div>
                      </Label>
                      <Input
                        id="chapterId"
                        value={formData.id}
                        onChange={(e) => handleInputChange("id", e.target.value)}
                        placeholder="Ví dụ: CHAP01"
                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-base py-3 bg-white/80 backdrop-blur-sm"
                        required
                      />
                    </div>

                    {/* Chapter Name */}
                    <div className="space-y-3">
                      <Label htmlFor="title" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Tên chương <span className="text-red-500">*</span>
                        <div className="bg-blue-100 p-1 rounded-full">
                          <BookOpen className="h-3 w-3 text-blue-600" />
                        </div>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Ví dụ: Hiragana - Bảng chữ cái cơ bản"
                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-base py-3 bg-white/80 backdrop-blur-sm"
                        required
                      />
                      <p className="text-blue-600 text-xs">Nhập tên chương rõ ràng và dễ hiểu cho học viên</p>
                    </div>

                    {/* Chapter Description */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="description"
                        className="text-blue-800 font-semibold text-base flex items-center gap-2"
                      >
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
                        rows={5}
                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 resize-none text-base bg-white/80 backdrop-blur-sm"
                        required
                      />
                      <p className="text-blue-600 text-xs">
                        Mô tả nội dung, mục tiêu học tập và những gì học viên sẽ đạt được
                      </p>
                    </div>

                    {/* Prerequisite Chapter */}
                    <div className="space-y-3">
                      <Label htmlFor="prerequisiteChapter" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Chương tiên quyết (tùy chọn)
                        <div className="bg-blue-100 p-1 rounded-full">
                          <Hash className="h-3 w-3 text-blue-600" />
                        </div>
                      </Label>
                      <Input
                        id="prerequisiteChapter"
                        value={formData.prerequisiteChapterId}
                        onChange={(e) => handleInputChange("prerequisiteChapterId", e.target.value)}
                        placeholder="Ví dụ: CHAP00 (để trống nếu không có)"
                        className="border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-base py-3 bg-white/80 backdrop-blur-sm"
                      />
                      <p className="text-blue-600 text-xs">Nhập mã chương tiên quyết nếu chương này cần học trước. Để trống nếu là chương đầu tiên.</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-8 border-t border-blue-100">
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
                        {isLoading ? 'Đang tạo...' : 'Tạo chương'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </StaffNavigation>
  )
}

export default StaffCreateChapterPage
