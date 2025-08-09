import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { AlertCircle, ArrowLeft, BookOpen, Hash, Info, FileText, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { StaffNavigation } from '../../components/layout/StaffNavigation'
import { StaffUnitService } from '../../services/staffUnitService'
import { MaterialService } from '../../services/materialService'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import type { Course } from '../../types/course'
import type { Chapter } from '../../types/chapter'
import type { Unit, UnitDetail } from '../../types/unit'
import type { Material, MaterialType } from '../../types/material'
import api from '../../api/axios'
import { type AxiosResponse } from 'axios'

// Define detailed types based on base types for this page's context
export interface ChapterDetail extends Chapter {}

export interface StaffCourseDetail extends Course {}

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

interface MaterialFormData {
  id: string
  materialId?: string
  skillType: string
  script?: string
  translation?: string
  selectedFile?: File | null
  isExpanded: boolean
  isNew?: boolean
  isUpdated?: boolean
  isDeleted?: boolean
  originalData?: Material
  fileUrl?: string
  type?: MaterialType
}

// Mapping skill types to material types
const SKILL_TYPES = ['Nghe', 'Kanji', 'Đọc', 'Viết', 'Ngữ pháp', 'Từ vựng']

const SKILL_TYPE_TO_MATERIAL_TYPE: Record<string, MaterialType> = {
  'Nghe': 'LISTENING',
  'Kanji': 'KANJI', 
  'Đọc': 'READING',
  'Viết': 'WRITING',
  'Ngữ pháp': 'GRAMMAR',
  'Từ vựng': 'VOCAB'
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

  // State for delete confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    materialId: string
    materialTitle: string
  }>({
    isOpen: false,
    materialId: '',
    materialTitle: ''
  })

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
    
    fetchAvailableUnits()
  }, [courseId, chapterId, unitId, unit, chapter, course])

  const fetchData = async () => {
    if (!courseId || !chapterId || !unitId) return

    setIsLoading(true)
    setError(null)

    try {
      const unitResponse = await StaffUnitService.getUnitDetail(unitId)
      
      if (unitResponse.success && unitResponse.data) {
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
      console.log('🔍 Fetching materials for unit:', unitId)
      const response = await MaterialService.getMaterialsByUnit(unitId)
      if (response.success && response.data) {
        console.log('📋 Raw materials from API:', response.data)
        const mappedMaterials = response.data.map((material: Material) => ({
          id: `existing_${material.id}`,
          materialId: material.id,
          skillType: getSkillTypeFromMaterialType(material.type),
          script: material.script || '',
          translation: material.translation || '',
          selectedFile: null,
          isExpanded: false,
          isNew: false,
          isUpdated: false,
          isDeleted: false,
          originalData: { ...material },
          fileUrl: material.fileUrl,
          type: material.type
        }))
        console.log('📋 Mapped materials:', mappedMaterials.map(m => ({
          frontendId: m.id,
          materialId: m.materialId,
          skillType: m.skillType,
          isNew: m.isNew,
          hasOriginalData: !!m.originalData
        })))
        setMaterials(mappedMaterials)
        console.log('✅ Materials state updated')
      } else {
        console.warn('❌ No materials found or API failed:', response)
        setMaterials([])
      }
    } catch (error) {
      console.error('❌ Error fetching materials:', error)
      setMaterials([])
    }
  }

  const getSkillTypeFromMaterialType = (materialType: MaterialType): string => {
    const mapping: Record<MaterialType, string> = {
      'LISTENING': 'Nghe',
      'KANJI': 'Kanji',
      'READING': 'Đọc', 
      'WRITING': 'Viết',
      'GRAMMAR': 'Ngữ pháp',
      'VOCAB': 'Từ vựng'
    }
    return mapping[materialType] || 'Ngữ pháp'
  }

  const fetchAvailableUnits = async () => {
    if (!chapterId && !chapter?.id) return

    const currentChapterId = chapterId || chapter?.id
    if (!currentChapterId) return

    try {
      const response = await api.get<{ success: boolean; data: Unit[] }>(`/chapters/${currentChapterId}/units`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.data.success && response.data.data) {
        const filtered = response.data.data.filter((u: Unit) => u.id !== unitId)
        setAvailableUnits(filtered)
        return
      }
    } catch (primaryError) {
      try {
        const fallbackResponse = await StaffUnitService.getAllUnitsByChapter(currentChapterId)
        if (fallbackResponse.success && fallbackResponse.data) {
          const filtered = fallbackResponse.data.filter(u => u.id !== unitId)
          setAvailableUnits(filtered)
          return
        }
      } catch (fallbackError) {
        console.error('Both APIs failed:', { primaryError, fallbackError })
      }
    }

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

  const addMaterial = () => {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const newMaterial: MaterialFormData = {
      id: `new_${timestamp}_${randomId}`,
      materialId: `material_${timestamp}_${randomId}`,
      skillType: 'Ngữ pháp',
      script: '',
      translation: '',
      selectedFile: null,
      isExpanded: true,
      isNew: true,
      isUpdated: false,
      isDeleted: false,
      originalData: undefined,
      fileUrl: '',
      type: 'GRAMMAR' as MaterialType
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
        return response.data.data
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

  // Save individual material (create or update)
  const saveMaterial = async (frontendId: string) => {
    const material = materials.find(m => m.id === frontendId)
    if (!material) {
      setError('Không tìm thấy tài liệu để lưu')
      return
    }

    if (!material.skillType?.trim()) {
      setError('Vui lòng chọn loại kỹ năng cho tài liệu')
      return
    }

    if (!material.selectedFile && !material.fileUrl) {
      setError('Vui lòng chọn file cho tài liệu')
      return
    }

    try {
      if (material.isNew) {
        await processNewMaterial(material)
        console.log('✅ New material created successfully')
        
        setMaterials(prev => prev.map(m => 
          m.id === frontendId 
            ? { ...m, isNew: false }
            : m
        ))
      } else {
        await processUpdatedMaterial(material)
        console.log('✅ Material updated successfully')
        
        setMaterials(prev => prev.map(m => 
          m.id === frontendId 
            ? { ...m, isUpdated: false }
            : m
        ))
      }
      
      await fetchMaterials()
    } catch (error) {
      console.error('❌ Failed to save material:', error)
      setError('Không thể lưu tài liệu. Vui lòng thử lại.')
    }
  }

  const showDeleteConfirmation = (frontendId: string) => {
    const material = materials.find(m => m.id === frontendId)
    if (!material) return

    setDeleteConfirmation({
      isOpen: true,
      materialId: frontendId,
      materialTitle: `Tài liệu ${material.skillType || 'không xác định'}`
    })
  }

  const removeMaterial = async (frontendId: string, confirmed: boolean = false) => {
    if (!frontendId) return;
    
    const materialToRemove = materials.find(m => m.id === frontendId)
    if (!materialToRemove) {
      console.warn('⚠️ Material not found:', frontendId)
      return
    }

    if (!confirmed && !materialToRemove.isNew) {
      showDeleteConfirmation(frontendId)
      return
    }

    console.log('🗑️ Removing material with frontend ID:', frontendId)

    if (materialToRemove.isNew) {
      console.log('🆕 Removing new material completely from UI')
      setMaterials(prev => prev.filter(m => m.id !== frontendId))
    } else {
      console.log('📝 Deleting existing material via API:', materialToRemove.materialId)
      try {
        if (materialToRemove.materialId) {
          await MaterialService.deleteMaterial(materialToRemove.materialId)
          console.log('✅ Material deleted successfully')
          
          setMaterials(prev => prev.filter(m => m.id !== frontendId))
        }
      } catch (error) {
        console.error('❌ Failed to delete material:', error)
        setError('Không thể xóa tài liệu. Vui lòng thử lại.')
      }
    }

    setDeleteConfirmation({ isOpen: false, materialId: '', materialTitle: '' })
  }

  const updateMaterialSkillType = (frontendId: string, newSkillType: string) => {
    setMaterials(prev =>
      prev.map(m => 
        m.id === frontendId 
          ? { 
              ...m, 
              skillType: newSkillType,
              type: SKILL_TYPE_TO_MATERIAL_TYPE[newSkillType] || 'GRAMMAR',
              isUpdated: !m.isNew
            }
          : m
      )
    );
  }

  const updateMaterialScript = (frontendId: string, script: string) => {
    setMaterials(prev =>
      prev.map(m => 
        m.id === frontendId 
          ? { ...m, script, isUpdated: !m.isNew }
          : m
      )
    );
  }

  const updateMaterialTranslation = (frontendId: string, translation: string) => {
    setMaterials(prev =>
      prev.map(m => 
        m.id === frontendId 
          ? { ...m, translation, isUpdated: !m.isNew }
          : m
      )
    );
  }

  const updateMaterialFile = (frontendId: string, file: File) => {
    setMaterials(prev =>
      prev.map(m => 
        m.id === frontendId 
          ? { ...m, selectedFile: file, isUpdated: !m.isNew }
          : m
      )
    );
  }

  const toggleMaterial = (frontendId: string) => {
    if (!frontendId) return;
    
    setMaterials(prev =>
      prev.map(material =>
        material.id === frontendId 
          ? { ...material, isExpanded: !material.isExpanded }
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
    return formData.title?.trim() && formData.description?.trim();
  }, [formData.title, formData.description]);

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

  const extractFilenameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/')
      const documentIndex = urlParts.findIndex(part => part === 'document')
      
      if (documentIndex !== -1 && documentIndex + 1 < urlParts.length) {
        const filenameWithParams = urlParts[documentIndex + 1]
        const filename = filenameWithParams.split('?')[0]
        const decodedFilename = decodeURIComponent(filename)
        console.log(`📎 Extracted filename from URL: ${url} -> ${decodedFilename}`)
        return decodedFilename
      }
      
      const lastPart = urlParts[urlParts.length - 1]
      const filename = lastPart.split('?')[0]
      const decodedFilename = decodeURIComponent(filename)
      console.log(`📎 Fallback extracted filename: ${url} -> ${decodedFilename}`)
      return decodedFilename
    } catch (error) {
      console.error('Error extracting filename from URL:', error)
      return url
    }
  }

  const processNewMaterial = async (material: MaterialFormData): Promise<AxiosResponse> => {
    console.log('🆕 Creating new material for frontend ID:', material.id)
    
    if (!material.materialId) {
      throw new Error('Material ID is required for new materials')
    }

    if (!unitId) {
      throw new Error('Unit ID is required for creating materials')
    }
    
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
      id: material.materialId,
      fileUrl: finalFileUrl,
      type: SKILL_TYPE_TO_MATERIAL_TYPE[material.skillType] || 'GRAMMAR',
      script: material.script?.trim() || "",
      translation: material.translation?.trim() || "",
      unitId: unitId
    }

    console.log('📝 Create request payload:', JSON.stringify(createRequest, null, 2))

    try {
      const response = await api.post('/materials', createRequest, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      })
      console.log('✅ Create material response:', response.data)
      return response
    } catch (error) {
      console.error('❌ Create material failed:', error)
      throw error
    }
  }

  const processUpdatedMaterial = async (material: MaterialFormData): Promise<AxiosResponse> => {
    console.log('🔄 Updating existing material:', material.materialId)
    
    if (!material.materialId || !material.originalData) {
      throw new Error(`Material ID không hợp lệ hoặc thiếu dữ liệu gốc: ${material.materialId}`)
    }
    
    let finalFileUrl = ''
    
    if (material.selectedFile) {
      console.log('📤 Uploading new file for material update...')
      finalFileUrl = await uploadMaterialFile(material.selectedFile)
      console.log(`✅ New file uploaded: ${finalFileUrl}`)
    } else if (material.originalData.fileUrl) {
      finalFileUrl = extractFilenameFromUrl(material.originalData.fileUrl)
      console.log(`📎 Using existing file (extracted from original): ${finalFileUrl}`)
    } else if (material.fileUrl) {
      finalFileUrl = extractFilenameFromUrl(material.fileUrl)
      console.log(`📎 Using existing file (extracted from current): ${finalFileUrl}`)
    } else {
      throw new Error('Không tìm thấy file URL để cập nhật material')
    }

    const updateRequest = {
      id: material.materialId,
      fileUrl: finalFileUrl,
      type: SKILL_TYPE_TO_MATERIAL_TYPE[material.skillType] || 'GRAMMAR',
      script: material.script?.trim() || "",
      translation: material.translation?.trim() || "",
      unitId: unitId
    }

    console.log('📝 Update request payload:', JSON.stringify(updateRequest, null, 2))

    try {
      const response = await api.put(`/materials/${material.materialId}`, updateRequest, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      })
      console.log('✅ Update material response:', response.data)
      return response
    } catch (error) {
      console.error('❌ Update material failed:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title?.trim() || !formData.description?.trim()) {
      setError('Vui lòng điền đầy đủ thông tin cơ bản')
      return
    }

    if (!unitId || !chapterId) {
      setError("ID bài học hoặc chương không hợp lệ")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('📤 Updating unit basic information...')
      const unitResponse = await updateUnit()
      console.log('✅ Unit updated successfully')

      console.log('🎉 Unit update completed, navigating back...')
      navigate(`/staff/courses/${courseId}/chapters/${chapterId}/units/${unitId}`, {
        replace: true,
        state: { 
          course,
          chapter,
          unit: unitResponse.data.data,
          message: 'Cập nhật thông tin bài học thành công!',
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
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                        <Info className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-blue-900">Thông tin</h2>
                    </div>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                  </div>

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
                          <span className="text-xl font-bold text-amber-800">{materials.length}</span>
                          <span className="text-amber-600 text-xs">tài liệu</span>
                        </div>
                      </div>
                    </div>
                  </div>

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
                        Tài liệu học tập ({materials.length})
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
                      {materials.map((material, index) => (
                        <div
                          key={material.id}
                          className="border border-purple-200 rounded-xl bg-gradient-to-r from-white to-purple-50/30"
                        >
                          <div className="flex items-center justify-between p-4">
                            <button
                              type="button"
                              onClick={() => material.id && toggleMaterial(material.id)}
                              className="flex items-center gap-3 flex-1 text-left hover:bg-purple-50/50 transition-colors rounded-lg p-2 -m-2"
                              aria-expanded={material.isExpanded}
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
                                  {material.skillType && ` (${material.skillType})`}
                                  {material.isNew && <span className="text-green-600 text-xs ml-2">(Mới)</span>}
                                  {material.isUpdated && <span className="text-orange-600 text-xs ml-2">(Đã sửa)</span>}
                                </h3>
                              </div>
                            </button>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                type="button"
                                onClick={() => material.id && toggleMaterial(material.id)}
                                className="p-1 rounded hover:bg-purple-100 transition-colors"
                                aria-expanded={material.isExpanded}
                                aria-label={`${material.isExpanded ? 'Collapse' : 'Expand'} material ${index + 1}`}
                              >
                                {material.isExpanded ? (
                                  <ChevronDown className="h-5 w-5 text-purple-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-purple-400" />
                                )}
                              </button>
                            </div>
                          </div>

                          {material.isExpanded && (
                            <section 
                              className="border-t border-purple-200 bg-purple-50/30 p-6 space-y-4"
                              id={`material-content-${material.id}`}
                              aria-labelledby={`material-header-${material.id}`}
                            >
                              <div className="space-y-2">
                                <Label className="text-purple-800 font-medium">
                                  Loại kỹ năng <span className="text-red-500">*</span>
                                </Label>
                                <select
                                  value={material.skillType}
                                  onChange={(e) => {
                                    if (material.id) {
                                      updateMaterialSkillType(material.id, e.target.value);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                  required
                                >
                                  <option value="">Chọn loại kỹ năng</option>
                                  {SKILL_TYPES.map((skillType) => (
                                    <option key={skillType} value={skillType}>
                                      {skillType}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {material.skillType === 'Nghe' && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-purple-800 font-medium">
                                      Script (Tiếng Nhật) <span className="text-gray-500 text-sm">(Tùy chọn)</span>
                                    </Label>
                                    <Textarea
                                      value={material.script || ''}
                                      onChange={(e) => {
                                        if (material.id) {
                                          updateMaterialScript(material.id, e.target.value);
                                        }
                                      }}
                                      placeholder="Nhập script tiếng Nhật"
                                      className="border-purple-300 focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                                      rows={4}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-purple-800 font-medium">
                                      Translation (Tiếng Việt) <span className="text-gray-500 text-sm">(Tùy chọn)</span>
                                    </Label>
                                    <Textarea
                                      value={material.translation || ''}
                                      onChange={(e) => {
                                        if (material.id) {
                                          updateMaterialTranslation(material.id, e.target.value);
                                        }
                                      }}
                                      placeholder="Nhập bản dịch tiếng Việt"
                                      className="border-purple-300 focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                                      rows={4}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label className="text-purple-800 font-medium">
                                  Tệp tài liệu <span className="text-red-500">*</span>
                                </Label>
                                
                                {material.fileUrl && !material.selectedFile && (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                    <p className="text-green-700 text-sm">
                                      📁 Tệp hiện tại: {material.fileUrl.split('/').pop()}
                                    </p>
                                  </div>
                                )}

                                <input
                                  type="file"
                                  accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && material.id) {
                                      updateMaterialFile(material.id, file);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                />
                                
                                {material.selectedFile && (
                                  <p className="text-sm text-purple-600">
                                    ✅ Tệp mới đã chọn: {material.selectedFile.name}
                                  </p>
                                )}
                                
                                <p className="text-purple-600 text-xs">
                                  Chấp nhận: Audio, Video, Ảnh, PDF, Word, Text (Tối đa 800KB)
                                </p>
                              </div>

                              <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (material.id) {
                                      removeMaterial(material.id)
                                    }
                                  }}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Xóa
                                </Button>
                                
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    if (material.id) {
                                      saveMaterial(material.id)
                                    }
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                  disabled={!material.skillType?.trim() || (!material.selectedFile && !material.fileUrl)}
                                >
                                  {material.isNew ? 'Tạo tài liệu' : 'Lưu thay đổi'}
                                </Button>
                              </div>
                            </section>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

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
                    {isLoading ? 'Đang cập nhật...' : 'Lưu thông tin bài học'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa tài liệu</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa <span className="font-medium">{deleteConfirmation.materialTitle}</span>? 
                Hành động này không thể hoàn tác.
              </p>
              
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmation({ isOpen: false, materialId: '', materialTitle: '' })}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => removeMaterial(deleteConfirmation.materialId, true)}
                >
                  Xóa tài liệu
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffNavigation>
  )
}

export default StaffUpdateUnitPage
