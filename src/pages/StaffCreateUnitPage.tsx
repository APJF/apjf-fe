import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { AlertCircle, ArrowLeft, BookOpen, Hash, Info, Plus, FileText, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { StaffNavigation } from '../components/layout/StaffNavigation'
import { StaffUnitService } from '../services/staffUnitService'
import { MaterialService, type CreateMaterialRequest, type MaterialType } from '../services/materialService'
import type { CreateUnitRequest, StaffCourseDetail, ChapterDetail } from '../types/staffCourse'

interface LocationState {
  course?: StaffCourseDetail
  chapter?: ChapterDetail
}

interface MaterialFormData {
  id: number
  type: MaterialType | ''
  description: string
  fileUrl: string
  expanded: boolean
}

const StaffCreateUnitPage: React.FC = () => {
  const navigate = useNavigate()
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const location = useLocation()
  const locationState = location.state as LocationState || {}

  const [course] = useState<StaffCourseDetail | null>(locationState.course || null)
  const [chapter] = useState<ChapterDetail | null>(locationState.chapter || null)
  const [isLoading, setIsLoading] = useState(false)
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

  const materialTypes: { value: MaterialType; label: string }[] = [
    { value: 'KANJI', label: 'Kanji' },
    { value: 'GRAMMAR', label: 'Ngữ pháp' },
    { value: 'VOCAB', label: 'Từ vựng' },
    { value: 'LISTENING', label: 'Nghe hiểu' },
    { value: 'READING', label: 'Đọc hiểu' },
    { value: 'WRITING', label: 'Viết' }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMaterialChange = (id: number, field: string, value: string) => {
    setMaterials(prev => 
      prev.map(material => 
        material.id === id ? { ...material, [field]: value } : material
      )
    )
  }

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

  const removeMaterial = (id: number) => {
    if (materials.length > 1) {
      setMaterials(prev => prev.filter(material => material.id !== id))
    }
  }

  const toggleMaterial = (id: number) => {
    setMaterials(prev =>
      prev.map(material =>
        material.id === id ? { ...material, expanded: !material.expanded } : material
      )
    )
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
                     formData.description.trim() &&
                     materials.every(m => m.type && m.description.trim() && m.fileUrl.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (!chapterId) {
      setError("Không tìm thấy ID chương")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. Tạo unit trước
      const unitData: CreateUnitRequest = {
        id: formData.id.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: "DRAFT",
        chapterId,
        prerequisiteUnitId: formData.prerequisiteUnitId.trim() || undefined,
        exams: []
      }

      const unitResponse = await StaffUnitService.createUnit(unitData)
      
      if (unitResponse.success && unitResponse.data) {
        // 2. Tạo materials cho unit vừa tạo
        const materialPromises = materials.map(material => {
          const materialData: CreateMaterialRequest = {
            description: material.description.trim(),
            fileUrl: material.fileUrl.trim(),
            type: material.type as MaterialType,
            unitId: unitResponse.data.id
          }
          return MaterialService.createMaterial(materialData)
        })

        await Promise.all(materialPromises)
        
        // Navigate back to chapter detail with success message and force refresh
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
      } else {
        setError(unitResponse.message || 'Tạo bài học thất bại')
      }
    } catch (error) {
      console.error('Error creating unit:', error)
      setError('Có lỗi xảy ra khi tạo bài học. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
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
                        <Label htmlFor="unitId" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                          Mã bài học <span className="text-red-500">*</span>
                          <div className="bg-blue-100 p-1 rounded-full">
                            <Hash className="h-3 w-3 text-blue-600" />
                          </div>
                        </Label>
                        <Input
                          id="unitId"
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
                        Tài liệu học tập
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
                    <div className="space-y-4">
                      {materials.map((material, index) => (
                        <div
                          key={material.id}
                          className="border border-purple-200 rounded-xl bg-gradient-to-r from-white to-purple-50/30"
                        >
                          {/* Material Header */}
                          <button
                            type="button"
                            onClick={() => toggleMaterial(material.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-purple-900">
                                  Tài liệu {index + 1}
                                  {material.type && ` - ${materialTypes.find(t => t.value === material.type)?.label}`}
                                </h3>
                                {material.description && (
                                  <p className="text-sm text-purple-600 mt-1 line-clamp-1">
                                    {material.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {materials.length > 1 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeMaterial(material.id)
                                  }}
                                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              {material.expanded ? (
                                <ChevronDown className="h-5 w-5 text-purple-400" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-purple-400" />
                              )}
                            </div>
                          </button>

                          {/* Material Content */}
                          {material.expanded && (
                            <div className="border-t border-purple-200 bg-purple-50/30 p-6 space-y-4">
                              {/* Material Type */}
                              <div className="space-y-2">
                                <Label className="text-purple-800 font-medium">
                                  Loại tài liệu <span className="text-red-500">*</span>
                                </Label>
                                <select
                                  value={material.type}
                                  onChange={(e) => handleMaterialChange(material.id, "type", e.target.value)}
                                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                  required
                                >
                                  <option value="">Chọn loại tài liệu</option>
                                  {materialTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Material Description */}
                              <div className="space-y-2">
                                <Label className="text-purple-800 font-medium">
                                  Mô tả tài liệu <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  value={material.description}
                                  onChange={(e) => handleMaterialChange(material.id, "description", e.target.value)}
                                  placeholder="Ví dụ: Bảng Hiragana cơ bản"
                                  className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                  required
                                />
                              </div>

                              {/* Material URL */}
                              <div className="space-y-2">
                                <Label className="text-purple-800 font-medium">
                                  URL tài liệu <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  value={material.fileUrl}
                                  onChange={(e) => handleMaterialChange(material.id, "fileUrl", e.target.value)}
                                  placeholder="https://example.com/material.pdf hoặc /docs/material.pdf"
                                  className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                  required
                                />
                                <p className="text-purple-600 text-xs">
                                  Nhập URL đầy đủ hoặc đường dẫn tương đối đến tài liệu
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
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
