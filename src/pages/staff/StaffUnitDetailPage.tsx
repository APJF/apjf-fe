import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../../components/ui/Alert'
import { AlertCircle, BookOpen, ArrowLeft, FileText, ExternalLink, Music, Edit, Plus, CheckCircle, XCircle, Hash, Eye, Info } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { StaffNavigation } from '../../components/layout/StaffNavigation'
import { StaffUnitService, type UnitDetail } from '../../services/staffUnitService'
import { StaffCourseService } from '../../services/staffCourseService'
import { StaffChapterService } from '../../services/staffChapterService'
import { MaterialService, type Material } from '../../services/materialService'
import { StaffExamService } from '../../services/staffExamService'
import type { StaffCourseDetail, ChapterDetail } from '../../types/staffCourse'
import type { ExamSummary } from '../../types/exam'

interface LocationState {
  unit?: UnitDetail
  chapter?: ChapterDetail
  course?: StaffCourseDetail
  unitId?: string
  message?: string
  refreshData?: boolean
  timestamp?: number
}

export const StaffUnitDetailPage: React.FC = () => {
  const { courseId, chapterId, unitId } = useParams<{ 
    courseId: string; 
    chapterId: string; 
    unitId: string; 
  }>()
  const location = useLocation()
  const navigate = useNavigate()
  const locationState = location.state as LocationState || {}

  const [unit, setUnit] = useState<UnitDetail | null>(locationState.unit || null)
  const [chapter, setChapter] = useState<ChapterDetail | null>(locationState.chapter || null)
  const [course, setCourse] = useState<StaffCourseDetail | null>(locationState.course || null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [isLoading, setIsLoading] = useState(!unit || !chapter || !course)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    locationState.message || null
  )

  useEffect(() => {
    if (!courseId || !chapterId || !unitId) {
      setError("ID khóa học, chương hoặc bài học không hợp lệ")
      setIsLoading(false)
      return
    }

    if (!unit || !chapter || !course || locationState.refreshData) {
      fetchUnitData()
    } else {
      setIsLoading(false)
      // Fetch materials và exams even if we have unit data
      fetchMaterials()
      fetchExams()
    }
    
    // Clear refreshData flag after processing to prevent infinite loop
    if (locationState.refreshData) {
      locationState.refreshData = false
    }
  }, [courseId, chapterId, unitId])

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const fetchMaterials = async () => {
    if (!unitId) return

    try {
      const response = await MaterialService.getMaterialsByUnit(unitId)
      if (response.success && response.data) {
        setMaterials(response.data)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const fetchExams = async () => {
    if (!unitId) return

    try {
      const examsData = await StaffExamService.getExamsByScope('unit', unitId)
      setExams(examsData)
    } catch (error) {
      console.error('Error fetching exams:', error)
      setExams([])
    }
  }

  const fetchUnitData = async () => {
    if (!courseId || !chapterId || !unitId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch unit detail, materials, và exams in parallel
      const [unitResponse, materialsResponse, examsData] = await Promise.all([
        StaffUnitService.getUnitDetail(unitId),
        MaterialService.getMaterialsByUnit(unitId),
        StaffExamService.getExamsByScope('unit', unitId)
      ])

      if (unitResponse.success && unitResponse.data) {
        setUnit(unitResponse.data)
      } else {
        setError("Không tìm thấy thông tin bài học")
        return
      }

      if (materialsResponse.success && materialsResponse.data) {
        // Sắp xếp materials theo thứ tự đã thêm (giả sử có timestamp hoặc theo id)
        const sortedMaterials = [...materialsResponse.data].sort((a, b) => {
          // Nếu có timestamp, sắp xếp theo timestamp
          // Nếu không có, sắp xếp theo id
          if (a.id && b.id) {
            return a.id.localeCompare(b.id)
          }
          return 0
        })
        setMaterials(sortedMaterials)
      }

      // Set exams data
      setExams(examsData)

      // If we don't have course/chapter info, fetch them
      if (!course || !chapter) {        
        const [courseData, chapterData] = await Promise.all([
          StaffCourseService.getCourseDetail(courseId),
          StaffChapterService.getChapterDetail(chapterId)
        ])

        if (courseData.success) {
          const courseDetail: StaffCourseDetail = {
            ...courseData.data,
            description: courseData.data.description || '',
            requirement: courseData.data.requirement || '',
            chapters: [],
            enrollmentCount: 0,
            rating: courseData.data.averageRating || 0
          }
          setCourse(courseDetail)
        }
        
        if (chapterData.success) {
          const chapterDetail: ChapterDetail = {
            ...chapterData.data,
            description: chapterData.data.description || '',
            units: []
          }
          setChapter(chapterDetail)
        }
      }
    } catch (error) {
      console.error('Error fetching unit data:', error)
      setError("Không thể tải thông tin bài học. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToChapter = () => {
    if (course && chapter) {
      navigate(`/staff/courses/${course.id}/chapters/${chapter.id}`, {
        state: { course, chapter }
      })
    } else {
      navigate('/staff/courses')
    }
  }

  const handleEditUnit = () => {
    if (course && chapter && unit) {
      navigate(`/staff/courses/${course.id}/chapters/${chapter.id}/units/${unit.id}/edit`, {
        state: { course, chapter, unit }
      })
    }
  }

  const handleDeactivateUnit = async () => {
    if (!unitId || !unit) return

    const confirmDeactivate = window.confirm(
      `Bạn có chắc chắn muốn tạm dừng hoạt động bài học "${unit.title}"?\n\nHành động này sẽ khiến bài học không còn hiển thị cho người dùng.`
    )

    if (!confirmDeactivate) return

    try {
      setIsLoading(true)
      
      // Sử dụng API update với data hiện tại, chỉ thay đổi status thành INACTIVE
      const updateData = {
        id: unit.id,
        title: unit.title,
        description: unit.description || '',
        status: 'INACTIVE' as const,
        chapterId: unit.chapterId || chapterId || '',
        prerequisiteUnitId: unit.prerequisiteUnitId || null,
        examIds: []
      }

      const result = await StaffUnitService.updateUnit(unitId, updateData)
      
      if (result.success) {
        setSuccessMessage('Đã tạm dừng hoạt động bài học thành công!')
        // Refresh unit data to show updated status
        await fetchUnitData()
      } else {
        setError(result.message || 'Có lỗi xảy ra khi tạm dừng hoạt động bài học')
      }
    } catch (error) {
      console.error('Error deactivating unit:', error)
      setError('Có lỗi xảy ra khi tạm dừng hoạt động bài học')
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivateUnit = async () => {
    if (!unitId || !unit) return

    const confirmActivate = window.confirm(
      `Bạn có chắc chắn muốn kích hoạt lại bài học "${unit.title}"?`
    )

    if (!confirmActivate) return

    try {
      setIsLoading(true)
      
      // Sử dụng API update với data hiện tại, chỉ thay đổi status thành ACTIVE
      const updateData = {
        id: unit.id,
        title: unit.title,
        description: unit.description || '',
        status: 'ACTIVE' as const,
        chapterId: unit.chapterId || chapterId || '',
        prerequisiteUnitId: unit.prerequisiteUnitId || null,
        examIds: []
      }

      const result = await StaffUnitService.updateUnit(unitId, updateData)
      
      if (result.success) {
        setSuccessMessage('Đã kích hoạt lại bài học thành công!')
        // Refresh unit data to show updated status
        await fetchUnitData()
      } else {
        setError(result.message || 'Có lỗi xảy ra khi kích hoạt lại bài học')
      }
    } catch (error) {
      console.error('Error activating unit:', error)
      setError('Có lỗi xảy ra khi kích hoạt lại bài học')
    } finally {
      setIsLoading(false)
    }
  }

  const getMaterialIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'kanji': return <FileText className="h-5 w-5 text-indigo-600" />
      case 'grammar': return <BookOpen className="h-5 w-5 text-blue-600" />
      case 'vocab': return <FileText className="h-5 w-5 text-green-600" />
      case 'listening': return <Music className="h-5 w-5 text-purple-600" />
      case 'reading': return <FileText className="h-5 w-5 text-orange-600" />
      case 'writing': return <Edit className="h-5 w-5 text-red-600" />
      default: return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getMaterialBg = (type: string) => {
    switch (type.toLowerCase()) {
      case 'kanji': return 'bg-indigo-50 border-indigo-100'
      case 'grammar': return 'bg-blue-50 border-blue-100'
      case 'vocab': return 'bg-green-50 border-green-100'
      case 'listening': return 'bg-purple-50 border-purple-100'
      case 'reading': return 'bg-orange-50 border-orange-100'
      case 'writing': return 'bg-red-50 border-red-100'
      default: return 'bg-gray-50 border-gray-100'
    }
  }

  const getMaterialTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'kanji': return 'Kanji'
      case 'grammar': return 'Ngữ pháp'
      case 'vocab': return 'Từ vựng'
      case 'listening': return 'Nghe hiểu'
      case 'reading': return 'Đọc hiểu'
      case 'writing': return 'Viết'
      default: return type.toUpperCase()
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'INACTIVE':
        return 'border-orange-300 text-orange-700 bg-orange-50'
      case 'REJECTED':
        return 'border-red-300 text-red-700 bg-red-50'
      case 'ACTIVE':
        return 'border-green-300 text-green-700 bg-green-50'
      default:
        return 'border-gray-300 text-gray-700 bg-gray-50'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'INACTIVE':
        return 'Tạm dừng'
      case 'REJECTED':
        return 'Bị từ chối'
      case 'ACTIVE':
        return 'Đang hoạt động'
      default:
        return status
    }
  }

  const handleViewMaterial = (material: Material) => {
    if (material.fileUrl) {
      window.open(material.fileUrl, '_blank')
    }
  }

  // const handleDownloadFile = (material: Material) => {
  //   if (material.fileUrl) {
  //     try {
  //       // Tạo tên file từ description hoặc lấy từ URL
  //       const fileName = material.description || 'material'
  //       const fileExtension = material.fileUrl.split('.').pop() || ''
  //       const downloadName = fileName.includes('.') ? fileName : `${fileName}.${fileExtension}`
        
  //       // Tạo link download thực sự
  //       const link = document.createElement('a')
  //       link.href = material.fileUrl
  //       link.download = downloadName
  //       link.target = '_blank'
        
  //       // Thêm attribute để force download
  //       link.style.display = 'none'
  //       document.body.appendChild(link)
  //       link.click()
  //       document.body.removeChild(link)
  //     } catch (error) {
  //       console.error('Error downloading file:', error)
  //       // Fallback: mở trong tab mới nếu download failed
  //       window.open(material.fileUrl, '_blank')
  //     }
  //   }
  // }

  if (isLoading) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-blue-600 animate-pulse mb-4" />
            <p className="text-xl text-blue-600 font-medium">Đang tải thông tin bài học...</p>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  if (error) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <h3 className="font-semibold">Lỗi tải dữ liệu</h3>
              <p className="text-sm mt-1">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => fetchUnitData()} size="sm">
                  Thử lại
                </Button>
                <Button variant="outline" onClick={handleBackToChapter} size="sm">
                  Quay lại chương
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      </StaffNavigation>
    )
  }

  if (!unit || !chapter || !course) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">Không tìm thấy thông tin bài học</p>
            <Button onClick={handleBackToChapter} className="mt-4">
              Quay lại chương
            </Button>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  return (
    <StaffNavigation>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-6 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToChapter}
              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 p-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Trở về trang chương</span>
            </Button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <Alert className="bg-green-50 border-green-200 text-green-800 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>{successMessage}</span>
              </div>
            </Alert>
          )}

          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-blue-900">Chi tiết bài học</h1>
                <Badge variant="outline" className={getStatusBadgeClass(unit.status)}>
                  {getStatusLabel(unit.status)}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                <span>{course.title}</span>
                <span>/</span>
                <span>{chapter.title}</span>
                <span>/</span>
                <span className="text-blue-900">{unit.title}</span>
              </div>
              
              <div className="space-y-2">
                {/* <h2 className="text-2xl font-bold text-blue-900">{unit.title}</h2>
                <p className="text-blue-700 leading-relaxed">{unit.description}</p> */}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Course & Chapter Info */}
            <div className="space-y-6">
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
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
                  <div className="border-t border-blue-100 pt-6 mb-6">
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
                  </div>

                  {/* Unit Info */}
                  <div className="border-t border-purple-100 pt-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-600 font-medium text-xs">BÀI HỌC</span>
                      </div>
                      <Badge className="bg-orange-600 text-white text-xs mb-2">{unit.id}</Badge>
                    </div>

                    <div className="mb-4">
                      <div className="text-orange-600 font-medium text-xs mb-1">TÊN BÀI HỌC</div>
                      <h4 className="text-orange-900 font-bold text-sm leading-tight">{unit.title}</h4>
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

                  {/* Info Note */}
                  {/* <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200 mt-6">
                    <div className="flex items-start gap-3">
                      <div className="bg-cyan-100 p-1 rounded-full mt-0.5">
                        <Info className="h-4 w-4 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-cyan-800 text-sm font-medium mb-1">Thông tin bài học</p>
                        <p className="text-cyan-700 text-xs leading-relaxed">
                          Quản lý tài liệu học tập và bài kiểm tra cho bài học này.
                        </p>
                      </div>
                    </div>
                  </div> */}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Edit className="h-5 w-5 text-green-600" />
                    Thao tác nhanh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleEditUnit}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa bài học
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
                    onClick={() => navigate('/staff/create-exam', { 
                      state: { 
                        scope: 'unit', 
                        scopeId: unit.id, 
                        scopeName: unit.title 
                      } 
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo bài kiểm tra
                  </Button>
                  
                  {unit.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                      onClick={handleDeactivateUnit}
                      disabled={isLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {isLoading ? 'Đang xử lý...' : 'Tạm dừng hoạt động'}
                    </Button>
                  )}

                  {unit.status === 'INACTIVE' && (
                    <Button
                      variant="outline"
                      className="w-full border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                      onClick={handleActivateUnit}
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isLoading ? 'Đang xử lý...' : 'Kích hoạt lại'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content - Unit Details */}
            <div className="lg:col-span-3 space-y-6">
              {/* Unit Description */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Thông tin bài học
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Mã bài học</span>
                    <div className="text-lg font-mono font-bold text-blue-900 mt-1">{unit.id}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Tiêu đề bài học</span>
                    <div className="text-lg font-bold text-blue-900 mt-1">{unit.title}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Mô tả bài học</span>
                    <p className="text-gray-700 leading-relaxed mt-1">{unit.description}</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Bài học tiên quyết</span>
                    <div className="text-base text-blue-800 mt-1">{unit.prerequisiteUnitId || "Không có"}</div>
                  </div>
                  {unit.prerequisiteUnitId && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-medium text-yellow-800 mb-2">Yêu cầu tiên quyết:</h4>
                      <p className="text-yellow-700 text-sm">Học viên cần hoàn thành bài học {unit.prerequisiteUnitId} trước</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Unit Exams - Not implemented yet */}

              {/* Unit Materials */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Danh sách tài liệu ({materials.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {materials.length > 0 ? (
                      materials.map((material, idx) => (
                        <div 
                          key={`${material.id}-${idx}`} 
                          className={`p-4 rounded-lg border hover:shadow-md transition-all ${getMaterialBg(material.type)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
                                {getMaterialIcon(material.type)}
                              </div>
                              <div>
                                {/* Material description - commented out as API doesn't use this field */}
                                {/* <div className="font-semibold text-gray-900 text-lg">
                                  {material.description}
                                </div> */}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600 border">
                                    {getMaterialTypeLabel(material.type)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadFile(material)}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Tải xuống
                              </Button> */}
                              <Button
                                size="sm"
                                onClick={() => handleViewMaterial(material)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Xem
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 mx-auto text-green-300 mb-4" />
                        <p className="text-green-600 font-medium mb-2">Chưa có tài liệu nào</p>
                        <p className="text-sm text-green-500 mb-6">Thêm tài liệu đầu tiên cho bài học này</p>
                        <Button 
                          onClick={handleEditUnit}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Thêm tài liệu
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Unit Exams */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-purple-600" />
                      Danh sách bài kiểm tra ({exams.length})
                    </CardTitle>
                    <Button 
                      variant="outline"
                      className="text-purple-600 border-purple-300 hover:bg-purple-50"
                      onClick={() => navigate('/staff/create-exam', { 
                        state: { 
                          scope: 'unit', 
                          scopeId: unit.id, 
                          scopeName: unit.title 
                        } 
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo bài kiểm tra
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`space-y-4 ${exams.length > 4 ? 'max-h-80 overflow-y-auto pr-2' : ''}`}>
                    {exams.length > 0 ? (
                      exams.map((exam, index) => (
                        <div 
                          key={exam.id} 
                          className="p-4 bg-white rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-medium">
                                  {index + 1}
                                </div>
                                <h4 className="font-semibold text-purple-900 text-lg">{exam.title}</h4>
                                <Badge className={`${
                                  exam.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-800 border-green-300' 
                                    : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                }`}>
                                  {exam.status === 'ACTIVE' ? 'Hoạt động' : 'Chưa kích hoạt'}
                                </Badge>
                              </div>
                              <p className="text-purple-700 text-sm mb-2 ml-11">{exam.description}</p>
                              <div className="text-xs text-purple-500 ml-11 space-y-1">
                                <div>Mã bài kiểm tra: {exam.id}</div>
                                <div>Thời gian: {exam.duration} phút</div>
                                <div>Số câu hỏi: {exam.questionCount}</div>
                                <div>Độ khó: {exam.difficulty}</div>
                                <div>Điểm tối đa: {exam.totalPoints}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/staff/exams/${exam.id}`)}
                                className="text-purple-600 border-purple-300 hover:bg-purple-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Xem chi tiết
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <AlertCircle className="h-16 w-16 mx-auto text-purple-300 mb-4" />
                        <p className="text-purple-600 font-medium mb-2">Chưa có bài kiểm tra nào</p>
                        <p className="text-sm text-purple-500 mb-6">
                          Thêm bài kiểm tra đầu tiên cho bài học này
                        </p>
                        <Button 
                          onClick={() => navigate('/staff/create-exam', { 
                            state: { 
                              scope: 'unit', 
                              scopeId: unit.id, 
                              scopeName: unit.title 
                            } 
                          })}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tạo bài kiểm tra
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </StaffNavigation>
  )
}

export default StaffUnitDetailPage
