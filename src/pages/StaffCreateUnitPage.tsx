import React, { useState, useEffect } from 'react'
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
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { CourseService } from '../services/courseService'
import { type Unit as StaffUnit } from '../services/staffUnitService'
import { MaterialService, type MaterialType } from '../services/materialService'
import type { CreateUnitRequest, Chapter, Course } from '../types/course'
import { useToast } from '../hooks/useToast'
import api from '../api/axios'

interface LocationState {
  course?: Course
  chapter?: Chapter
}

// Enhanced material interface based on user example
interface MaterialFormData {
  id: number
  materialId: string // ID cho material khi tạo
  skillType: string // Phân loại kỹ năng (Nghe, Nói, Đọc, Viết, Ngữ pháp, Từ vựng)
  title: string
  description: string
  script: string // Script cho LISTENING
  translation: string // Translation cho LISTENING
  selectedFile: File | null // File được chọn để upload
  isExpanded: boolean
}

// Mapping từ skill type sang MaterialType enum
const SKILL_TYPE_TO_MATERIAL_TYPE: Record<string, MaterialType> = {
  'Nghe': 'LISTENING',
  'Kanji': 'KANJI',
  'Đọc': 'READING',
  'Viết': 'WRITING',
  'Ngữ pháp': 'GRAMMAR',
  'Từ vựng': 'VOCAB'
}

const SKILL_TYPES = [
  'Nghe',
  'Kanji', 
  'Đọc',
  'Viết',
  'Ngữ pháp',
  'Từ vựng'
]

const StaffCreateUnitPage: React.FC = () => {
  const navigate = useNavigate()
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const location = useLocation()
  const locationState = location.state as LocationState || {}
  const { showToast } = useToast()

  const [course, setCourse] = useState<Course | null>(locationState.course || null)
  const [chapter, setChapter] = useState<Chapter | null>(locationState.chapter || null)
  const [units, setUnits] = useState<StaffUnit[]>([]) // For prerequisite selection
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
      materialId: '',
      skillType: '',
      title: '',
      description: '',
      script: '',
      translation: '',
      selectedFile: null,
      isExpanded: true
    }
  ])

  // Add material function with correct interface
  const addMaterial = () => {
    const newId = Math.max(...materials.map(m => m.id)) + 1
    setMaterials(prev => [
      ...prev,
      {
        id: newId,
        materialId: '',
        skillType: '',
        title: '',
        description: '',
        script: '',
        translation: '',
        selectedFile: null,
        isExpanded: true
      }
    ])
  }

  // Remove material function
  const removeMaterial = (id: number) => {
    if (materials.length > 1) {
      setMaterials(prev => prev.filter(m => m.id !== id))
    }
  }

  // Update material function
  const updateMaterial = (id: number, field: keyof MaterialFormData, value: string | boolean | File | null) => {
    setMaterials(prev => prev.map(material => 
      material.id === id 
        ? { ...material, [field]: value }
        : material
    ))
  }

  // Handle file selection for material
  const handleMaterialFileSelect = (materialId: number, file: File | null) => {
    if (file) {
      // Kiểm tra kích thước file (800KB = 800 * 1024 bytes)
      const maxSize = 800 * 1024
      if (file.size > maxSize) {
        showToast('error', `File "${file.name}" có kích thước ${(file.size / 1024).toFixed(1)}KB. Vui lòng chọn file dưới 800KB.`)
        return
      }
    }
    updateMaterial(materialId, 'selectedFile', file)
  }

  // Upload material file function
  const uploadMaterialFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/materials/upload', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'multipart/form-data',
        }
      })

      if (response.data.success && response.data.data) {
        return response.data.data // Trả về filename: "phan phuong_doc_9a38d5bc-28f4-495b-951f-28751bc34a4c.pdf"
      } else {
        throw new Error(response.data.message || 'Upload file thất bại')
      }
    } catch (error) {
      console.error('Error uploading material file:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          const errorMessage = axiosError.response.data.message
          // Kiểm tra xem có phải lỗi kích thước file không
          if (errorMessage.includes('size') || errorMessage.includes('large') || errorMessage.includes('KB') || errorMessage.includes('MB')) {
            throw new Error(`File quá lớn. Vui lòng chọn file dưới 800KB.`)
          }
          throw new Error(errorMessage)
        }
      }
      throw new Error('Upload file thất bại')
    }
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

  // Fetch units for prerequisite selection when chapter is available
  useEffect(() => {
    const fetchUnits = async () => {
      if (!chapter || !chapterId) return

      try {
        // Sử dụng API trực tiếp thay vì service
        const response = await api.get(`/chapters/${chapterId}/units`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        })
        setUnits(response.data.data || [])
      } catch (error) {
        console.error('Error fetching units:', error)
        setUnits([])
      }
    }

    fetchUnits()
  }, [chapter, chapterId])

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

  const createUnitData = (): CreateUnitRequest & { id: string } => {
    return {
      id: formData.id.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: "INACTIVE",
      chapterId: chapterId!,
      prerequisiteUnitId: formData.prerequisiteUnitId.trim() || null,
      examIds: [] // thêm examIds mặc định
    }
  }

  const handleSubmitSuccess = () => {
    const materialCount = materials.filter(m => 
      m.title.trim() && 
      m.skillType && 
      m.selectedFile
    ).length
    
    const successMessage = materialCount > 0 
      ? `Tạo bài học và ${materialCount} tài liệu thành công!`
      : 'Tạo bài học thành công!'
      
    showToast('success', successMessage)
    
    navigate(`/staff/courses/${courseId}/chapters/${chapterId}`, {
      replace: true,
      state: { 
        course,
        chapter,
        message: successMessage,
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

  // Helper function để tạo materials
  const createMaterialsForUnit = async (unitId: string) => {
    const validMaterials = materials.filter(material => 
      material.title.trim() && 
      material.skillType && 
      material.selectedFile
    )

    console.log(`� Found ${validMaterials.length} valid materials to process`)

    for (let i = 0; i < validMaterials.length; i++) {
      const material = validMaterials[i]
      showToast("warning", `Đang xử lý tài liệu ${i + 1}/${validMaterials.length}: ${material.title}`)

      let finalFileUrl = ''

      // Upload file
      if (!material.selectedFile) {
        throw new Error(`Chưa chọn file cho tài liệu "${material.title}"`)
      }

      try {
        console.log(`📤 Uploading file for material: ${material.title}`)
        finalFileUrl = await uploadMaterialFile(material.selectedFile)
        console.log(`✅ File uploaded successfully: ${finalFileUrl}`)
      } catch (uploadError) {
        console.error(`❌ File upload failed for ${material.title}:`, uploadError)
        throw new Error(`Lỗi upload file cho tài liệu "${material.title}": ${uploadError}`)
      }

      // Create material
      try {
        const materialType = SKILL_TYPE_TO_MATERIAL_TYPE[material.skillType] || 'VOCAB' as MaterialType
        const materialData = {
          id: `material_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          fileUrl: finalFileUrl,
          type: materialType,
          script: material.script || '',
          translation: material.translation || '',
          unitId: unitId
        }

        console.log(`� Creating material:`, materialData)
        await MaterialService.createMaterial(materialData)
        console.log(`✅ Material created successfully: ${material.title}`)
      } catch (createError) {
        console.error(`❌ Material creation failed for ${material.title}:`, createError)
        throw new Error(`Lỗi tạo tài liệu "${material.title}": ${createError}`)
      }
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

      console.log('📤 Starting unit creation process with materials...')

      // BƯỚC 2: Tạo Unit trước tiên
      showToast("warning", "Đang tạo bài học...")
      console.log('📤 Creating unit first:', {
        ...unitData,
        prerequisiteNote: unitData.prerequisiteUnitId ? 'Has prerequisite' : 'No prerequisite (null)'
      })

      const unitResult = await CourseService.createUnit(unitData)
      console.log('✅ Unit created successfully:', unitResult)

      // Đợi một chút để đảm bảo unit đã được lưu vào database
      await new Promise(resolve => setTimeout(resolve, 1000))

      // BƯỚC 3: Sau khi unit được tạo, xử lý materials
      await createMaterialsForUnit(unitData.id)

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
                          src={course.image}
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
                        <span className="text-green-700 font-medium text-xs">TRÌNH ĐỘ</span>
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
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-visible">
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
                    <div className="space-y-3 mt-6 relative z-50">
                      <Label htmlFor="prerequisiteUnit" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Bài học tiên quyết (tùy chọn)
                        <div className="bg-blue-100 p-1 rounded-full">
                          <Hash className="h-3 w-3 text-blue-600" />
                        </div>
                      </Label>
                      <SearchableSelect
                        value={formData.prerequisiteUnitId}
                        onChange={(value: string) => handleInputChange("prerequisiteUnitId", value)}
                        placeholder="Chọn bài học tiên quyết..."
                        emptyText="Không tìm thấy bài học nào"
                        options={units.map(unit => ({
                          id: unit.id,
                          title: unit.title,
                          subtitle: unit.description || undefined
                        }))}
                        className="w-full bg-white"
                      />
                      <p className="text-blue-600 text-xs">
                        Chọn bài học mà học viên cần hoàn thành trước khi học bài này. Để trống nếu là bài học đầu tiên.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Materials */}
                <Card className="shadow-xl border-0 bg-white/90">
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
                    <div className="space-y-6">
                      {materials.map((material, index) => (
                        <div key={material.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Material Header */}
                          <button 
                            type="button"
                            className="w-full bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors text-left"
                            onClick={() => updateMaterial(material.id, 'isExpanded', !material.isExpanded)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {material.isExpanded ? (
                                  <ChevronDown className="h-5 w-5 text-gray-600" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-600" />
                                )}
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    Tài liệu {index + 1}
                                    {material.title && `: ${material.title}`}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {material.skillType 
                                      ? material.skillType
                                      : 'Chưa được cấu hình'
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {materials.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      removeMaterial(material.id)
                                    }}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Material Content - Collapsible */}
                          {material.isExpanded && (
                            <div className="p-6 space-y-4">
                              {/* Material ID and Title */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`materialId-${material.id}`} className="text-sm font-medium text-gray-700">
                                    Mã tài liệu
                                  </Label>
                                  <Input
                                    id={`materialId-${material.id}`}
                                    value={material.materialId}
                                    onChange={(e) => updateMaterial(material.id, 'materialId', e.target.value)}
                                    placeholder="Ví dụ: material-01"
                                    className="mt-1"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Để trống để tự động tạo mã
                                  </p>
                                </div>

                                <div>
                                  <Label htmlFor={`title-${material.id}`} className="text-sm font-medium text-gray-700">
                                    Tiêu đề tài liệu <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id={`title-${material.id}`}
                                    value={material.title}
                                    onChange={(e) => updateMaterial(material.id, 'title', e.target.value)}
                                    placeholder="Nhập tiêu đề tài liệu"
                                    className="mt-1"
                                  />
                                </div>
                              </div>

                              {/* Skill Type */}
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <Label htmlFor={`skillType-${material.id}`} className="text-sm font-medium text-gray-700">
                                    Phân loại kỹ năng <span className="text-red-500">*</span>
                                  </Label>
                                  <select
                                    id={`skillType-${material.id}`}
                                    value={material.skillType}
                                    onChange={(e) => updateMaterial(material.id, 'skillType', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-2 border-purple-200 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 hover:border-purple-300 transition-colors duration-200"
                                  >
                                    <option value="" className="text-gray-500">Chọn kỹ năng</option>
                                    {SKILL_TYPES.map(type => (
                                      <option key={type} value={type} className="text-gray-900">{type}</option>
                                    ))}
                                  </select>
                                </div>

                              </div>

                              {/* File Upload */}
                              <div>
                                <Label className="text-sm font-medium text-gray-700">
                                  Tài liệu <span className="text-red-500">*</span>
                                  <span className="text-xs text-gray-500 font-normal ml-2">(Tối đa 800KB)</span>
                                </Label>
                                <div className="mt-1">
                                  {/* File Upload */}
                                  <div className="min-h-[80px] relative">
                                    <Input
                                      type="file"
                                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.mp4,.jpg,.jpeg,.png"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0] || null
                                        handleMaterialFileSelect(material.id, file)
                                      }}
                                      className="block w-full h-16 text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer cursor-pointer border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg"
                                    />
                                    {/* Clear file button */}
                                    {material.selectedFile && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMaterialFileSelect(material.id, null)}
                                        className="absolute top-2 right-2 p-1 h-6 w-6 rounded-full bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  <p className="text-xs text-gray-500 mt-2">
                                    {material.selectedFile 
                                      ? `File đã chọn: ${material.selectedFile.name} (${(material.selectedFile.size / 1024).toFixed(1)}KB)`
                                      : 'Chọn file dưới 800KB để tải lên (PDF, DOC, XLS, PPT, MP3, MP4, JPG, PNG)'
                                    }
                                  </p>
                                </div>
                              </div>

                              {/* Description */}
                              <div>
                                <Label htmlFor={`description-${material.id}`} className="text-sm font-medium text-gray-700">
                                  Mô tả tài liệu
                                </Label>
                                <Textarea
                                  id={`description-${material.id}`}
                                  value={material.description}
                                  onChange={(e) => updateMaterial(material.id, 'description', e.target.value)}
                                  placeholder="Mô tả ngắn gọn về tài liệu này"
                                  rows={3}
                                  className="mt-1 resize-none border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                                />
                              </div>

                              {/* Script & Translation cho Nghe */}
                              {material.skillType === 'Nghe' && (
                                <>
                                  <div>
                                    <Label htmlFor={`script-${material.id}`} className="text-sm font-medium text-gray-700">
                                      Văn bản kịch bản
                                    </Label>
                                    <Textarea
                                      id={`script-${material.id}`}
                                      value={material.script || ''}
                                      onChange={(e) => updateMaterial(material.id, 'script', e.target.value)}
                                      placeholder="Nhập kịch bản cho tài liệu nghe..."
                                      rows={3}
                                      className="mt-1 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor={`translation-${material.id}`} className="text-sm font-medium text-gray-700">
                                      Bản dịch
                                    </Label>
                                    <Textarea
                                      id={`translation-${material.id}`}
                                      value={material.translation || ''}
                                      onChange={(e) => updateMaterial(material.id, 'translation', e.target.value)}
                                      placeholder="Nhập bản dịch cho tài liệu nghe..."
                                      rows={3}
                                      className="mt-1 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                                    />
                                  </div>
                                </>
                              )}
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
                    {isLoading ? 'Đang tạo bài học và tài liệu...' : 'Tạo bài học'}
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
