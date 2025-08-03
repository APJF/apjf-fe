import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { AlertCircle, ArrowLeft, BookOpen, Hash, Info, FileText, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { StaffNavigation } from '../components/layout/StaffNavigation'
import { StaffUnitService } from '../services/staffUnitService'
import { MaterialService, type Material, type MaterialType } from '../services/materialService'
import type { StaffCourseDetail, ChapterDetail, UnitDetail } from '../types/staffCourse'

interface LocationState {
  unit?: UnitDetail
  chapter?: ChapterDetail
  course?: StaffCourseDetail
}

interface UpdateUnitFormData {
  id: string
  title: string
  description: string
  prerequisiteUnitId: string
}

interface MaterialFormData extends Material {
  expanded: boolean
  isNew?: boolean
  isUpdated?: boolean
  isDeleted?: boolean
  originalData?: Material
}

const StaffUpdateUnitPage: React.FC = () => {
  const navigate = useNavigate()
  const { courseId, chapterId, unitId } = useParams<{ 
    courseId: string
    chapterId: string
    unitId: string
  }>()
  const location = useLocation()
  const locationState = location.state as LocationState || {}

  const [course] = useState<StaffCourseDetail | null>(locationState.course || null)
  const [chapter] = useState<ChapterDetail | null>(locationState.chapter || null)
  const [unit, setUnit] = useState<UnitDetail | null>(locationState.unit || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<UpdateUnitFormData>({
    id: '',
    title: '',
    description: '',
    prerequisiteUnitId: ''
  })

  const [materials, setMaterials] = useState<MaterialFormData[]>([])

  const materialTypes = [
    { value: 'KANJI', label: 'Kanji' },
    { value: 'GRAMMAR', label: 'Ngữ pháp' },
    { value: 'VOCAB', label: 'Từ vựng' },
    { value: 'LISTENING', label: 'Nghe' },
    { value: 'READING', label: 'Đọc' },
    { value: 'WRITING', label: 'Viết' }
  ]

  useEffect(() => {
    if (!courseId || !chapterId || !unitId) {
      setError("ID khóa học, chương hoặc bài học không hợp lệ")
      return
    }

    if (!unit || !chapter || !course) {
      fetchData()
    } else {
      initializeFormData(unit)
      fetchMaterials()
    }
  }, [courseId, chapterId, unitId, unit, chapter, course])

  const fetchData = async () => {
    if (!courseId || !chapterId || !unitId) return

    setIsLoading(true)
    setError(null)

    try {
      const unitResponse = await StaffUnitService.getUnitDetail(unitId)
      
      if (unitResponse.success && unitResponse.data) {
        // Convert service type to component type
        const convertedUnit: UnitDetail = {
          ...unitResponse.data,
          chapterId: unitResponse.data.chapterId || chapterId || '',
          description: unitResponse.data.description || '',
          exams: []
        }
        setUnit(convertedUnit)
        initializeFormData(convertedUnit)
        await fetchMaterials()
      } else {
        setError("Không tìm thấy thông tin bài học")
      }
    } catch (error) {
      console.error('Error fetching unit data:', error)
      setError("Không thể tải thông tin bài học. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMaterials = async () => {
    if (!unitId) return

    try {
      const response = await MaterialService.getMaterialsByUnit(unitId)
      if (response.success && response.data) {
        setMaterials(response.data.map((material: Material) => ({
          ...material,
          expanded: false,
          originalData: { ...material }
        })))
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const initializeFormData = (unitData: UnitDetail) => {
    setFormData({
      id: unitData.id || '',
      title: unitData.title || '',
      description: unitData.description || '',
      prerequisiteUnitId: unitData.prerequisiteUnitId || ''
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMaterialChange = (materialId: string, field: keyof Material, value: string) => {
    if (!materialId) return;
    
    setMaterials(prev =>
      prev.map(material => {
        if (material.id === materialId) {
          const updatedMaterial = { ...material, [field]: value }
          // Mark as updated if different from original
          if (material.originalData && JSON.stringify(updatedMaterial) !== JSON.stringify({...material.originalData, expanded: material.expanded, originalData: material.originalData})) {
            updatedMaterial.isUpdated = true
          }
          return updatedMaterial
        }
        return material
      })
    )
  }

  const addMaterial = () => {
    const newMaterial: MaterialFormData = {
      id: `new_${Date.now()}`,
      description: '',
      fileUrl: '',
      type: 'GRAMMAR' as MaterialType,
      expanded: true,
      isNew: true
    }
    setMaterials(prev => [...prev, newMaterial])
  }

  const removeMaterial = (materialId: string) => {
    if (!materialId) return;
    
    console.log('Removing material:', materialId)
    setMaterials(prev => {
      const updated = prev.map(material => {
        if (material.id === materialId) {
          if (material.isNew) {
            // Nếu là material mới chưa save, xóa hoàn toàn
            console.log('Removing new material completely:', materialId)
            return null
          } else {
            // Nếu là material đã có trong DB, đánh dấu để xóa
            console.log('Marking existing material for deletion:', materialId, {
              hasOriginalData: !!material.originalData,
              originalId: material.originalData?.id
            })
            return { ...material, isDeleted: true, expanded: false }
          }
        }
        return material
      }).filter(Boolean) as MaterialFormData[]
      
      console.log('Updated materials after removal:', updated.map(m => ({
        id: m.id,
        isNew: m.isNew,
        isDeleted: m.isDeleted,
        hasOriginalData: !!m.originalData
      })))
      
      return updated
    })
  }

  const toggleMaterial = (materialId: string) => {
    if (!materialId) return;
    
    setMaterials(prev =>
      prev.map(material =>
        material.id === materialId 
          ? { ...material, expanded: !material.expanded }
          : material
      )
    )
  }

  const handleBack = () => {
    if (course && chapter && unit) {
      navigate(`/staff/courses/${course.id}/chapters/${chapter.id}/units/${unit.id}`, {
        state: { course, chapter, unit }
      })
    } else {
      navigate('/staff/courses')
    }
  }

  const isFormValid = useMemo(() => {
    const hasValidBasicInfo = formData.title.trim() && formData.description.trim();
    const hasValidMaterials = materials
      .filter(m => !m.isDeleted)
      .every(m => m.type && m.description.trim() && m.fileUrl.trim());
    
    return hasValidBasicInfo && hasValidMaterials;
  }, [formData.title, formData.description, materials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (!unitId || !chapterId) {
      setError("ID bài học hoặc chương không hợp lệ")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. Cập nhật unit
      const status: "ACTIVE" | "INACTIVE" = unit?.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
      const unitData = {
        id: unit?.id || formData.id.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        status,
        chapterId: chapter?.id || chapterId,
        prerequisiteUnitId: unit?.prerequisiteUnitId || '',
        examIds: unit?.exams?.map(exam => exam.id) || []
      }

      const unitResponse = await StaffUnitService.updateUnit(unitId, unitData)
      
      if (unitResponse.success && unitResponse.data) {
        // 2. Xử lý materials
        const materialPromises: Promise<any>[] = []
        
        console.log('Materials to process:', materials.map(m => ({
          id: m.id,
          isNew: m.isNew,
          isUpdated: m.isUpdated,
          isDeleted: m.isDeleted,
          hasOriginalData: !!m.originalData
        })))
        
        materials.forEach(material => {
          if (material.isDeleted && material.originalData && material.id && !material.id.startsWith('new_')) {
            // Xóa material đã có trong DB
            console.log('Deleting material:', material.id)
            materialPromises.push(
              MaterialService.deleteMaterial(material.id)
            )
          } else if (material.isNew && !material.isDeleted) {
            // Tạo material mới (chỉ khi không bị xóa)
            materialPromises.push(
              MaterialService.createMaterial({
                id: `${unitId}_${Date.now()}`,
                description: material.description.trim(),
                fileUrl: material.fileUrl.trim(),
                type: material.type
              })
            )
          } else if (material.isUpdated && material.originalData && !material.isDeleted && material.id) {
            // Cập nhật material đã có (chỉ khi không bị xóa)
            materialPromises.push(
              MaterialService.updateMaterial(material.id, {
                id: material.id,
                description: material.description.trim(),
                fileUrl: material.fileUrl.trim(),
                type: material.type
              })
            )
          }
        })

        await Promise.all(materialPromises)
        
        console.log('All material operations completed successfully')

        // Wait a moment for backend processing
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Navigate back to unit detail with success message
        navigate(`/staff/courses/${courseId}/chapters/${chapterId}/units/${unitId}`, {
          replace: true,
          state: { 
            course,
            chapter,
            unit: unitResponse.data,
            message: 'Cập nhật bài học thành công!',
            refreshData: true,
            timestamp: Date.now()
          }
        })
      } else {
        setError(unitResponse.message || 'Cập nhật bài học thất bại')
      }
    } catch (error) {
      console.error('Error updating unit:', error)
      setError('Có lỗi xảy ra khi cập nhật bài học. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !unit) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-blue-600 animate-pulse mb-4" />
            <p className="text-xl text-blue-600 font-medium">Đang tải thông tin bài học...</p>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  if (error && !unit) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <h3 className="font-semibold">Lỗi tải dữ liệu</h3>
              <p className="text-sm mt-1">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={fetchData} size="sm">
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

  if (!unit) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">Không tìm thấy thông tin bài học</p>
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
                <h1 className="text-2xl font-bold text-blue-900 mb-1">Chỉnh sửa bài học</h1>
                <p className="text-blue-600 text-sm font-medium">Cập nhật thông tin bài học</p>
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
            {/* Left Sidebar - Unit Info */}
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

                  {/* Course & Chapter Info */}
                  {course && (
                    <div className="space-y-4 mb-8">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-blue-600 font-medium text-xs">KHÓA HỌC</span>
                          <Badge className="bg-blue-600 text-white text-xs">{course.level}</Badge>
                        </div>
                        <h3 className="text-blue-900 font-bold text-sm leading-tight">{course.title}</h3>
                      </div>
                    </div>
                  )}

                  {chapter && (
                    <div className="space-y-4 mb-8">
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-purple-600 font-medium text-xs">CHƯƠNG</span>
                          <Badge className="bg-purple-600 text-white font-mono text-xs">{chapter.id}</Badge>
                        </div>
                        <h3 className="text-purple-900 font-bold text-sm leading-tight">{chapter.title}</h3>
                      </div>
                    </div>
                  )}

                  {/* Unit Details */}
                  <div className="space-y-4 mb-8">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-green-600 font-medium text-xs">MÃ BÀI HỌC</span>
                        <Badge className="bg-green-600 text-white font-mono text-xs">{unit.id}</Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-green-600 font-medium text-xs mb-1">TÊN BÀI HỌC</div>
                      <h3 className="text-green-900 font-bold text-sm leading-tight">{unit.title}</h3>
                    </div>
                  </div>

                  {/* Info Note */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                        <Info className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-amber-800 text-sm font-medium mb-1">Lưu ý khi chỉnh sửa</p>
                        <ul className="text-amber-700 text-xs leading-relaxed list-disc ml-4 space-y-1">
                          <li>Mã bài học (ID) không thể thay đổi sau khi tạo</li>
                          <li>Không thể thay đổi bài học tiên quyết để đảm bảo tính nhất quán</li>
                          <li>Thay đổi sẽ được lưu với trạng thái hiện tại</li>
                          <li>Có thể thêm mới hoặc chỉnh sửa tài liệu học</li>
                        </ul>
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
                  <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <BookOpen className="h-6 w-6" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Unit ID - Read only */}
                      <div className="space-y-3">
                        <Label htmlFor="unitId" className="text-green-800 font-semibold text-base flex items-center gap-2">
                          Mã bài học
                          <div className="bg-green-100 p-1 rounded-full">
                            <Hash className="h-3 w-3 text-green-600" />
                          </div>
                        </Label>
                        <Input
                          id="unitId"
                          value={formData.id}
                          className="border-green-300 bg-gray-100 text-gray-600 cursor-not-allowed text-base py-3"
                          readOnly
                        />
                        <p className="text-amber-600 text-xs mt-1">
                          ⚠️ Mã bài học không thể thay đổi sau khi tạo
                        </p>
                      </div>

                      {/* Prerequisite Unit - Read only */}
                      <div className="space-y-3">
                        <Label htmlFor="prerequisite" className="text-green-800 font-semibold text-base">
                          Bài học tiên quyết
                        </Label>
                        <Input
                          id="prerequisite"
                          value={formData.prerequisiteUnitId || "Không có"}
                          className="border-green-300 bg-gray-100 text-gray-600 cursor-not-allowed text-base py-3"
                          readOnly
                        />
                        <p className="text-amber-600 text-xs mt-1">
                          ⚠️ Không thể thay đổi bài học tiên quyết
                        </p>
                      </div>
                    </div>

                    {/* Unit Title */}
                    <div className="space-y-3 mt-6">
                      <Label htmlFor="title" className="text-green-800 font-semibold text-base flex items-center gap-2">
                        Tiêu đề bài học <span className="text-red-500">*</span>
                        <div className="bg-green-100 p-1 rounded-full">
                          <BookOpen className="h-3 w-3 text-green-600" />
                        </div>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Ví dụ: Ngữ pháp về Hiragana"
                        className="border-green-300 focus:border-green-500 focus:ring-green-500 text-base py-3 bg-white/80 backdrop-blur-sm"
                        required
                      />
                    </div>

                    {/* Unit Description */}
                    <div className="space-y-3 mt-6">
                      <Label htmlFor="description" className="text-green-800 font-semibold text-base flex items-center gap-2">
                        Mô tả bài học <span className="text-red-500">*</span>
                        <div className="bg-green-100 p-1 rounded-full">
                          <Info className="h-3 w-3 text-green-600" />
                        </div>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Mô tả chi tiết về nội dung bài học..."
                        rows={4}
                        className="border-green-300 focus:border-green-500 focus:ring-green-500 resize-none text-base bg-white/80 backdrop-blur-sm"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Materials */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Tài liệu học tập ({materials.filter(m => !m.isDeleted).length})
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={addMaterial}
                        className="text-white hover:bg-white/20 border border-white/30"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Thêm tài liệu
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      {materials.filter(m => !m.isDeleted).map((material, index) => (
                        <div
                          key={material.id}
                          className="border border-purple-200 rounded-xl bg-gradient-to-r from-white to-purple-50/30"
                        >
                          {/* Material Header */}
                          <div className="flex items-center justify-between p-4">
                            {/* Left side - clickable area for toggle */}
                              <button
                                type="button"
                                onClick={() => material.id && toggleMaterial(material.id)}
                                className="flex items-center gap-3 flex-1 text-left hover:bg-purple-50/50 transition-colors rounded-lg p-2 -m-2"
                                aria-expanded={material.expanded}
                                aria-controls={`material-content-${material.id}`}
                                aria-label={`Toggle material ${index + 1} details`}
                              >
                              {(() => {
                                let badgeClass = 'bg-gradient-to-br from-purple-600 to-pink-600'
                                if (material.isNew) {
                                  badgeClass = 'bg-gradient-to-br from-green-600 to-teal-600'
                                } else if (material.isUpdated) {
                                  badgeClass = 'bg-gradient-to-br from-orange-600 to-red-600'
                                }
                                
                                return (
                                  <div className={`text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${badgeClass}`}>
                                    {index + 1}
                                  </div>
                                )
                              })()}
                              <div className="text-left">
                                <h3 className="font-semibold text-purple-900">
                                  Tài liệu {index + 1}
                                  {material.type && ` - ${materialTypes.find(t => t.value === material.type)?.label}`}
                                  {material.isNew && <span className="text-green-600 text-xs ml-2">(Mới)</span>}
                                  {material.isUpdated && <span className="text-orange-600 text-xs ml-2">(Đã sửa)</span>}
                                </h3>
                                {material.description && (
                                  <p className="text-sm text-purple-600 mt-1 line-clamp-1">
                                    {material.description}
                                  </p>
                                )}
                              </div>
                            </button>
                            
                            {/* Right side - action buttons */}
                            <div className="flex items-center gap-2 ml-4">
                              {materials.length > 1 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (material.id) {
                                        removeMaterial(material.id)
                                      }
                                    }}
                                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                    aria-label={`Remove material ${index + 1}`}
                                  >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                                <button
                                  type="button"
                                  onClick={() => material.id && toggleMaterial(material.id)}
                                  className="p-1 rounded hover:bg-purple-100 transition-colors"
                                  aria-expanded={material.expanded}
                                  aria-label={`${material.expanded ? 'Collapse' : 'Expand'} material ${index + 1}`}
                                >
                                {material.expanded ? (
                                  <ChevronDown className="h-5 w-5 text-purple-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-purple-400" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Material Content */}
                          {material.expanded && (
                            <section 
                              className="border-t border-purple-200 bg-purple-50/30 p-6 space-y-4"
                              id={`material-content-${material.id}`}
                              aria-labelledby={`material-header-${material.id}`}
                            >
                              {/* Material Type */}
                              <div className="space-y-2">
                                <Label className="text-purple-800 font-medium">
                                  Loại tài liệu <span className="text-red-500">*</span>
                                </Label>
                                <select
                                  value={material.type}
                                  onChange={(e) => material.id && handleMaterialChange(material.id, "type", e.target.value)}
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
                                  onChange={(e) => material.id && handleMaterialChange(material.id, "description", e.target.value)}
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
                                  onChange={(e) => material.id && handleMaterialChange(material.id, "fileUrl", e.target.value)}
                                  placeholder="https://example.com/material.pdf hoặc /docs/material.pdf"
                                  className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                  required
                                />
                                <p className="text-purple-600 text-xs">
                                  Nhập URL đầy đủ hoặc đường dẫn tương đối đến tài liệu
                                </p>
                              </div>
                            </section>
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
                    className="px-8 py-3 border-green-300 text-green-600 hover:bg-green-50 bg-transparent font-medium"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isFormValid || isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

export default StaffUpdateUnitPage
