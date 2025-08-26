import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { AlertCircle, ArrowLeft, BookOpen, Hash, Info, Plus, FileText, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { StaffNavigation } from '../../components/layout/StaffNavigation'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { CourseService } from '../../services/courseService'
import { type Unit as StaffUnit } from '../../services/staffUnitService'
import { MaterialService, type MaterialType } from '../../services/materialService'
import type { CreateUnitRequest, Chapter, Course } from '../../types/course'
import { useToast } from '../../hooks/useToast'
import api from '../../api/axios'

interface LocationState {
  course?: Course
  chapter?: Chapter
}

// Enhanced material interface based on user example
interface MaterialFormData {
  id: number
  materialId: string // ID cho material khi tạo
  skillType: string // Phân loại kỹ năng (Nghe, Nói, Đọc, Viết, Ngữ pháp, Từ vựng)
  script: string // Script cho LISTENING
  translation: string // Translation cho LISTENING
  selectedFile: File | null // File được chọn để upload
  isExpanded: boolean
}

// Mapping từ skill type sang MaterialType enum
const SKILL_TYPE_TO_MATERIAL_TYPE: Record<string, MaterialType> = {
  'LISTENING': 'LISTENING',
  'KANJI': 'KANJI',
  'READING': 'READING',
  'WRITING': 'WRITING',
  'GRAMMAR': 'GRAMMAR',
  'VOCAB': 'VOCAB'
}

const SKILL_TYPES = [
  'LISTENING',
  'KANJI', 
  'READING',
  'WRITING',
  'GRAMMAR',
  'VOCAB'
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
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({
    id: '',
    title: '',
    description: '',
    prerequisiteUnitId: '',
    materialIds: ''
  })

  // Thêm state để track lỗi file cho từng material
  const [materialFileErrors, setMaterialFileErrors] = useState<{[materialId: number]: string}>({})

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
      script: '',
      translation: '',
      selectedFile: null,
      isExpanded: true
    }
  ])

  // Extract material ID from filename
  const extractMaterialIdFromFilename = (filename: string): string => {
    // Xóa extension và thay thế spaces bằng underscores
    const nameWithoutExtension = filename.replace(/\.[^/.]+$/, '')
    return nameWithoutExtension.replace(/\s+/g, '_')
  }

  // Validate material ID format
  const validateMaterialIdFormat = (materialId: string): string => {
    console.log('🔍 Validating material ID format:', materialId)
    const pattern = /^[A-Z0-9]+__CHAPTER_\d+__UNIT_\d+__[A-Z]+__JA_VI__\d+$/
    const isValid = pattern.test(materialId)
    console.log('📋 Pattern test result:', isValid)
    console.log('📋 Pattern used:', pattern.toString())
    
    if (!isValid) {
      const error = 'Tên file không đúng format. Phải theo mẫu: [MãKhóaHọc]__CHAPTER_[Số]__UNIT_[Số]__[KỹNăng]__JA_VI__[Số]'
      console.log('❌ Format validation failed:', error)
      return error
    }
    console.log('✅ Format validation passed')
    return ''
  }

  // Check if material ID exists
  const checkMaterialIdExists = async (materialId: string): Promise<boolean> => {
    try {
      console.log('🔍 Checking if material ID exists:', materialId)
      
      // Check in current materials list
      const existsInCurrentList = materials.some(m => m.materialId === materialId)
      if (existsInCurrentList) {
        console.log('❌ Material ID exists in current list')
        return true
      }

      // Check in database via API
      console.log('🌐 Checking material ID in database via API...')
      const response = await api.get(`/materials/${materialId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📋 API response status:', response.status)
      console.log('📋 API response data:', response.data)
      
      // If we get a successful response, the material exists
      if (response.status === 200 && response.data) {
        console.log('❌ Material ID exists in database')
        return true
      }
      
      console.log('✅ Material ID is available')
      return false
    } catch (error) {
      console.log('🔍 API error checking material ID:', error)
      
      // If it's a 404, the material doesn't exist - that's good
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } }
        if (axiosError.response?.status === 404) {
          console.log('✅ Material ID not found in database (404) - available for use')
          return false
        }
      }
      
      console.error('❌ Error checking material ID:', error)
      // In case of error, assume it doesn't exist to avoid blocking
      return false
    }
  }

  // Generate MaterialId function - now uses filename instead of auto-generation
  const generateMaterialId = (filename?: string): string => {
    if (!filename) return ''
    return extractMaterialIdFromFilename(filename)
  }

  // Add material function with correct interface
  const addMaterial = () => {
    const newId = Math.max(...materials.map(m => m.id)) + 1
    setMaterials(prev => [
      ...prev,
      {
        id: newId,
        materialId: '',
        skillType: '',
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
    setMaterials(prev => prev.map(material => {
      if (material.id === id) {
        const updatedMaterial = { ...material, [field]: value }
        
        // Material ID sẽ được tạo từ tên file khi chọn file, không tự động tạo từ skillType
        return updatedMaterial
      }
      return material
    }))
  }

  // Handle file selection for material
  const handleMaterialFileSelect = async (materialId: number, file: File | null) => {
    if (file) {
      // Kiểm tra loại file
      const allowedTypes = ['application/pdf', 'audio/mpeg', 'audio/mp3']
      const isValidType = allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.mp3')
      
      if (!isValidType) {
        const errorMessage = 'Chỉ chấp nhận file PDF hoặc MP3'
        setMaterialFileErrors(prev => ({
          ...prev,
          [materialId]: errorMessage
        }))
        return
      }

      // Kiểm tra kích thước file (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        const errorMessage = `File "${file.name}" có kích thước ${(file.size / (1024 * 1024)).toFixed(1)}MB. Vui lòng chọn file dưới 5MB.`
        setMaterialFileErrors(prev => ({
          ...prev,
          [materialId]: errorMessage
        }))
        return
      }

      // Extract material ID from filename
      const newMaterialId = extractMaterialIdFromFilename(file.name)
      
      // Validate format
      const formatError = validateMaterialIdFormat(newMaterialId)
      if (formatError) {
        setMaterialFileErrors(prev => ({
          ...prev,
          [materialId]: formatError
        }))
        return
      }

      // Check if material ID exists
      const exists = await checkMaterialIdExists(newMaterialId)
      if (exists) {
        const errorMessage = `Material ID "${newMaterialId}" đã tồn tại. Vui lòng đổi tên file.`
        setMaterialFileErrors(prev => ({
          ...prev,
          [materialId]: errorMessage
        }))
        return
      }

      // Clear lỗi nếu file hợp lệ
      setMaterialFileErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[materialId]
        return newErrors
      })

      // Update material with new material ID and file
      setMaterials(prev => prev.map(material => 
        material.id === materialId 
          ? { ...material, selectedFile: file, materialId: newMaterialId }
          : material
      ))
    } else {
      // Clear lỗi khi không chọn file
      setMaterialFileErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[materialId]
        return newErrors
      })
      updateMaterial(materialId, 'selectedFile', file)
    }
  }

  // Upload material file function
  const uploadMaterialFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('files', file)

    try {
      const response = await api.post('/materials/upload', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'multipart/form-data',
        }
      })

      console.log('📤 Upload response:', response.data)

      if (response.data.success && response.data.data) {
        // Đảm bảo fileUrl là chuỗi, không phải mảng
        let fileUrl = response.data.data
        
        // Nếu data là mảng, lấy phần tử đầu tiên
        if (Array.isArray(fileUrl)) {
          fileUrl = fileUrl[0]
          console.log('📝 Converted array to string:', fileUrl)
        }
        
        // Đảm bảo fileUrl là string
        if (typeof fileUrl !== 'string') {
          console.error('❌ Invalid fileUrl format:', fileUrl, 'Type:', typeof fileUrl)
          throw new Error('Server trả về định dạng fileUrl không hợp lệ')
        }
        
        console.log('✅ Final fileUrl:', fileUrl)
        return fileUrl // Trả về filename: "phan phuong_doc_9a38d5bc-28f4-495b-951f-28751bc34a4c.pdf"
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

  // Auto-update MaterialIds when formData.id changes
  useEffect(() => {
    if (formData.id && course?.id && chapter?.id) {
      setMaterials(prev => prev.map(material => 
        material.skillType 
          ? { ...material, materialId: generateMaterialId(material.skillType) }
          : material
      ))
    }
  }, [formData.id, course?.id, chapter?.id])

  const handleInputChange = (field: string, value: string) => {
    // Luôn cập nhật giá trị trước
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear main error khi user đang typing
    setError(null)
    
    // Validation cho từng trường và set field error
    let fieldError = ''
    
    if (field === 'id') {
      // Validation cho trường ID - không cho phép dấu cách
      const trimmedValue = value.trim()
      if (value !== trimmedValue || value.includes(' ')) {
        fieldError = 'Mã bài học không được chứa dấu cách. Vui lòng sử dụng dấu gạch ngang (-) hoặc underscore (_) thay thế.'
      } else if (value && !/^[A-Za-z0-9_-]+$/.test(value)) {
        fieldError = 'Mã bài học chỉ được chứa chữ, số, dấu gạch ngang (-) hoặc underscore (_).'
      }
    }
    
    if (field === 'title' && !value.trim()) {
      fieldError = 'Vui lòng nhập tên bài học.'
    }
    
    if (field === 'description' && !value.trim()) {
      fieldError = 'Vui lòng nhập mô tả bài học.'
    }
    
    // Cập nhật field error
    setFieldErrors(prev => ({ ...prev, [field]: fieldError }))
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

  // Helper function để kiểm tra materials hợp lệ
  const getValidMaterials = () => {
    return materials.filter(material => 
      material.skillType && 
      material.selectedFile &&
      material.selectedFile.size <= 5 * 1024 * 1024 && // Chỉ accept file <= 5MB
      material.materialId.trim()
    )
  }

  // Helper function để kiểm tra có file nào > 5MB không
  const hasOversizedFiles = () => {
    return materials.some(material => 
      material.selectedFile && material.selectedFile.size > 5 * 1024 * 1024
    )
  }

  // Helper function để kiểm tra có lỗi file nào không
  const hasFileErrors = () => {
    return Object.keys(materialFileErrors).length > 0 || hasOversizedFiles()
  }

  const isFormValid = formData.id.trim() &&
                     formData.title.trim() && 
                     formData.description.trim() &&
                     getValidMaterials().length > 0 &&
                     !hasFileErrors() // Thêm check lỗi file

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
    const materialCount = getValidMaterials().length
    
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
      const axiosError = error as { response?: { status: number, data?: any } }
      
      if (axiosError.response?.status === 400 && axiosError.response?.data) {
        // Hiển thị chi tiết lỗi từ backend nếu có
        if (axiosError.response.data.errors) {
          // Nếu backend trả về mảng lỗi
          const errorMessages = axiosError.response.data.errors.map((err: any) => err.message).join(' | ')
          setError(`Lỗi dữ liệu: ${errorMessages}`)
          showToast('error', `Lỗi dữ liệu: ${errorMessages}`)
        } else if (axiosError.response.data.message) {
          const errorMsg = axiosError.response.data.message
          let userFriendlyError = errorMsg
          
          // Phân tích và tạo thông báo lỗi chi tiết
          if (errorMsg.includes('duplicate') || errorMsg.includes('đã tồn tại') || errorMsg.includes('already exists')) {
            userFriendlyError = `Mã bài học "${formData.id}" đã tồn tại trong chương này. Vui lòng sử dụng mã khác.`
          } else if (errorMsg.includes('prerequisite') || errorMsg.includes('tiên quyết')) {
            userFriendlyError = `Lỗi bài học tiên quyết: ${errorMsg}`
          } else if (errorMsg.includes('invalid') || errorMsg.includes('không hợp lệ')) {
            userFriendlyError = `Dữ liệu không hợp lệ: ${errorMsg}`
          } else if (errorMsg.includes('format') || errorMsg.includes('định dạng')) {
            userFriendlyError = `Lỗi định dạng: ${errorMsg}`
          } else if (errorMsg.includes('size') || errorMsg.includes('large') || errorMsg.includes('MB')) {
            userFriendlyError = `Lỗi kích thước file: ${errorMsg}. Vui lòng chọn file dưới 5MB.`
          } else if (errorMsg.includes('material') || errorMsg.includes('tài liệu')) {
            userFriendlyError = `Lỗi tài liệu: ${errorMsg}`
          }
          
          setError(userFriendlyError)
          showToast('error', userFriendlyError)
        } else {
          setError('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.')
          showToast('error', 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.')
        }
      } else if (axiosError.response?.status === 403) {
        const errorMsg = 'Bạn không có quyền tạo bài học. Vui lòng kiểm tra lại quyền tài khoản.'
        setError(errorMsg)
        showToast('error', errorMsg)
      } else if (axiosError.response?.status === 401) {
        const errorMsg = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        setError(errorMsg)
        showToast('error', errorMsg)
      } else if (axiosError.response?.status === 404) {
        const errorMsg = 'Không tìm thấy chương học. Vui lòng kiểm tra lại.'
        setError(errorMsg)
        showToast('error', errorMsg)
      } else if (axiosError.response?.status === 413) {
        const errorMsg = 'File tải lên quá lớn. Vui lòng chọn file dưới 5MB.'
        setError(errorMsg)
        showToast('error', errorMsg)
      } else {
        const errorMsg = `Có lỗi xảy ra khi tạo bài học (Mã lỗi: ${axiosError.response?.status}). Vui lòng thử lại.`
        setError(errorMsg)
        showToast('error', errorMsg)
      }
    } else {
      const fallbackError = 'Có lỗi xảy ra khi tạo bài học. Vui lòng thử lại.'
      setError(fallbackError)
      showToast('error', fallbackError)
    }
  }

  // Helper function để tạo materials
  const createMaterialsForUnit = async (unitId: string) => {
    const validMaterials = getValidMaterials()

    console.log(`📋 Found ${validMaterials.length} valid materials to process`)
    console.log(`📋 Unit ID received for materials: "${unitId}"`)

    for (let i = 0; i < validMaterials.length; i++) {
      const material = validMaterials[i]
      showToast("warning", `Đang xử lý tài liệu ${i + 1}/${validMaterials.length}: ${material.skillType}`)

      let finalFileUrl = ''

      // Upload file
      if (!material.selectedFile) {
        throw new Error(`Chưa chọn file cho tài liệu ${material.skillType}`)
      }

      try {
        console.log(`📤 Uploading file for material: ${material.skillType}`)
        finalFileUrl = await uploadMaterialFile(material.selectedFile)
        console.log(`✅ File uploaded successfully: ${finalFileUrl}`)
      } catch (uploadError) {
        console.error(`❌ File upload failed for ${material.skillType}:`, uploadError)
        throw new Error(`Lỗi upload file cho tài liệu ${material.skillType}: ${uploadError}`)
      }

      // Create material
      try {
        const materialType = SKILL_TYPE_TO_MATERIAL_TYPE[material.skillType] || 'VOCAB' as MaterialType
        
        // Validate unitId before creating material
        if (!unitId || unitId.trim() === '') {
          throw new Error(`Unit ID is invalid: "${unitId}"`)
        }
        
        const materialData = {
          id: material.materialId.trim(), // Sử dụng materialId từ form thay vì random
          fileUrl: finalFileUrl,
          type: materialType,
          script: material.script || '',
          translation: material.translation || '',
          unitId: unitId.trim()
        }

        console.log(`📝 Creating material with data:`, {
          ...materialData,
          fileUrlType: typeof finalFileUrl,
          fileUrlIsArray: Array.isArray(finalFileUrl),
          fileUrlLength: finalFileUrl.length,
          materialIdLength: material.materialId.trim().length,
          unitIdReceived: unitId,
          unitIdAfterTrim: unitId.trim()
        })
        
        // Double check fileUrl is string
        if (typeof finalFileUrl !== 'string') {
          console.error('❌ fileUrl is not string before creating material:', finalFileUrl, 'Type:', typeof finalFileUrl)
          throw new Error(`fileUrl must be string but got ${typeof finalFileUrl}`)
        }
        
        const materialResult = await MaterialService.createMaterial(materialData)
        console.log(`✅ Material created successfully:`, materialResult)
      } catch (createError) {
        console.error(`❌ Material creation failed for ${material.skillType}:`, createError)
        
        // Log chi tiết lỗi từ server
        if (createError && typeof createError === 'object' && 'response' in createError) {
          const axiosError = createError as { response?: { status: number, data?: any } }
          console.error(`❌ Server response status: ${axiosError.response?.status}`)
          console.error(`❌ Server response data:`, axiosError.response?.data)
          
          // If it's a 400 error, log the request data too
          if (axiosError.response?.status === 400) {
            console.error(`❌ Request data that caused 400:`, {
              materialId: material.materialId.trim(),
              skillType: material.skillType,
              unitId: unitId,
              fileUrl: finalFileUrl
            })
          }
        }
        
        throw new Error(`Lỗi tạo tài liệu ${material.skillType}: ${createError}`)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear field errors trước khi validate
    setFieldErrors({
      id: '',
      title: '',
      description: '',
      prerequisiteUnitId: '',
      materialIds: ''
    })
    
    // Validate tất cả các trường và thu thập lỗi
    const errors: {[key: string]: string} = {}
    
    if (!formData.id.trim()) {
      errors.id = 'Vui lòng nhập mã bài học.'
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.id.trim())) {
      errors.id = 'Mã bài học chỉ được chứa chữ, số, dấu gạch ngang (-) hoặc underscore (_), không được chứa dấu cách hoặc ký tự đặc biệt.'
    }
    
    if (!formData.title.trim()) {
      errors.title = 'Vui lòng nhập tên bài học.'
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Vui lòng nhập mô tả bài học.'
    }
    
    if (!chapterId) {
      errors.chapterId = 'Không tìm thấy ID chương.'
    }
    
    // Validate materials
    const validMaterials = getValidMaterials()
    
    // Kiểm tra có file nào > 5MB không trước tiên
    if (hasOversizedFiles()) {
      errors.materialIds = 'Có file tài liệu vượt quá giới hạn 5MB. Vui lòng thay thế các file quá lớn.'
    } else if (validMaterials.length === 0) {
      errors.materials = 'Vui lòng thêm ít nhất một tài liệu học tập hợp lệ (có Material ID, phân loại kỹ năng và file).'
    } else {
      // Kiểm tra từng material chi tiết
      for (let i = 0; i < materials.length; i++) {
        const material = materials[i]
        
        // Chỉ validate những material có ít nhất một trường được điền
        const hasAnyField = material.materialId.trim() || material.skillType || material.selectedFile
        if (!hasAnyField) continue // Skip material rỗng
        
        if (!material.materialId.trim()) {
          errors.materialIds = `Tài liệu ${i + 1}: Vui lòng nhập Material ID.`
          break
        }
        
        if (!material.skillType) {
          errors.materialIds = `Tài liệu ${i + 1}: Vui lòng chọn phân loại kỹ năng.`
          break
        }
        
        if (!material.selectedFile) {
          errors.materialIds = `Tài liệu ${i + 1}: Vui lòng chọn file.`
          break
        }
        
        // Kiểm tra kích thước file 5MB (double check)
        const maxSize = 5 * 1024 * 1024
        if (material.selectedFile.size > maxSize) {
          errors.materialIds = `Tài liệu ${i + 1}: File "${material.selectedFile.name}" có kích thước ${(material.selectedFile.size / (1024 * 1024)).toFixed(1)}MB. Vui lòng chọn file dưới 5MB.`
          break
        }
      }
      
      // Kiểm tra trùng lặp MaterialId
      const materialIds = materials.filter(m => m.materialId.trim()).map(m => m.materialId.trim())
      const duplicateIds = materialIds.filter((id, index) => materialIds.indexOf(id) !== index)
      if (duplicateIds.length > 0) {
        errors.materialIds = `Material ID bị trùng lặp: ${duplicateIds[0]}. Vui lòng sử dụng ID khác nhau cho mỗi tài liệu.`
      }
    }
    
    // Nếu có lỗi validation, hiển thị tất cả lỗi field và không submit
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Vui lòng kiểm tra và sửa các lỗi trong form.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
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

      // Kiểm tra xem unit có được tạo thành công không
      if (!unitResult.success || !unitResult.data || !unitResult.data.id) {
        console.error('❌ Unit creation response invalid:', unitResult)
        throw new Error('Unit creation failed: Invalid response from server')
      }

      const createdUnitId = unitResult.data.id
      console.log('📋 Unit ID from server response:', createdUnitId)
      console.log('📋 Unit ID from form data:', unitData.id)
      
      // Verify unit ID is not empty
      if (!createdUnitId || createdUnitId.trim() === '') {
        console.error('❌ Unit ID is empty or invalid:', createdUnitId)
        throw new Error('Unit creation failed: Empty unit ID returned from server')
      }

      // Đợi một chút để đảm bảo unit đã được lưu vào database
      await new Promise(resolve => setTimeout(resolve, 1000))

      // BƯỚC 3: Sau khi unit được tạo, xử lý materials - sử dụng ID từ response
      await createMaterialsForUnit(createdUnitId)

      handleSubmitSuccess()
    } catch (error) {
      handleSubmitError(error)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
                          maxLength={40}
                          className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-base py-3 bg-white/80 backdrop-blur-sm ${fieldErrors.id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          required
                        />
                        {fieldErrors.id ? (
                          <p className="text-red-600 text-xs mt-1">
                            ⚠️ {fieldErrors.id}
                          </p>
                        ) : (
                          <div className="flex justify-between">
                            <p className="text-blue-600 text-xs mt-1">
                              💡 Mã bài học không được chứa dấu cách. Sử dụng dấu gạch ngang (-) hoặc underscore (_)
                            </p>
                            <p className={`text-xs mt-1 ${formData.id.length > 32 ? 'text-red-600' : 'text-gray-500'}`}>
                              {formData.id.length}/40 ký tự
                            </p>
                          </div>
                        )}
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
                          maxLength={255}
                          className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-base py-3 bg-white/80 backdrop-blur-sm ${fieldErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          required
                        />
                        {fieldErrors.title ? (
                          <p className="text-red-600 text-xs mt-1">
                            ⚠️ {fieldErrors.title}
                          </p>
                        ) : (
                          <p className={`text-xs mt-1 ${formData.title.length > 200 ? 'text-red-600' : 'text-gray-500'}`}>
                            {formData.title.length}/255 ký tự
                          </p>
                        )}
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
                        maxLength={255}
                        className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 resize-none text-base bg-white/80 backdrop-blur-sm ${fieldErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        required
                      />
                      {fieldErrors.description ? (
                        <p className="text-red-600 text-xs mt-1">
                          ⚠️ {fieldErrors.description}
                        </p>
                      ) : (
                        <div className="flex justify-between">
                          <p className="text-blue-600 text-xs">
                            Mô tả nội dung, mục tiêu học tập và những gì học viên sẽ đạt được
                          </p>
                          <p className={`text-xs ${formData.description.length > 200 ? 'text-red-600' : 'text-gray-500'}`}>
                            {formData.description.length}/255 ký tự
                          </p>
                        </div>
                      )}
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
                    {fieldErrors.materials && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <div className="ml-2">⚠️ {fieldErrors.materials}</div>
                      </Alert>
                    )}
                    {fieldErrors.materialIds && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <div className="ml-2">⚠️ {fieldErrors.materialIds}</div>
                      </Alert>
                    )}
                    <div className="space-y-6">
                      {materials.map((material, index) => (
                        <div key={material.id} className={`border rounded-lg overflow-hidden ${materialFileErrors[material.id] ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
                          {/* Material Header */}
                          <button 
                            type="button"
                            className={`w-full p-4 cursor-pointer transition-colors text-left ${materialFileErrors[material.id] ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'}`}
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
                                  <h4 className={`font-medium ${materialFileErrors[material.id] ? 'text-red-900' : 'text-gray-900'}`}>
                                    Tài liệu {index + 1}
                                    {materialFileErrors[material.id] && (
                                      <span className="ml-2 text-xs text-red-600 font-semibold">
                                        [LỖI FILE]
                                      </span>
                                    )}
                                    {material.materialId && !materialFileErrors[material.id] && (
                                      <span className="ml-2 text-xs text-purple-600 font-mono">
                                        [{material.materialId}]
                                      </span>
                                    )}
                                  </h4>
                                  <p className={`text-sm ${materialFileErrors[material.id] ? 'text-red-600' : 'text-gray-500'}`}>
                                    {materialFileErrors[material.id] 
                                      ? materialFileErrors[material.id]
                                      : (material.skillType 
                                        ? material.skillType
                                        : 'Chưa được cấu hình')
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
                              {/* Material ID */}
                              <div className="space-y-2">
                                <Label htmlFor={`materialId-${material.id}`} className="text-sm font-medium text-gray-700">
                                  Material ID <span className="text-red-500">*</span>
                                  <span className="text-xs text-gray-500 font-normal ml-2">(Từ tên file)</span>
                                </Label>
                                <Input
                                  id={`materialId-${material.id}`}
                                  value={material.materialId}
                                  readOnly
                                  placeholder="Material ID sẽ được tạo từ tên file khi bạn chọn file"
                                  className="mt-1 block w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 shadow-sm cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-600">
                                  💡 Material ID được tạo từ tên file. Hãy đặt tên file theo format: [Mã Khóa Học]__CHAPTER_[Số thứ tự]__UNIT_[Số thứ tự]__[Kỹ Năng]__JA_VI__[Số thứ tự]
                                </p>
                                <p className="text-xs text-gray-600">
                                  💡 Ví dụ: JPD113__CHAPTER_01__UNIT_01__KANJI__JA_VI__0001.pdf
                                </p>
                              </div>

                              {/* Skill Type */}
                              <div className="space-y-2">
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

                              {/* File Upload */}
                              <div>
                                <Label className="text-sm font-medium text-gray-700">
                                  Tài liệu <span className="text-red-500">*</span>
                                  <span className="text-xs text-gray-500 font-normal ml-2">(Tối đa 5MB)</span>
                                </Label>
                                <div className="mt-1">
                                  {/* File Upload */}
                                  <div className="min-h-[80px] relative">
                                    <Input
                                      type="file"
                                      accept=".pdf,.mp3,audio/mpeg,application/pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0] || null
                                        handleMaterialFileSelect(material.id, file)
                                      }}
                                      className={`block w-full h-16 text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer cursor-pointer border-2 border-dashed rounded-lg transition-colors duration-200 ${
                                        materialFileErrors[material.id] 
                                          ? 'border-red-400 hover:border-red-500 bg-red-50/50' 
                                          : 'border-gray-300 hover:border-purple-400'
                                      }`}
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
                                  
                                  {/* Hiển thị lỗi file nếu có */}
                                  {materialFileErrors[material.id] ? (
                                    <p className="text-red-600 text-xs mt-1">
                                      ⚠️ {materialFileErrors[material.id]}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-500 mt-2">
                                      {material.selectedFile 
                                        ? `File đã chọn: ${material.selectedFile.name} (${(material.selectedFile.size / 1024).toFixed(1)}KB)`
                                        : 'Chỉ chấp nhận file PDF hoặc MP3, dưới 5MB. Tên file phải theo format đúng.'
                                      }
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Script & Translation cho LISTENING */}
                              {material.skillType === 'LISTENING' && (
                                <div className="space-y-4">
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
                                      maxLength={255}
                                      className="mt-1 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                                    />
                                    <p className={`text-xs mt-1 ${(material.script?.length || 0) > 200 ? 'text-red-600' : 'text-gray-500'}`}>
                                      {material.script?.length || 0}/255 ký tự
                                    </p>
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
                                      maxLength={255}
                                      className="mt-1 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                                    />
                                    <p className={`text-xs mt-1 ${(material.translation?.length || 0) > 200 ? 'text-red-600' : 'text-gray-500'}`}>
                                      {material.translation?.length || 0}/255 ký tự
                                    </p>
                                  </div>
                                </div>
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
