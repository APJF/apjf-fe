import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronRight,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Headphones,
  BookOpen,
  Languages,
  ChevronLeft,
  Clock,
  Play,
  CheckCircle,
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/Collapsible"
import { AudioPlayer } from "../../components/chapter/AudioPlayer"
import { PDFViewer } from "../../components/chapter/PDFViewer"
import { ScriptViewer } from "../../components/chapter/ScriptViewer"
import { LearningChatBox } from "../../components/chapter/LearningChatBox"
import { getChapterById, getUnitsByChapterId, getMaterialsByUnitId, getExamsByUnitId, getUnitDetail, getExamsByChapterId, type UnitExam, type ChapterExam } from '../../services/chapterDetailService'
import { getCurrentUserId } from '../../services/chatbotService'
import type { Material, MaterialType } from '../../types/material'
import { Breadcrumb, type BreadcrumbItem } from '../../components/ui/Breadcrumb'
import { useLanguage } from '../../contexts/LanguageContext'
import { useChat } from '../../hooks/useChat'
import { listenForExamCompletion, type ExamCompletionData } from '../../utils/examCompletion'

// Updated types based on API
interface ChapterDetail {
  id: string
  title: string
  description: string
  status: string
  courseId: string
  prerequisiteChapterId: string | null
  isCompleted: boolean
  percent: number
  exams: ChapterExam[]
}

interface UnitDetail {
  id: string
  title: string
  description: string
  status: string
  chapterId: string
  prerequisiteUnitId: string | null
  exams: UnitExam[]
  materials?: Material[]
  completed?: boolean // This will be determined by user progress
}

// Constants - Updated to match API MaterialType enum
const materialTypeColors: Record<MaterialType, string> = {
  KANJI: "bg-purple-50 text-purple-700 border-purple-200",
  GRAMMAR: "bg-green-50 text-green-700 border-green-200",
  VOCAB: "bg-blue-50 text-blue-700 border-blue-200",
  LISTENING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  READING: "bg-green-50 text-green-700 border-green-200",
  WRITING: "bg-red-50 text-red-700 border-red-200",
}

const materialIconColors: Record<MaterialType, string> = {
  KANJI: "text-purple-600",
  GRAMMAR: "text-green-600",
  VOCAB: "text-blue-600",
  LISTENING: "text-yellow-600",
  READING: "text-green-600",
  WRITING: "text-red-600",
}

const materialTypeIcons: Record<MaterialType, typeof FileText> = {
  KANJI: Languages,
  GRAMMAR: BookOpen,
  VOCAB: FileText,
  LISTENING: Headphones,
  READING: BookOpen,
  WRITING: FileText,
}

export default function ChapterDetailPage() {
  const { t } = useLanguage()
  const { setCurrentMaterialId } = useChat()
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  
  // State management - All hooks must be at the top
  const [chapterData, setChapterData] = useState<ChapterDetail | null>(null)
  const [unitsData, setUnitsData] = useState<UnitDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [openUnits, setOpenUnits] = useState<string[]>([])
  const [refreshingUnits, setRefreshingUnits] = useState<Set<string>>(new Set())

  // Helper function to sort units by prerequisite order
  const sortUnitsByPrerequisite = (units: UnitDetail[]): UnitDetail[] => {
    if (units.length === 0) return []
    
    const sorted: UnitDetail[] = []
    const remaining = [...units]
    const visited = new Set<string>()
    let iterations = 0
    const maxIterations = units.length * 2 // Prevent infinite loop

    while (remaining.length > 0 && iterations < maxIterations) {
      iterations++
      let foundUnits = false

      // Find units that can be placed (no prerequisite or prerequisite already sorted)
      for (let i = remaining.length - 1; i >= 0; i--) {
        const unit = remaining[i]
        
        // Check if unit can be placed
        const canPlace = !unit.prerequisiteUnitId || 
          sorted.some(sortedUnit => sortedUnit.id === unit.prerequisiteUnitId)
        
        if (canPlace && !visited.has(unit.id)) {
          sorted.push(unit)
          visited.add(unit.id)
          remaining.splice(i, 1)
          foundUnits = true
        }
      }

      // If no units can be placed, break to prevent infinite loop
      if (!foundUnits) {
        console.warn('Potential circular dependency detected, adding remaining units as-is')
        sorted.push(...remaining.filter(unit => !visited.has(unit.id)))
        break
      }
    }

    return sorted
  }
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchChapterData = async () => {
      if (!chapterId) return
      
      try {
        setLoading(true)
        setError(null)
        
        // 1. Fetch chapter details and exams
        const [chapterResponse, chapterExamsResponse] = await Promise.all([
          getChapterById(chapterId),
          getExamsByChapterId(chapterId)
        ])
        
        if (chapterResponse.success) {
          const chapter = chapterResponse.data
          setChapterData({
            id: chapter.id,
            title: chapter.title,
            description: chapter.description || '',
            status: chapter.status,
            courseId: chapter.courseId || '',
            prerequisiteChapterId: chapter.prerequisiteChapterId,
            isCompleted: chapter.isCompleted || false,
            percent: chapter.percent || 0,
            exams: chapterExamsResponse.success ? chapterExamsResponse.data : []
          })
        }
        
        // 2. Fetch units in this chapter
        const unitsResponse = await getUnitsByChapterId(chapterId)
        if (unitsResponse.success) {
          // Only show active units
          const activeUnits = (unitsResponse.data || []).filter(unit => unit.status === "ACTIVE");
          const unitsWithMaterials = await Promise.all(
            activeUnits.map(async (unit) => {
              try {
                // 3. Fetch materials, exams, and unit details for each unit
                const [materialsResponse, examsResponse, unitDetailResponse] = await Promise.all([
                  getMaterialsByUnitId(unit.id),
                  getExamsByUnitId(unit.id),
                  getUnitDetail(unit.id)
                ])
                
                return {
                  id: unit.id,
                  title: unit.title,
                  description: unit.description || '',
                  status: unit.status,
                  chapterId: unit.chapterId || chapterId,
                  prerequisiteUnitId: unit.prerequisiteUnitId,
                  exams: examsResponse.success ? examsResponse.data : [],
                  materials: materialsResponse.success ? materialsResponse.data : [],
                  completed: unitDetailResponse.success ? unitDetailResponse.data.isCompleted : false,
                }
              } catch (err) {
                console.error(`Error fetching materials/exams/details for unit ${unit.id}:`, err)
                return {
                  id: unit.id,
                  title: unit.title,
                  description: unit.description || '',
                  status: unit.status,
                  chapterId: unit.chapterId || chapterId,
                  prerequisiteUnitId: unit.prerequisiteUnitId,
                  exams: [],
                  materials: [],
                  completed: false,
                }
              }
            })
          )
          
          // Sort units by prerequisite order
          const sortedUnits = sortUnitsByPrerequisite(unitsWithMaterials)
          setUnitsData(sortedUnits)
        }
        
      } catch (err) {
        console.error('Error fetching chapter data:', err)
        setError(t('chapterDetail.cannotLoadData'))
      } finally {
        setLoading(false)
      }
    }
    
    fetchChapterData()
  }, [chapterId, t])

  // Initialize selected material when units data loads
  useEffect(() => {
    if (unitsData.length > 0 && unitsData[0].materials && unitsData[0].materials.length > 0) {
      const firstMaterial = unitsData[0].materials[0]
      setSelectedMaterial(firstMaterial)
      setCurrentMaterialId(firstMaterial.id) // Set material ID for chat context
      setOpenUnits([unitsData[0].id])
    }
  }, [unitsData, setCurrentMaterialId])

  // Refresh unit completion status
  const refreshUnitStatus = async (unitId: string) => {
    try {
      // Set loading state for this unit
      setRefreshingUnits(prev => new Set(prev).add(unitId))
      
      const unitDetailResponse = await getUnitDetail(unitId)
      if (unitDetailResponse.success) {
        setUnitsData(prev => prev.map(unit => 
          unit.id === unitId 
            ? { ...unit, completed: unitDetailResponse.data.isCompleted }
            : unit
        ))
      }
    } catch (error) {
      console.error(`Error refreshing unit ${unitId} status:`, error)
    } finally {
      // Remove loading state for this unit
      setRefreshingUnits(prev => {
        const newSet = new Set(prev)
        newSet.delete(unitId)
        return newSet
      })
    }
  }

  // Clean up material context when component unmounts
  useEffect(() => {
    return () => {
      setCurrentMaterialId(null)
    }
  }, [setCurrentMaterialId])

  // Listen for storage events to detect when exam is completed in another tab
  useEffect(() => {
    // Listen for cross-tab storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'examCompleted' && e.newValue) {
        try {
          const examData: ExamCompletionData = JSON.parse(e.newValue)
          if (examData.unitId) {
            refreshUnitStatus(examData.unitId)
          }
        } catch (error) {
          console.error('Error parsing exam completion data:', error)
        }
      }
    }

    // Listen for same-tab custom events
    const unsubscribeCustomEvent = listenForExamCompletion((data: ExamCompletionData) => {
      if (data.unitId) {
        refreshUnitStatus(data.unitId)
      }
    })

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      unsubscribeCustomEvent()
    }
  }, [refreshUnitStatus])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu chapter...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !chapterData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Không tìm thấy chapter'}</p>
          <Link to={`/courses/${courseId}`} className="text-rose-600 hover:text-rose-700">
            Quay lại khóa học
          </Link>
        </div>
      </div>
    )
  }

  const toggleUnit = (unitId: string) => {
    setOpenUnits((prev) => (prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]))
  }

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material)
    setCurrentMaterialId(material.id) // Set material ID for chat context
  }

  // Helper to get unit completion indicator class
  const getUnitCompletionClass = (unitId: string, completed?: boolean) => {
    if (refreshingUnits.has(unitId)) {
      return "border-blue-300 bg-blue-50"
    }
    if (completed) {
      return "bg-green-500 border-green-500"
    }
    return "border-gray-300 hover:border-gray-400"
  }

  // Helper to render unit completion indicator
  const renderUnitCompletionIndicator = (unitId: string, completed?: boolean) => {
    if (refreshingUnits.has(unitId)) {
      return <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
    }
    return completed && <Check className="w-3 h-3 text-white" />
  }

  // Handle exam click - open in new tab
  const handleExamClick = (examId: string) => {
    const examUrl = `/exam/${examId}/detail`
    window.open(examUrl, '_blank')
  }

  // Handle chapter exam click - open in new tab
  // const handleChapterExamClick = (examId: string) => {
  //   const examUrl = `/exam/${examId}/detail`
  //   window.open(examUrl, '_blank')
  // }

  // Calculate progress
  const completedUnits = unitsData.filter(unit => unit.completed).length
  const totalUnits = unitsData.length
  const progress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0

  const getNextMaterial = () => {
    if (!selectedMaterial) return null
    const allMaterials = unitsData.flatMap((unit) => unit.materials || []).filter(Boolean)
    const currentIndex = allMaterials.findIndex((mat) => mat?.id === selectedMaterial.id)
    return currentIndex < allMaterials.length - 1 ? allMaterials[currentIndex + 1] : null
  }

  const getPrevMaterial = () => {
    if (!selectedMaterial) return null
    const allMaterials = unitsData.flatMap((unit) => unit.materials || []).filter(Boolean)
    const currentIndex = allMaterials.findIndex((mat) => mat?.id === selectedMaterial.id)
    return currentIndex > 0 ? allMaterials[currentIndex - 1] : null
  }

  const truncateText = (text: string | undefined | null, maxLength: number) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  // Create breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Khóa học', href: '/courses' },
    { label: 'Khóa học N5', href: `/courses/${courseId}` },
    { label: chapterData.title } // Current page - no href
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-3">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Chapter Header */}
        <Card className="border-gray-200 shadow-md bg-gradient-to-r from-white via-blue-50 to-white mb-6">
          <CardHeader className="text-center py-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <CardTitle className="text-2xl font-bold text-blue-700">{chapterData.title}</CardTitle>
              {chapterData.isCompleted && (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Đã hoàn thành
                </div>
              )}
            </div>
            <p className="text-gray-600 text-base mt-2">{chapterData.description}</p>
          </CardHeader>
          <CardContent className="py-3">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{completedUnits}</div>
                <div className="text-sm text-gray-600">Hoàn thành</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-400">{totalUnits}</div>
                <div className="text-sm text-gray-600">Tổng số</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{progress}%</div>
                <div className="text-sm text-gray-600">Tiến độ</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{chapterData.exams.length}</div>
                <div className="text-sm text-gray-600">Bài kiểm tra</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${chapterData.percent || progress}%` }}
              />
            </div>
            
            {/* Chapter Exams Section */}
            {/* {chapterData.exams.length > 0 && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-800">Bài kiểm tra chương</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {chapterData.exams.map((exam) => (
                    <Button
                      key={exam.id}
                      variant="outline"
                      onClick={() => handleChapterExamClick(exam.id)}
                      className="justify-start text-sm h-auto py-3 px-4 bg-white hover:bg-orange-50 border-orange-200 hover:border-orange-300 transition-all duration-200"
                    >
                      <div className="flex items-center w-full">
                        <Play className="w-4 h-4 mr-3 text-orange-600" />
                        <div className="flex flex-col items-start flex-1">
                          <span className="font-medium text-gray-800">{exam.title}</span>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {exam.duration} phút
                            </span>
                            <span>{exam.totalQuestions} câu hỏi</span>
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                              {exam.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )} */}
          </CardContent>
        </Card>

        {/* Main Content Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Content - Material Viewer (8/12) */}
          <div className="col-span-8">
            {selectedMaterial ? (
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="py-3 px-4">
                  {/* Navigation Header */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const prev = getPrevMaterial()
                        if (prev) {
                          setSelectedMaterial(prev)
                          setCurrentMaterialId(prev.id) // Set material ID for chat context
                        }
                      }}
                      disabled={!getPrevMaterial()}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50 h-9 px-4 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Trước
                    </Button>

                    <div className="flex items-center space-x-3 flex-1 justify-center">
                      <Badge
                        className={`${materialTypeColors[selectedMaterial.type]} border text-sm px-3 py-1.5 font-medium`}
                      >
                        {selectedMaterial.type}
                      </Badge>
                      <h2 className="text-lg font-semibold text-center text-gray-800" title={selectedMaterial.title}>
                        {truncateText(selectedMaterial.title, 35)}
                      </h2>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const next = getNextMaterial()
                        if (next) {
                          setSelectedMaterial(next)
                          setCurrentMaterialId(next.id) // Set material ID for chat context
                        }
                      }}
                      disabled={!getNextMaterial()}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50 h-9 px-4 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      Tiếp
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {selectedMaterial.type === "LISTENING" ? (
                    <div className="space-y-4">
                      <AudioPlayer 
                        fileUrl={selectedMaterial.fileUrl}
                      />
                      <ScriptViewer 
                        script={selectedMaterial.script}
                        translation={selectedMaterial.translation}
                      />
                    </div>
                  ) : (
                    <div className="min-h-[900px]">
                      <PDFViewer materialId={selectedMaterial.id} fileUrl={selectedMaterial.fileUrl} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200 shadow-sm min-h-[700px]">
                <CardContent className="p-4 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p>Chọn một material để xem nội dung</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Units List (4/12) */}
          <div className="col-span-4 flex flex-col sticky" style={{top: '64px', maxHeight: 'calc(100vh - 64px)'}}>
            {/* Units List Card - Limited Height */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col" style={{height: '400px', padding: '16px'}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded mr-3"></div>
                  <h3 className="text-base font-semibold text-gray-800">Danh sách Units</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {/* <span>Đã sắp xếp theo thứ tự học</span> */}
                  {/* <div className="w-2 h-2 rounded-full bg-orange-400" title="Unit có yêu cầu tiên quyết" /> */}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                {unitsData.map((unit, index) => {
                  // Find prerequisite unit title for display
                  const prerequisiteUnit = unit.prerequisiteUnitId 
                    ? unitsData.find(u => u.id === unit.prerequisiteUnitId)
                    : null
                  
                  return (
                  <div
                    key={unit.id}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Collapsible open={openUnits.includes(unit.id)} onOpenChange={() => toggleUnit(unit.id)}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-4 h-auto min-h-[52px] hover:bg-gray-50 transition-all duration-200"
                          title={prerequisiteUnit ? `Yêu cầu hoàn thành: ${prerequisiteUnit.title}` : undefined}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                                {index + 1}
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                  getUnitCompletionClass(unit.id, unit.completed)
                                }`}
                              >
                                {renderUnitCompletionIndicator(unit.id, unit.completed)}
                              </div>
                              {/* Prerequisite indicator */}
                            </div>
                            <span className="text-sm font-medium text-left truncate text-gray-700" title={unit.title}>
                              {truncateText(unit.title, 25)}
                            </span>
                          </div>
                          {openUnits.includes(unit.id) ? (
                            <ChevronUp className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-3">
                        <div className="relative ml-4">
                          <div className="absolute left-[13px] top-[-8px] bottom-2 w-0.5 bg-gradient-to-b from-blue-300 to-blue-200"></div>
                          <div className="space-y-2 pl-6">
                            {/* Materials Section */}
                            {unit.materials && unit.materials.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  Tài liệu học tập
                                </div>
                                <div className="space-y-2">
                                  {unit.materials.map((material) => {
                                    const IconComponent = materialTypeIcons[material.type]
                                    const isSelected = selectedMaterial?.id === material.id
                                    return (
                                      <Button
                                        key={material.id}
                                        variant={isSelected ? "secondary" : "ghost"}
                                        className={`w-full justify-start text-sm h-auto py-2 px-3 transition-all duration-200 ${
                                          isSelected
                                            ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200 shadow-sm"
                                            : "hover:bg-gray-50 text-gray-600"
                                        }`}
                                        onClick={() => handleMaterialSelect(material)}
                                      >
                                        <div className="flex items-center w-full">
                                          <IconComponent
                                            className={`w-4 h-4 mr-2 flex-shrink-0 ${materialIconColors[material.type]}`}
                                          />
                                          <div className="flex flex-col items-start flex-1 min-w-0">
                                            <span className="truncate w-full text-left" title={material.title}>
                                              {truncateText(material.title, 18)}
                                            </span>
                                            <Badge 
                                              variant="outline" 
                                              className={`${materialTypeColors[material.type]} text-xs mt-1 h-5`}
                                            >
                                              {material.type}
                                            </Badge>
                                          </div>
                                        </div>
                                      </Button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Exams Section */}
                            {unit.exams && unit.exams.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Bài kiểm tra ({unit.exams.length})
                                </div>
                                <div className="space-y-2">
                                  {unit.exams.map((exam) => (
                                    <Button
                                      key={exam.id}
                                      variant="ghost"
                                      className="w-full justify-start text-sm h-auto py-2 px-3 transition-all duration-200 hover:bg-orange-50 text-gray-600 border border-orange-200 hover:border-orange-300"
                                      onClick={() => handleExamClick(exam.id)}
                                    >
                                      <div className="flex items-center w-full">
                                        <Play className="w-4 h-4 mr-2 flex-shrink-0 text-orange-600" />
                                        <div className="flex flex-col items-start flex-1 min-w-0">
                                          <span className="truncate w-full text-left font-medium" title={exam.title}>
                                            {truncateText(exam.title, 18)}
                                          </span>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs h-5">
                                              {exam.type}
                                            </Badge>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {exam.duration}p
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {exam.totalQuestions} câu
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  )
                })}
              </div>
            </div>

            {/* Learning ChatBox */}
            {selectedMaterial && (
              <div style={{height: 'calc(100vh - 400px - 64px)'}} className="flex-shrink-0 flex items-end">
                <LearningChatBox 
                  userId={getCurrentUserId() || ''} 
                  materialId={selectedMaterial.id} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
