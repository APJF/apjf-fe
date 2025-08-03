import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui/Alert'
import { AlertCircle, BookOpen, ArrowLeft, FileText, ExternalLink, Music, Edit, Plus, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { StaffNavigation } from '../components/layout/StaffNavigation'
import { StaffUnitService, type UnitDetail } from '../services/staffUnitService'
import { StaffCourseService } from '../services/staffCourseService'
import { StaffChapterService } from '../services/staffChapterService'
import { MaterialService, type Material } from '../services/materialService'
import type { StaffCourseDetail, ChapterDetail } from '../types/staffCourse'

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
      // Fetch materials even if we have unit data
      fetchMaterials()
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

  const fetchUnitData = async () => {
    if (!courseId || !chapterId || !unitId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch unit detail and materials in parallel
      const [unitResponse, materialsResponse] = await Promise.all([
        StaffUnitService.getUnitDetail(unitId),
        MaterialService.getMaterialsByUnit(unitId)
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
        return 'border-yellow-300 text-yellow-700 bg-yellow-50'
      case 'REJECTED':
        return 'border-red-300 text-red-700 bg-red-50'
      case 'ACTIVE':
        return 'border-green-300 text-green-700 bg-green-50'
      default:
        return 'border-gray-300 text-gray-700 bg-gray-50'
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
                  {unit.status}
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
                <h2 className="text-2xl font-bold text-blue-900">{unit.title}</h2>
                <p className="text-blue-700 leading-relaxed">{unit.description}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Course & Chapter Info */}
            <div className="space-y-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Thông tin khóa học
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Khóa học</span>
                    <div className="text-base font-semibold text-blue-900 mt-1">{course.title}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Chương</span>
                    <div className="text-base font-semibold text-blue-900 mt-1">{chapter.title}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium text-sm">Trình độ</span>
                    <div className="text-sm text-blue-800 mt-1">{course.level}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Thao tác
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
                    Tạo Exam
                  </Button>
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
                                <div className="font-semibold text-gray-900 text-lg">
                                  {material.description}
                                </div>
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
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                          <FileText className="h-4 w-4 mr-2" />
                          Thêm tài liệu
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
