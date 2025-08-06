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
import { MaterialService } from '../services/materialService'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import type { Course } from '../types/course'
import type { Chapter } from '../types/chapter'
import type { Unit, UnitDetail } from '../types/unit'
import type { Material, MaterialType } from '../types/material'
import api from '../api/axios'
import { type AxiosResponse } from 'axios'

// Define detailed types based on base types for this page's context
// This avoids polluting global types if these are specific to the staff view
export interface ChapterDetail extends Chapter {
  // Currently same as Chapter, can be extended later
}

export interface StaffCourseDetail extends Course {
  // Currently same as Course, can be extended later
}

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
  selectedFile?: File | null
  title?: string // For display purposes, not part of the Material type
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
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
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
    
    // Fetch available units for prerequisite selection
    fetchAvailableUnits()
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

  const fetchAvailableUnits = async () => {
    if (!chapterId && !chapter?.id) return

    const currentChapterId = chapterId || chapter?.id
    if (!currentChapterId) return

    console.log('Fetching units for chapter:', currentChapterId)

    try {
      // Sử dụng API chính: /chapters/{chapterId}/units
      const response = await api.get<{ success: boolean; data: Unit[] }>(`/chapters/${currentChapterId}/units`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data.success && response.data.data) {
        const filtered = response.data.data.filter((u: Unit) => u.id !== unitId)
        setAvailableUnits(filtered)
        console.log('Successfully fetched units:', filtered.length)
        return
      }
    } catch (primaryError) {
      console.warn('Primary API /chapters/{chapterId}/units failed, trying fallback API...')
      
      // Thử API fallback cũ nếu API mới thất bại
      try {
        const fallbackResponse = await StaffUnitService.getAllUnitsByChapter(currentChapterId)
        if (fallbackResponse.success && fallbackResponse.data) {
          const filtered = fallbackResponse.data.filter(u => u.id !== unitId)
          setAvailableUnits(filtered)
          console.log('Fallback API succeeded, fetched units:', filtered.length)
          return
        }
      } catch (fallbackError) {
        console.error('Both APIs failed:', { primaryError, fallbackError })
      }
    }

    // Nếu cả hai API đều thất bại
    console.warn('No units found for chapter:', currentChapterId)
    setAvailableUnits([])
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
      description: '', // Add missing required property
      fileUrl: '',
      type: 'GRAMMAR' as MaterialType,
      script: '',
      translation: '',
      unitId: unitId || '',
      expanded: true,
      isNew: true,
      selectedFile: null
    }
    setMaterials(prev => [...prev, newMaterial])
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
        return response.data.data // Trả về filename
      } else {
        throw new Error(response.data.message || 'Upload file thất bại')
      }
    } catch (error) {
      console.error('Error uploading material file:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          const errorMessage = axiosError.response.data.message
          if (errorMessage.includes('size') || errorMessage.includes('large') || errorMessage.includes('KB') || errorMessage.includes('MB')) {
            throw new Error(`File quá lớn. Vui lòng chọn file dưới 800KB.`)
          }
          throw new Error(errorMessage)
        }
      }
      throw new Error('Upload file thất bại')
    }
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
    const hasValidBasicInfo = formData.title?.trim() && formData.description?.trim();
    const hasValidMaterials = materials
      .filter(m => !m.isDeleted)
      .every(m => m.type && (m.script?.trim() || m.translation?.trim()) && m.fileUrl?.trim());
    
    return hasValidBasicInfo && hasValidMaterials;
  }, [formData.title, formData.description, materials]);

  // Helper function để cập nhật unit
  const updateUnit = async () => {
    const status: "ACTIVE" | "INACTIVE" = unit?.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    const unitData = {
      id: unit?.id || formData.id.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      status,
      chapterId: chapter?.id || chapterId,
      prerequisiteUnitId: formData.prerequisiteUnitId.trim() || null
    }

    console.log('📤 Updating unit with data:', unitData)
    
    const unitResponse = await api.put(`/units/${unitId}`, unitData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!unitResponse.data.success) {
      throw new Error(unitResponse.data.message || 'Cập nhật bài học thất bại')
    }

    console.log('✅ Unit updated successfully')
    return unitResponse
  }

  // Helper function để xử lý material mới
  const processNewMaterial = async (material: MaterialFormData): Promise<AxiosResponse> => {
    console.log('🆕 Creating new material:', material.id)
    
    let finalFileUrl = ''
    
    if (material.selectedFile) {
      finalFileUrl = await uploadMaterialFile(material.selectedFile)
      console.log(`✅ File uploaded: ${finalFileUrl}`)
    } else if (material.fileUrl) {
      finalFileUrl = material.fileUrl
    } else {
      throw new Error('Chưa chọn file hoặc nhập URL cho tài liệu mới')
    }

    const createRequest = {
      id: `${unitId}_${Date.now()}`,
      fileUrl: finalFileUrl,
      type: material.type,
      description: material.description,
      script: material.script?.trim() || "",
      translation: material.translation?.trim() || "",
      unitId: unitId
    }

    return api.post('/materials', createRequest, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    })
  }

  // Helper function để xử lý material cập nhật
  const processUpdatedMaterial = async (material: MaterialFormData): Promise<AxiosResponse> => {
    console.log('🔄 Updating existing material:', material.id)
    
    let finalFileUrl = material.fileUrl || ''
    
    if (material.selectedFile) {
      finalFileUrl = await uploadMaterialFile(material.selectedFile)
      console.log(`✅ New file uploaded: ${finalFileUrl}`)
    }

    const updateRequest = {
      id: material.id,
      fileUrl: finalFileUrl,
      type: material.type,
      description: material.description,
      script: material.script?.trim() || "",
      translation: material.translation?.trim() || "",
      unitId: unitId
    }

    return api.put(`/materials/${material.id}`, updateRequest, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      }
    })
  }

  // Helper function để xử lý tất cả materials
  const processMaterials = async () => {
    const materialPromises: Promise<AxiosResponse>[] = []
    
    console.log('📋 Processing materials:', materials.map(m => ({
      id: m.id,
      isNew: m.isNew,
      isUpdated: m.isUpdated,
      isDeleted: m.isDeleted,
      hasFile: !!m.selectedFile
    })))
    
    for (const material of materials) {
      if (material.isDeleted) {
        console.log('⏭️ Skipping delete for material:', material.id)
        continue
      }

      if (material.isNew && !material.isDeleted) {
        materialPromises.push(processNewMaterial(material))
      } else if (material.isUpdated && material.originalData && !material.isDeleted && material.id) {
        materialPromises.push(processUpdatedMaterial(material))
      }
    }

    if (materialPromises.length > 0) {
      console.log(`⏳ Processing ${materialPromises.length} material operations...`)
      await Promise.all(materialPromises)
      console.log('✅ All material operations completed')
    }
  }

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
      const unitResponse = await updateUnit()

      // 2. Xử lý materials
      await processMaterials()

      // Đợi một chút để backend xử lý
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Navigate back với success message
      navigate(`/staff/courses/${courseId}/chapters/${chapterId}/units/${unitId}`, {
        replace: true,
        state: { 
          course,
          chapter,
          unit: unitResponse.data.data,
          message: 'Cập nhật bài học thành công!',
          refreshData: true,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.error('❌ Error updating unit:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data?: { message?: string } } }
        const errorMsg = axiosError.response?.data?.message || 'Lỗi không xác định'
        setError(`Lỗi cập nhật (${axiosError.response?.status}): ${errorMsg}`)
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật bài học'
        setError(errorMessage)
      }
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
                      <h2 className="text-xl font-bold text-blue-900">Thông tin</h2>
                    </div>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                  </div>

                  {/* Course Image */}
                  <div className="mb-6">
                    <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl border-2 border-blue-200 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                      {course?.image && !course.image.includes('undefined') ? (
                        <img 
                          src={course.image}
                          alt="Course" 
                          className="w-full h-full object-cover rounded-lg relative z-10"
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
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
                        <Badge className="bg-blue-600 text-white font-mono text-xs">{course?.id}</Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-blue-600 font-medium text-xs mb-1">TÊN KHÓA HỌC</div>
                      <h3 className="text-blue-900 font-bold text-sm leading-tight">{course?.title}</h3>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-green-700 font-medium text-xs">TRÌNH ĐỘ</span>
                        <Badge className="bg-green-600 text-white text-xs">{course?.level}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Chapter Info */}
                  <div className="border-t border-blue-100 pt-6 mb-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-purple-600" />
                        <span className="text-purple-600 font-medium text-xs">CHƯƠNG</span>
                      </div>
                      <Badge className="bg-purple-600 text-white text-xs mb-2">{chapter?.id}</Badge>
                    </div>

                    <div className="mb-4">
                      <div className="text-purple-600 font-medium text-xs mb-1">TÊN CHƯƠNG</div>
                      <h4 className="text-purple-900 font-bold text-sm leading-tight">{chapter?.title}</h4>
                    </div>
                  </div>

                  {/* Unit Info */}
                  <div className="border-t border-purple-100 pt-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-600 font-medium text-xs">BÀI HỌC</span>
                      </div>
                      <Badge className="bg-orange-600 text-white text-xs mb-2">{unit?.id}</Badge>
                    </div>

                    <div className="mb-4">
                      <div className="text-orange-600 font-medium text-xs mb-1">TÊN BÀI HỌC</div>
                      <h4 className="text-orange-900 font-bold text-sm leading-tight">{unit?.title}</h4>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-700 font-medium text-xs">SỐ TÀI LIỆU</span>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-amber-600" />
                          <span className="text-xl font-bold text-amber-800">{materials.filter(m => !m.isDeleted).length}</span>
                          <span className="text-amber-600 text-xs">tài liệu</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Note */}
                  <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200 mt-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-cyan-100 p-1 rounded-full mt-0.5">
                        <Info className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-cyan-800 text-sm font-medium mb-1">Chỉnh sửa bài học</p>
                        <p className="text-cyan-700 text-xs leading-relaxed">
                          Cập nhật thông tin và quản lý tài liệu học tập cho bài học này.
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

                      {/* Prerequisite Unit - SearchableSelect */}
                      <div className="space-y-3 relative z-50">
                        <Label htmlFor="prerequisite" className="text-green-800 font-semibold text-base">
                          Bài học tiên quyết
                        </Label>
                        {availableUnits.length > 0 ? (
                          <SearchableSelect
                            value={formData.prerequisiteUnitId}
                            onChange={(value) => handleInputChange("prerequisiteUnitId", value)}
                            options={availableUnits.map(unit => ({
                              id: unit.id,
                              title: unit.title,
                              subtitle: `Trạng thái: ${unit.status === 'ACTIVE' ? 'Đã kích hoạt' : 'Chưa kích hoạt'}`
                            }))}
                            placeholder="Chọn hoặc tìm kiếm bài học tiên quyết..."
                            emptyText="Không có bài học tiên quyết"
                            className="bg-white/80 backdrop-blur-sm"
                          />
                        ) : (
                          <Input
                            value={formData.prerequisiteUnitId}
                            onChange={(e) => handleInputChange("prerequisiteUnitId", e.target.value)}
                            placeholder="Nhập ID bài học tiên quyết (tùy chọn)"
                            className="bg-white/80 backdrop-blur-sm border-yellow-300 focus:border-yellow-500"
                          />
                        )}
                        <p className="text-green-600 text-xs mt-1">
                          💡 {availableUnits.length > 0 
                            ? "Chọn bài học mà học viên cần hoàn thành trước khi học bài này"
                            : "Nhập ID bài học tiên quyết nếu có (lỗi tải danh sách bài học)"
                          }
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
                              </div>
                            </button>
                            
                            {/* Right side - action buttons */}
                            <div className="flex items-center gap-2 ml-4">
                              {materials.length > 1 && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e: React.MouseEvent) => {
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

                              {/* Material Script and Translation */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-purple-800 font-medium">
                                    Script (Tiếng Nhật)
                                  </Label>
                                  <Input
                                    value={material.script || ''}
                                    onChange={(e) => material.id && handleMaterialChange(material.id, "script", e.target.value)}
                                    placeholder="Ví dụ: こんにちは"
                                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-purple-800 font-medium">
                                    Translation (Tiếng Việt)
                                  </Label>
                                  <Input
                                    value={material.translation || ''}
                                    onChange={(e) => material.id && handleMaterialChange(material.id, "translation", e.target.value)}
                                    placeholder="Ví dụ: Xin chào"
                                    className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                                  />
                                </div>
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
