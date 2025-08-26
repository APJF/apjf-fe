import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { AlertCircle, ArrowLeft, Upload } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Textarea } from '../../components/ui/Textarea'
import { StaffNavigation } from '../../components/layout/StaffNavigation'
import { CourseService } from '../../services/courseService'
import { StaffCourseService, type Course } from '../../services/staffCourseService'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import type { CreateCourseRequest } from '../../types/course'
import { useAuth } from '../../hooks/useAuth'
import api from '../../api/axios'

const StaffCreateCoursePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    duration: '',
    level: '',
    image: '',
    requirement: '',
    prerequisiteCourseId: ''
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({
    id: '',
    title: '',
    description: '',
    duration: '',
    level: '',
    requirement: ''
  })

  // Kiểm tra quyền tạo course
  useEffect(() => {
    if (!user) {
      setError('Vui lòng đăng nhập để tiếp tục')
      return
    }
    
    const hasStaffRole = user.roles?.some(role => 
      ['ROLE_STAFF', 'ROLE_ADMIN', 'ROLE_MANAGER'].includes(role)
    )
    
    console.log('🔐 User Permission Check:', {
      userId: user.id,
      username: user.username,
      roles: user.roles,
      hasStaffRole: hasStaffRole
    })
    
    if (!hasStaffRole) {
      setError('Bạn không có quyền tạo khóa học. Cần role STAFF hoặc ADMIN.')
    }
  }, [user])

  // Fetch available courses for prerequisite selection
  useEffect(() => {
    const fetchAvailableCourses = async () => {
      try {
        const response = await StaffCourseService.getAllCoursesForSelection()
        if (response.success && response.data) {
          setAvailableCourses(response.data)
        }
      } catch (err) {
        console.error('Error fetching available courses:', err)
      }
    }

    fetchAvailableCourses()
  }, [])

  const levels = [
    { value: 'N5', label: 'N5' },
    { value: 'N4', label: 'N4' },
    { value: 'N3', label: 'N3' },
    { value: 'N2', label: 'N2' },
    { value: 'N1', label: 'N1' }
  ]

  const handleInputChange = (field: string, value: string) => {
    // Luôn cập nhật giá trị trước
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear main error khi user đang typing
    setError(null)
    
    // Validation cho từng trường và set field error
    let fieldError = ''
    
    if (field === 'id') {
      // Loại bỏ dấu cách ở đầu và cuối, nhưng không cho phép dấu cách ở giữa
      const trimmedValue = value.trim()
      if (value !== trimmedValue || value.includes(' ')) {
        fieldError = 'Mã khóa học không được chứa dấu cách. Vui lòng sử dụng dấu gạch ngang (-) hoặc underscore (_) thay thế.'
      } else if (value && !/^[A-Za-z0-9_-]+$/.test(value)) {
        fieldError = 'Mã khóa học chỉ được chứa chữ, số, dấu gạch ngang (-) hoặc underscore (_).'
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
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileSelect = (file: File) => {
    // Kiểm tra kích thước file (8MB limit)
    if (file.size > 8 * 1024 * 1024) {
      setError('Kích thước file không được vượt quá 8MB')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh hợp lệ')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setError(null)
    setSelectedFile(file)

    // Preview image for UI
    const reader = new FileReader()
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, image: e.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }))
    setSelectedFile(null)
  }

  const handleBack = () => {
    navigate('/staff/courses')
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
        return response.data.data // Trả về course_image_6ddd7d93-785a-4307-949e-81d1c184c0ca
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

  const isFormValid = formData.id.trim() &&
                     formData.title.trim() && 
                     formData.description.trim() && 
                     formData.duration.trim() && 
                     formData.level

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
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Vui lòng nhập mô tả khóa học.'
    }
    
    if (!formData.duration.trim()) {
      errors.duration = 'Vui lòng nhập thời lượng khóa học.'
    } else if (!/^\d+$/.test(formData.duration.trim()) || parseInt(formData.duration.trim()) <= 0) {
      errors.duration = 'Thời lượng chỉ được nhập số nguyên dương lớn hơn 0 (ví dụ: 40).'
    }
    
    if (!formData.level) {
      errors.level = 'Vui lòng chọn trình độ khóa học.'
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
      let imageFilename = ''

      // Upload ảnh trước nếu có file được chọn
      if (selectedFile) {
        try {
          imageFilename = await uploadCourseImage(selectedFile)
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : 'Có lỗi xảy ra khi tải ảnh lên'
          setError(`Lỗi tải ảnh: ${uploadErrorMessage}`)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
      }

      const courseData: CreateCourseRequest = {
        id: formData.id.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: parseInt(formData.duration) || 0,
        level: formData.level,
        image: imageFilename || '',
        requirement: formData.requirement.trim() || '',
        status: 'INACTIVE',
        prerequisiteCourseId: formData.prerequisiteCourseId || '',
        topicIds: [],
        examIds: []
      }

      await CourseService.createCourse(courseData)
      
      navigate('/staff/courses', { 
        replace: true,
        state: { 
          message: 'Tạo khóa học thành công!',
          refreshData: true,
          timestamp: Date.now() // Force refresh
        }
      })
    } catch (error) {
      // Xử lý error chi tiết từ server
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number, data?: any } }
        if (axiosError.response?.status === 400 && axiosError.response?.data) {
          // Hiển thị chi tiết lỗi từ backend nếu có
          if (axiosError.response.data.errors) {
            // Nếu backend trả về mảng lỗi
            setError(axiosError.response.data.errors.map((err: any) => err.message).join(' | '))
          } else if (axiosError.response.data.message) {
            setError(`Lỗi dữ liệu: ${axiosError.response.data.message}`)
          } else {
            setError('Dữ liệu không hợp lệ')
          }
        } else if (axiosError.response?.status === 403) {
          setError('Bạn không có quyền tạo khóa học. Vui lòng kiểm tra lại quyền tài khoản.')
        } else if (axiosError.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        } else {
          setError('Có lỗi xảy ra khi tạo khóa học. Vui lòng thử lại.')
        }
      } else {
        setError('Có lỗi xảy ra khi tạo khóa học. Vui lòng thử lại.')
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <StaffNavigation>
      <div className="p-4 max-w-4xl mx-auto">
        {/* Header - Compact */}
        <div className="mb-4">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Tạo khóa học mới</h1>
          <p className="text-gray-600 text-sm">Tạo khóa học mới cho hệ thống học tập</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">{error}</div>
          </Alert>
        )}

        {/* Main Form - Compact */}
        <Card className="shadow-md border bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg py-4">
            <CardTitle className="text-lg font-semibold">Thông tin khóa học</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information - 2 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="id" className="text-sm font-medium">
                    Mã khóa học <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="id"
                    placeholder="Nhập mã khóa học (VD: JPD113)"
                    value={formData.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    className={`h-9 ${fieldErrors.id ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    maxLength={40}
                    required
                  />
                  {fieldErrors.id ? (
                    <p className="text-red-600 text-xs mt-1">
                      ⚠️ {fieldErrors.id}
                    </p>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="text-blue-600 text-xs mt-1">
                        💡 Mã khóa học không được chứa dấu cách. Sử dụng dấu gạch ngang (-) hoặc underscore (_)
                      </p>
                      <p className={`text-xs mt-1 ${formData.id.length > 32 ? 'text-red-600' : 'text-gray-500'}`}>
                        {formData.id.length}/40 ký tự
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Tên khóa học <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Nhập tên khóa học"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`h-9 ${fieldErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
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

                <div className="space-y-1">
                  <Label htmlFor="duration" className="text-sm font-medium">
                    Thời lượng <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration"
                    placeholder="VD: 40 giờ"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className={`h-9 ${fieldErrors.duration ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    required
                  />
                  {fieldErrors.duration && (
                    <p className="text-red-600 text-xs mt-1">
                      ⚠️ {fieldErrors.duration}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="level" className="text-sm font-medium">
                    Trình độ <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className={`w-full h-9 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.level ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    required
                  >
                    <option value="">Chọn trình độ</option>
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

                <div className="space-y-1">
                  <Label htmlFor="prerequisite" className="text-sm font-medium">
                    Khóa học tiên quyết
                  </Label>
                  <div className="relative z-50">
                    <SearchableSelect
                      value={formData.prerequisiteCourseId}
                      onChange={(value) => handleInputChange('prerequisiteCourseId', value)}
                      options={availableCourses.map(course => ({
                        id: course.id,
                        title: course.title,
                        subtitle: `Trình độ: ${course.level} • Thời lượng: ${course.duration}h`
                      }))}
                      placeholder="Chọn hoặc tìm kiếm khóa học tiên quyết..."
                      emptyText="Không có khóa học tiên quyết"
                      className="bg-white h-9"
                    />
                  </div>
                  <p className="text-blue-600 text-xs mt-5">
                    💡 Chọn khóa học mà học viên cần hoàn thành trước khi học khóa này
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label htmlFor="description" className="text-sm font-medium">
                  Mô tả khóa học <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết về khóa học"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`h-20 resize-none focus:border-black focus:ring-black ${fieldErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
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

              {/* Requirement */}
              <div className="space-y-1">
                <Label htmlFor="requirement" className="text-sm font-medium">
                  Yêu cầu đầu vào
                </Label>
                <Textarea
                  id="requirement"
                  placeholder="Nhập yêu cầu đầu vào cho khóa học (không bắt buộc)"
                  value={formData.requirement}
                  onChange={(e) => handleInputChange('requirement', e.target.value)}
                  className="h-16 resize-none focus:border-black focus:ring-black"
                  maxLength={255}
                />
                <p className={`text-xs mt-1 ${formData.requirement.length > 200 ? 'text-red-600' : 'text-gray-500'}`}>
                  {formData.requirement.length}/255 ký tự
                </p>
              </div>

              {/* Image Upload - Compact */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ảnh khóa học</Label>
                <button
                  type="button"
                  className={`relative w-full h-32 border-2 border-dashed rounded-lg transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDrag}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {formData.image ? (
                    <div className="relative h-full">
                      <img
                        src={formData.image}
                        alt="Course preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveImage()
                        }}
                        className="absolute top-1 right-1 h-6 px-2 text-xs"
                      >
                        Xóa
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-2">
                      <Upload className="h-8 w-8 text-blue-400" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-blue-700">Tải lên ảnh</p>
                        <p className="text-xs text-blue-500">PNG, JPG (max 800KB)</p>
                      </div>
                      <div className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Chọn file hoặc kéo thả
                      </div>
                    </div>
                  )}
                </button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileInputChange}
                />
              </div>

              {/* Action Buttons - Compact */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="px-4 py-2 h-9"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className="px-6 py-2 h-9 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Đang tạo...' : 'Tạo khóa học'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </StaffNavigation>
  )
}

export default StaffCreateCoursePage
