import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { AlertCircle, ArrowLeft, Upload, BookOpen, Info } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { StaffNavigation } from '../../components/layout/StaffNavigation'
import { StaffCourseService, type UpdateCourseRequest, type Course } from '../../services/staffCourseService'
import { useToast } from '../../hooks/useToast'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import type { StaffCourseDetail } from '../../types/staffCourse'
import api from '../../api/axios'

interface LocationState {
  course?: StaffCourseDetail
}

interface UpdateCourseFormData {
  id: string
  title: string
  description: string
  duration: string
  level: string
  image: string
  requirement: string
  prerequisiteCourseId: string
}

const StaffUpdateCoursePage: React.FC = () => {
  const navigate = useNavigate()
  const { courseId } = useParams<{ courseId: string }>()
  const location = useLocation()
  const locationState = location.state as LocationState || {}

  const [course, setCourse] = useState<StaffCourseDetail | null>(locationState.course || null)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({
    id: '',
    title: '',
    description: '',
    duration: '',
    level: '',
    requirement: ''
  })
  const { showToast } = useToast()

  const [formData, setFormData] = useState<UpdateCourseFormData>({
    id: '',
    title: '',
    description: '',
    duration: '',
    level: '',
    image: '',
    requirement: '',
    prerequisiteCourseId: ''
  })

  const levels = [
    { value: "N5", label: "N5" },
    { value: "N4", label: "N4" },
    { value: "N3", label: "N3" },
    { value: "N2", label: "N2" },
    { value: "N1", label: "N1" },
  ]

  const initializeFormData = useCallback((courseData: StaffCourseDetail) => {
    setFormData({
      id: courseData.id || '',
      title: courseData.title || '',
      description: courseData.description || '',
      duration: courseData.duration?.toString() || '',
      level: courseData.level || '',
      image: courseData.image || '',
      requirement: courseData.requirement || '',
      prerequisiteCourseId: courseData.prerequisiteCourseId || ''
    })
  }, [])

  const fetchCourseData = useCallback(async () => {
    if (!courseId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await StaffCourseService.getCourseDetail(courseId)
      if (response.success && response.data) {
        // Convert Course to StaffCourseDetail
        const courseDetail: StaffCourseDetail = {
          ...response.data,
          description: response.data.description || '',
          requirement: response.data.requirement || '',
          chapters: [],
          enrollmentCount: 0,
          rating: response.data.averageRating || 0
        }
        setCourse(courseDetail)
        initializeFormData(courseDetail)
      } else {
        setError("Không tìm thấy thông tin khóa học")
      }
    } catch (err) {
      console.error('Error fetching course data:', err)
      setError("Không thể tải thông tin khóa học. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }, [courseId, initializeFormData])

  const fetchAvailableCourses = useCallback(async () => {
    try {
      const response = await StaffCourseService.getAllCoursesForSelection()
      if (response.success && response.data) {
        // Filter out current course
        const filtered = response.data.filter(c => c.id !== courseId)
        setAvailableCourses(filtered)
      }
    } catch (err) {
      console.error('Error fetching available courses:', err)
    }
  }, [courseId])

  useEffect(() => {
    if (!courseId) {
      setError("ID khóa học không hợp lệ")
      return
    }

    if (!course) {
      fetchCourseData()
    } else {
      initializeFormData(course)
    }
    
    // Fetch available courses for prerequisite selection
    fetchAvailableCourses()
  }, [courseId, course, fetchCourseData, initializeFormData, fetchAvailableCourses])


  const handleInputChange = useCallback((field: keyof UpdateCourseFormData, value: string) => {
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
        fieldError = 'Mã khóa học không được chứa dấu cách. Vui lòng sử dụng dấu gạch ngang (-) hoặc underscore (_) thay thế.'
      } else if (value && !/^[A-Za-z0-9_-]+$/.test(value)) {
        fieldError = 'Mã khóa học chỉ được chứa chữ, số, dấy gạch ngang (-) hoặc underscore (_).'
      }
    }
    
    if (field === 'duration') {
      // Validation cho trường duration - chỉ cho phép số nguyên dương
      if (value !== '' && (!/^\d+$/.test(value) || parseInt(value) <= 0)) {
        fieldError = 'Thời lượng chỉ được nhập số nguyên dương lớn hơn 0 (ví dụ: 40).'
      }
    }
    
    if (field === 'title' && !value.trim()) {
      fieldError = 'Vui lòng nhập tên khóa học.'
    }
    
    if (field === 'description' && !value.trim()) {
      fieldError = 'Vui lòng nhập mô tả khóa học.'
    }
    
    if (field === 'level' && !value) {
      fieldError = 'Vui lòng chọn trình độ khóa học.'
    }
    
    // Cập nhật field error
    setFieldErrors(prev => ({ ...prev, [field]: fieldError }))
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    // Kiểm tra kích thước file (8MB limit)
    if (file.size > 8 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 8MB')
      showToast("error", "Kích thước file không được vượt quá 8MB")
      return
    }

    // Kiểm tra loại file
    if (file && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/gif")) {
      setError(null) // Clear any previous errors
      setSelectedFile(file)
      const imageUrl = URL.createObjectURL(file)
      setFormData(prev => ({ ...prev, image: imageUrl }))
    } else {
      setError('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF)')
      showToast("error", "Vui lòng chọn file ảnh (JPG, PNG, GIF)")
    }
  }, [showToast])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const firstFile = e.dataTransfer.files?.[0]
    if (firstFile) {
      handleFileSelect(firstFile)
    }
  }, [handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const firstFile = e.target.files?.[0]
    if (firstFile) {
      handleFileSelect(firstFile)
    }
  }, [handleFileSelect])

  const handleRemoveImage = useCallback(() => {
    setFormData(prev => ({ ...prev, image: '' }))
    setSelectedFile(null)
    setError(null) // Clear any image-related errors
  }, [])

  // Helper function to extract object name from signed URL
  const extractImageObjectName = (imageUrl: string): string | null => {
    if (!imageUrl) return null
    
    // If it's a blob URL (for new uploads), return as is
    if (imageUrl.startsWith('blob:')) return imageUrl
    
    // Extract object name from signed URL
    // Example: https://s3.amazonaws.com/bucket/course_image_xxx?signature -> course_image_xxx
    const match = imageUrl.match(/course_image_[a-f0-9-]{36}/)
    const extracted = match ? match[0] : null
    
    console.log('🔍 Image URL processing:', {
      originalUrl: imageUrl,
      extractedObjectName: extracted,
      isBlob: imageUrl.startsWith('blob:'),
      matchFound: !!match
    })
    
    return extracted
  }

  const handleBack = useCallback(() => {
    if (course) {
      navigate(`/staff/courses/${course.id}`, { 
        state: { course } 
      })
    } else {
      navigate('/staff/courses')
    }
  }, [course, navigate])

  const getDragZoneClass = () => {
    if (dragActive) {
      return "border-blue-500 bg-blue-50"
    } else if (selectedFile || formData.image) {
      return "border-green-300 bg-green-50"
    } else {
      return "border-blue-300 hover:border-blue-400"
    }
  }

  const uploadCourseImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/courses/upload', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'multipart/form-data',
        }
      })

      if (response.data.success && response.data.data) {
        return response.data.data // Trả về course_image_ce85e137-274b-4b3e-b5cc-6db37e2d8d5c
      } else {
        throw new Error(response.data.message || 'Upload ảnh thất bại')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message)
        }
      }
      throw new Error('Upload ảnh thất bại')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear field errors trước khi validate
    setFieldErrors({
      id: '',
      title: '',
      description: '',
      duration: '',
      level: '',
      requirement: ''
    })
    
    // Validate tất cả các trường và thu thập lỗi
    const errors: {[key: string]: string} = {}
    
    if (!formData.id.trim()) {
      errors.id = 'Vui lòng nhập mã khóa học.'
    } else if (!/^[A-Za-z0-9_-]+$/.test(formData.id.trim())) {
      errors.id = 'Mã khóa học chỉ được chứa chữ, số, dấu gạch ngang (-) hoặc underscore (_), không được chứa dấu cách hoặc ký tự đặc biệt.'
    }
    
    if (!formData.title.trim()) {
      errors.title = 'Vui lòng nhập tên khóa học.'
    } else if (formData.title.trim().length > 255) {
      errors.title = 'Tên khóa học không được vượt quá 255 ký tự.'
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Vui lòng nhập mô tả khóa học.'
    } else if (formData.description.trim().length > 255) {
      errors.description = 'Mô tả khóa học không được vượt quá 255 ký tự.'
    }
    
    if (!formData.duration.trim()) {
      errors.duration = 'Vui lòng nhập thời lượng khóa học.'
    } else if (!/^\d+$/.test(formData.duration) || parseInt(formData.duration) <= 0) {
      errors.duration = 'Thời lượng chỉ được nhập số nguyên dương lớn hơn 0.'
    }
    
    if (!formData.level.trim()) {
      errors.level = 'Vui lòng chọn trình độ khóa học.'
    }

    if (formData.requirement.trim().length > 255) {
      errors.requirement = 'Yêu cầu đầu vào không được vượt quá 255 ký tự.'
    }

    if (!courseId) {
      errors.courseId = 'ID khóa học không hợp lệ.'
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
      let imageUrl = formData.image

      // Upload ảnh mới nếu người dùng đã chọn file (không hiển thị toast)
      if (selectedFile) {
        try {
          imageUrl = await uploadCourseImage(selectedFile)
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : 'Có lỗi xảy ra khi tải ảnh lên'
          setError(`Lỗi tải ảnh: ${uploadErrorMessage}`)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
      }

      // Extract object name from image URL for database storage
      const imageObjectName = extractImageObjectName(imageUrl)

      const topicIds = course?.topics.map(topic => topic.id.toString()) || [];

      const updateData: UpdateCourseRequest = {
        id: course?.id || formData.id.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: parseInt(formData.duration),
        level: formData.level,
        image: imageObjectName || '',
        requirement: formData.requirement.trim() || '',
        status: course?.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        prerequisiteCourseId: formData.prerequisiteCourseId.trim() || null,
        topicIds: topicIds
      }

      console.log('📤 Update course payload:', updateData)

      const response = await StaffCourseService.updateCourse(courseId!, updateData)
      
      if (response.success && response.data) {
        // Navigate back to course detail with updated data and success message
        navigate(`/staff/courses/${courseId}`, {
          replace: true,
          state: { 
            course: response.data,
            message: 'Cập nhật khóa học thành công!',
            refreshData: true,
            timestamp: Date.now()
          }
        })
      } else {
        const message = response.message || 'Cập nhật khóa học thất bại'
        setError(message)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error: unknown) {
      console.error('Error updating course:', error)
      let errorMessage = 'Có lỗi xảy ra khi cập nhật khóa học. Vui lòng thử lại.'
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number
            data?: { message?: string; errors?: any }
          }
          message?: string
        }
        
        console.log('🔍 Full error details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message
        })
        
        if (axiosError.response?.status === 400) {
          const errorData = axiosError.response.data
          if (errorData?.message) {
            // Phân tích và tạo thông báo lỗi chi tiết hơn
            if (errorData.message.includes('duplicate') || errorData.message.includes('đã tồn tại')) {
              errorMessage = `Mã khóa học "${formData.id}" đã tồn tại. Vui lòng sử dụng mã khác.`
            } else if (errorData.message.includes('duration') || errorData.message.includes('thời lượng')) {
              errorMessage = `Lỗi thời lượng: ${errorData.message}`
            } else if (errorData.message.includes('level') || errorData.message.includes('trình độ')) {
              errorMessage = `Lỗi trình độ: ${errorData.message}`
            } else if (errorData.message.includes('title') || errorData.message.includes('tiêu đề')) {
              errorMessage = `Lỗi tiêu đề: ${errorData.message}`
            } else if (errorData.message.includes('description') || errorData.message.includes('mô tả')) {
              errorMessage = `Lỗi mô tả: ${errorData.message}`
            } else if (errorData.message.includes('image') || errorData.message.includes('ảnh')) {
              errorMessage = `Lỗi ảnh: ${errorData.message}`
            } else if (errorData.message.includes('prerequisite') || errorData.message.includes('tiên quyết')) {
              errorMessage = `Lỗi khóa học tiên quyết: ${errorData.message}`
            } else {
              errorMessage = `Lỗi validation: ${errorData.message}`
            }
          } else if (errorData?.errors) {
            errorMessage = `Lỗi validation: ${JSON.stringify(errorData.errors)}`
          } else {
            errorMessage = 'Lỗi validation: Dữ liệu không hợp lệ'
          }
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'Bạn không có quyền cập nhật khóa học này. Vui lòng kiểm tra lại quyền tài khoản.'
        } else if (axiosError.response?.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'Không tìm thấy khóa học. Vui lòng kiểm tra lại.'
        } else if (axiosError.response?.status === 413) {
          errorMessage = 'File ảnh quá lớn. Vui lòng chọn file dưới 8MB.'
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        } else if (axiosError.message) {
          errorMessage = axiosError.message
        }
      }
      setError(errorMessage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.title.trim() && 
                     formData.description.trim() && 
                     formData.duration.trim() && 
                     formData.level.trim()

  if (isLoading && !course) {
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
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <h3 className="font-semibold">Lỗi tải dữ liệu</h3>
              <p className="text-sm mt-1">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={fetchCourseData} size="sm">
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
            <p className="text-xl text-gray-600">Không tìm thấy thông tin khóa học</p>
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
                <h1 className="text-2xl font-bold text-blue-900 mb-1">Chỉnh sửa khóa học</h1>
                <p className="text-blue-600 text-sm font-medium">Cập nhật thông tin khóa học</p>
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

                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-700 font-medium text-xs">THỜI LƯỢNG</span>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-purple-600" />
                          <span className="text-lg font-bold text-purple-800">{course.duration}</span>
                          <span className="text-purple-600 text-xs">giờ</span>
                        </div>
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
                        <p className="text-amber-800 text-sm font-medium mb-1">Lưu ý khi chỉnh sửa</p>
                        <ul className="text-amber-700 text-xs leading-relaxed list-disc ml-4 space-y-1">
                          <li>Mã khóa học (ID) không thể thay đổi sau khi tạo</li>
                          <li>Thay đổi sẽ được lưu với trạng thái INACTIVE</li>
                          <li>Khóa học cần được phê duyệt lại sau khi chỉnh sửa</li>
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
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <BookOpen className="h-6 w-6" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Course ID - Read only */}
                      <div className="space-y-3">
                        <Label htmlFor="courseId" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                          Mã khóa học
                          <div className="bg-blue-100 p-1 rounded-full">
                            <BookOpen className="h-3 w-3 text-blue-600" />
                          </div>
                        </Label>
                        <Input
                          id="courseId"
                          value={formData.id}
                          className="border-blue-300 bg-gray-100 text-gray-600 cursor-not-allowed text-base py-3"
                          readOnly
                        />
                        <p className="text-amber-600 text-xs mt-1">
                          ⚠️ Mã khóa học không thể thay đổi sau khi tạo
                        </p>
                      </div>

                      {/* Level */}
                      <div className="space-y-3">
                        <Label htmlFor="level" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                          Mức độ <span className="text-red-500">*</span>
                          <div className="bg-green-100 p-1 rounded-full">
                            <BookOpen className="h-3 w-3 text-green-600" />
                          </div>
                        </Label>
                        <select
                          id="level"
                          value={formData.level}
                          onChange={(e) => handleInputChange("level", e.target.value)}
                          className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 bg-white/80 backdrop-blur-sm text-base ${
                            fieldErrors.level 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                              : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                          required
                        >
                          <option value="">Chọn mức độ</option>
                          {levels.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.level && (
                          <p className="text-red-600 text-xs mt-1">
                            ⚠️ {fieldErrors.level}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Course Title */}
                    <div className="space-y-3 mt-6">
                      <Label htmlFor="title" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Tiêu đề khóa học <span className="text-red-500">*</span>
                        <div className="bg-blue-100 p-1 rounded-full">
                          <BookOpen className="h-3 w-3 text-blue-600" />
                        </div>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Ví dụ: Kana Basics"
                        className={`text-base py-3 bg-white/80 backdrop-blur-sm ${
                          fieldErrors.title 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        maxLength={255}
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

                    {/* Course Description */}
                    <div className="space-y-3 mt-6">
                      <Label htmlFor="description" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Mô tả khóa học <span className="text-red-500">*</span>
                        <div className="bg-blue-100 p-1 rounded-full">
                          <Info className="h-3 w-3 text-blue-600" />
                        </div>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Mô tả chi tiết về nội dung, mục tiêu và đối tượng học viên của khóa học..."
                        rows={4}
                        className={`resize-none text-base bg-white/80 backdrop-blur-sm ${
                          fieldErrors.description 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        maxLength={255}
                        required
                      />
                      {fieldErrors.description ? (
                        <p className="text-red-600 text-xs mt-1">
                          ⚠️ {fieldErrors.description}
                        </p>
                      ) : (
                        <p className={`text-xs mt-1 ${formData.description.length > 200 ? 'text-red-600' : 'text-gray-500'}`}>
                          {formData.description.length}/255 ký tự
                        </p>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="space-y-3 mt-6">
                      <Label htmlFor="duration" className="text-blue-800 font-semibold text-base flex items-center gap-2">
                        Thời lượng (giờ) <span className="text-red-500">*</span>
                        <div className="bg-purple-100 p-1 rounded-full">
                          <BookOpen className="h-3 w-3 text-purple-600" />
                        </div>
                      </Label>
                      <Input
                        id="duration"
                        type="text"
                        value={formData.duration}
                        onChange={(e) => handleInputChange("duration", e.target.value)}
                        placeholder="Ví dụ: 40"
                        className={`text-base py-3 bg-white/80 backdrop-blur-sm ${
                          fieldErrors.duration 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        required
                      />
                      {fieldErrors.duration ? (
                        <p className="text-red-600 text-xs mt-1">
                          ⚠️ {fieldErrors.duration}
                        </p>
                      ) : (
                        <p className="text-blue-600 text-xs mt-1">
                          💡 Chỉ được nhập số nguyên dương (ví dụ: 40, 60, 80)
                        </p>
                      )}
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
                    {/* Requirement */}
                    <div className="space-y-3">
                      <Label htmlFor="requirement" className="text-blue-800 font-semibold text-base">
                        Yêu cầu đầu vào
                      </Label>
                      <Textarea
                        id="requirement"
                        value={formData.requirement}
                        onChange={(e) => handleInputChange("requirement", e.target.value)}
                        placeholder="Nhập yêu cầu đầu vào cho khóa học (nếu có)"
                        rows={2}
                        className={`resize-none text-base bg-white/80 backdrop-blur-sm ${
                          fieldErrors.requirement 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-blue-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        maxLength={255}
                      />
                      {fieldErrors.requirement ? (
                        <p className="text-red-600 text-xs mt-1">
                          ⚠️ {fieldErrors.requirement}
                        </p>
                      ) : (
                        <p className={`text-xs mt-1 ${formData.requirement.length > 200 ? 'text-red-600' : 'text-gray-500'}`}>
                          {formData.requirement.length}/255 ký tự
                        </p>
                      )}
                    </div>

                    {/* Prerequisite Course - SearchableSelect */}
                    <div className="space-y-3 mt-6 relative z-50">
                      <Label htmlFor="prerequisite" className="text-blue-800 font-semibold text-base">
                        Khóa học tiên quyết
                      </Label>
                      <SearchableSelect
                        value={formData.prerequisiteCourseId}
                        onChange={(value) => handleInputChange("prerequisiteCourseId", value)}
                        options={availableCourses.map(course => ({
                          id: course.id,
                          title: course.title,
                          subtitle: `Trình độ: ${course.level} • Thời lượng: ${course.duration}h`
                        }))}
                        placeholder="Chọn hoặc tìm kiếm khóa học tiên quyết..."
                        emptyText="Không có khóa học tiên quyết"
                        className="bg-white"
                      />
                      <p className="text-blue-600 text-xs mt-1">
                        💡 Chọn khóa học mà học viên cần hoàn thành trước khi học khóa này
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Image */}
                <Card className="shadow-xl border-0 bg-white/90">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Upload className="h-6 w-6" />
                      Ảnh khóa học
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <button
                      type="button"
                      className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors bg-transparent ${getDragZoneClass()}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      {selectedFile || formData.image ? (
                        <div className="space-y-4">
                          <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden border border-blue-200">
                            <img
                              src={selectedFile ? formData.image : (course.image || '')}
                              alt="Course preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {selectedFile && (
                            <div>
                              <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                              <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage()
                            }}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Xóa ảnh
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 text-blue-400 mx-auto" />
                          <div>
                            <p className="text-sm font-medium text-blue-700">Tải lên ảnh khóa học</p>
                            <p className="text-xs text-blue-500 mt-1">PNG, JPG, GIF tối đa 800KB</p>
                          </div>
                          <div className="flex items-center justify-center">
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">Chọn file</span>
                              <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileInputChange}
                              />
                            </label>
                            <span className="text-sm text-blue-500 mx-2">hoặc kéo thả vào đây</span>
                          </div>
                        </div>
                      )}
                    </button>
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

export default StaffUpdateCoursePage
