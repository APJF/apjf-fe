import { useState } from 'react'
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
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card"
import { Badge } from "../components/ui/Badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/Collapsible"
import AudioPlayer from "../components/chapter/AudioPlayer"
import PDFViewer from "../components/chapter/PDFViewer"
import ScriptViewer from "../components/chapter/ScriptViewer"

// Types
interface Unit {
  id: string
  title: string
  completed: boolean
  materials: Material[]
}

interface Material {
  id: string
  title: string
  type: 'vocabulary' | 'reading' | 'kanji' | 'listening'
  format: 'pdf' | 'audio'
}

interface ChapterData {
  id: string
  title: string
  description: string
  level: string
  totalUnits: number
  completedUnits: number
  progress: number
}

// Constants
const materialTypeColors = {
  vocabulary: "bg-blue-50 text-blue-700 border-blue-200",
  reading: "bg-green-50 text-green-700 border-green-200",
  kanji: "bg-purple-50 text-purple-700 border-purple-200",
  listening: "bg-orange-50 text-orange-700 border-orange-200",
}

const materialIconColors = {
  vocabulary: "text-blue-600",
  reading: "text-green-600",
  kanji: "text-purple-600",
  listening: "text-orange-600",
}

const materialTypeIcons = {
  vocabulary: FileText,
  reading: BookOpen,
  kanji: Languages,
  listening: Headphones,
}

export default function ChapterDetailPage() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  
  // Mock data - replace with API calls
  const [chapterData] = useState<ChapterData>({
    id: chapterId || "chapter-1",
    title: "第一章：自己紹介",
    description: "Học cách giới thiệu bản thân trong tiếng Nhật",
    level: "N5",
    totalUnits: 5,
    completedUnits: 2,
    progress: 40,
  })

  const [unitsData] = useState<Unit[]>([
    {
      id: "unit-1",
      title: "基本的な挨拶と自己紹介の表現",
      completed: true,
      materials: [
        { id: "mat-1", title: "挨拶の語彙", type: "vocabulary", format: "pdf" },
        { id: "mat-2", title: "自己紹介の読み物", type: "reading", format: "pdf" },
        { id: "mat-3", title: "基本漢字", type: "kanji", format: "pdf" },
        { id: "mat-4", title: "挨拶の聞き取り", type: "listening", format: "audio" },
      ],
    },
    {
      id: "unit-2",
      title: "個人情報と趣味について話す",
      completed: true,
      materials: [
        { id: "mat-5", title: "個人情報の語彙", type: "vocabulary", format: "pdf" },
        { id: "mat-6", title: "自己紹介の聞き取り", type: "listening", format: "audio" },
      ],
    },
    {
      id: "unit-3",
      title: "職業と趣味の詳しい説明をする方法",
      completed: false,
      materials: [
        { id: "mat-7", title: "趣味の語彙", type: "vocabulary", format: "pdf" },
        { id: "mat-8", title: "職業の漢字", type: "kanji", format: "pdf" },
        { id: "mat-9", title: "趣味について話す", type: "listening", format: "audio" },
      ],
    },
    {
      id: "unit-4",
      title: "家族と友達について話す",
      completed: false,
      materials: [
        { id: "mat-10", title: "家族の語彙", type: "vocabulary", format: "pdf" },
        { id: "mat-11", title: "友達の漢字", type: "kanji", format: "pdf" },
      ],
    },
    {
      id: "unit-5",
      title: "日常生活について話す",
      completed: false,
      materials: [
        { id: "mat-12", title: "日常の語彙", type: "vocabulary", format: "pdf" },
        { id: "mat-13", title: "生活の読み物", type: "reading", format: "pdf" },
      ],
    },
  ])

  const [selectedMaterial, setSelectedMaterial] = useState<Material>(unitsData[0].materials[0])
  const [openUnits, setOpenUnits] = useState<string[]>(["unit-1"])

  const toggleUnit = (unitId: string) => {
    setOpenUnits((prev) => (prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]))
  }

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material)
  }

  const getNextMaterial = () => {
    const allMaterials = unitsData.flatMap((unit) => unit.materials)
    const currentIndex = allMaterials.findIndex((mat) => mat.id === selectedMaterial.id)
    return currentIndex < allMaterials.length - 1 ? allMaterials[currentIndex + 1] : null
  }

  const getPrevMaterial = () => {
    const allMaterials = unitsData.flatMap((unit) => unit.materials)
    const currentIndex = allMaterials.findIndex((mat) => mat.id === selectedMaterial.id)
    return currentIndex > 0 ? allMaterials[currentIndex - 1] : null
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-3">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <Link to="/" className="hover:text-gray-800 cursor-pointer transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/courses" className="hover:text-gray-800 cursor-pointer transition-colors">Khóa học</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/courses/${courseId}`} className="hover:text-gray-800 cursor-pointer transition-colors">Khóa học N5</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-800 font-medium">{chapterData.title}</span>
        </nav>

        {/* Chapter Header */}
        <Card className="border-gray-200 shadow-md bg-gradient-to-r from-white via-blue-50 to-white mb-6">
          <CardHeader className="text-center py-4">
            <CardTitle className="text-2xl font-bold text-blue-700">{chapterData.title}</CardTitle>
            <p className="text-gray-600 text-base mt-2">{chapterData.description}</p>
          </CardHeader>
          <CardContent className="py-3">
            <div className="flex items-center justify-center space-x-10 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{chapterData.completedUnits}</div>
                <div className="text-sm text-gray-500">Hoàn thành</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-400">{chapterData.totalUnits}</div>
                <div className="text-sm text-gray-500">Tổng số</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{chapterData.progress}%</div>
                <div className="text-sm text-gray-500">Tiến độ</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${chapterData.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Content - Material Viewer (8/12) */}
          <div className="col-span-8">
            <Card className="border-gray-200 shadow-sm min-h-[600px]">
              <CardHeader className="py-3 px-4">
                {/* Navigation Header */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const prev = getPrevMaterial()
                      if (prev) setSelectedMaterial(prev)
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
                      if (next) setSelectedMaterial(next)
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
                {selectedMaterial.format === "pdf" ? (
                  <PDFViewer materialId={selectedMaterial.id} />
                ) : (
                  <div className="space-y-4">
                    <AudioPlayer materialId={selectedMaterial.id} />
                    <ScriptViewer materialId={selectedMaterial.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Units List (4/12) */}
          <div className="col-span-4">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="py-2 px-4">
                <div className="flex items-center">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-blue-600 rounded mr-3"></div>
                  <h3 className="text-base font-semibold text-gray-800">Danh sách Units</h3>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="max-h-[650px] overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
                  {unitsData.map((unit, index) => (
                    <div
                      key={unit.id}
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Collapsible open={openUnits.includes(unit.id)} onOpenChange={() => toggleUnit(unit.id)}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between p-4 h-auto min-h-[52px] hover:bg-gray-50 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="flex items-center space-x-3">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                                  {index + 1}
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                    unit.completed
                                      ? "bg-green-500 border-green-500"
                                      : "border-gray-300 hover:border-gray-400"
                                  }`}
                                >
                                  {unit.completed && <Check className="w-3 h-3 text-white" />}
                                </div>
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
                              {unit.materials.map((material) => {
                                const IconComponent = materialTypeIcons[material.type]
                                const isSelected = selectedMaterial.id === material.id
                                return (
                                  <Button
                                    key={material.id}
                                    variant={isSelected ? "secondary" : "ghost"}
                                    className={`w-full justify-start text-sm h-10 px-3 transition-all duration-200 ${
                                      isSelected
                                        ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200 shadow-sm"
                                        : "hover:bg-gray-50 text-gray-600"
                                    }`}
                                    onClick={() => handleMaterialSelect(material)}
                                  >
                                    <IconComponent
                                      className={`w-4 h-4 mr-2 ${materialIconColors[material.type]}`}
                                    />
                                    <span className="truncate" title={material.title}>
                                      {truncateText(material.title, 20)}
                                    </span>
                                  </Button>
                                )
                              })}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
