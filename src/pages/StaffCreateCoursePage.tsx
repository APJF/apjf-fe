import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { AlertCircle, ArrowLeft, Upload } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'
import { Textarea } from '../components/ui/Textarea'
import { StaffNavigation } from '../components/layout/StaffNavigation'
import { CourseService } from '../services/courseService'
import { StaffCourseService, type Course } from '../services/staffCourseService'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import type { CreateCourseRequest } from '../types/course'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import api from '../api/axios'

const StaffCreateCoursePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

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
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.size > 800 * 1024) { // 800KB limit
      setError('Kích thước file không được vượt quá 800KB')
      return
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh hợp lệ')
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
    
    if (!isFormValid) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let imageFilename = ''

      // Upload ảnh trước nếu có file được chọn
      if (selectedFile) {
        try {
          showToast("warning", "Đang tải ảnh lên...")
          imageFilename = await uploadCourseImage(selectedFile)
          showToast("success", "Tải ảnh thành công!")
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          const uploadErrorMessage = uploadError instanceof Error ? uploadError.message : 'Có lỗi xảy ra khi tải ảnh lên'
          setError(`Lỗi tải ảnh: ${uploadErrorMessage}`)
          showToast("error", uploadErrorMessage)
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

      console.log('📤 Sending course data:', courseData)

      await CourseService.createCourse(courseData)
      
      // Navigate with force refresh to update course list
      navigate('/staff/courses', { 
        replace: true,
        state: { 
          message: 'Tạo khóa học thành công!',
          refreshData: true,
          timestamp: Date.now() // Force refresh
        }
      })
    } catch (error) {
      console.error('❌ Error creating course:', error)
      
      // Xử lý error chi tiết
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number, data?: unknown } }
        
        console.error('📥 Response error details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data
        })
        
        switch (axiosError.response?.status) {
          case 403:
            setError('Bạn không có quyền tạo khóa học. Vui lòng kiểm tra lại quyền tài khoản.')
            break
          case 401:
            setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
            break
          case 400: {
            const errorData = axiosError.response?.data as { message?: string }
            const errorMsg = errorData?.message || 'Dữ liệu không hợp lệ'
            setError(`Lỗi dữ liệu: ${errorMsg}`)
            break
          }
          default:
            setError('Có lỗi xảy ra khi tạo khóa học. Vui lòng thử lại.')
        }
      } else {
        setError('Có lỗi xảy ra khi tạo khóa học. Vui lòng thử lại.')
      }
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
                    className="h-9"
                    required
                  />
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
                    className="h-9"
                    required
                  />
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
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="level" className="text-sm font-medium">
                    Trình độ <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className="w-full h-9 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Chọn trình độ</option>
                    {levels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
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
                  className="h-20 resize-none"
                  required
                />
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
                  className="h-16 resize-none"
                />
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
