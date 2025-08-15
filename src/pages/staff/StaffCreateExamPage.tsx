import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Label } from '../../components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { UnitSelector } from '../../components/ui/UnitSelector'
import { StaffExamService } from '../../services/staffExamService'
import { UnitService, type Unit as UnitType } from '../../services/unitService'
import { QuestionService } from '../../services/questionService'
import { StaffNavigation } from '../../components/layout/StaffNavigation'
import QuestionDialog from '../../components/exam/QuestionDialog'
import { useToast } from '../../hooks/useToast'
import { FileText, BookOpen, Settings, CheckCircle, Plus, Search, Minus, Upload } from "lucide-react"
interface ExamQuestion {
  id: string
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "WRITING"
  question: string
  content: string // Thêm field content để tương thích
  scope: "KANJI" | "VOCAB" | "GRAMMAR" | "LISTENING" | "READING" | "WRITING"
  options?: Array<{
    id: string
    content: string
    isCorrect: boolean
  }>
  correctAnswer?: string
  explanation?: string
  points: number
  difficulty: "Dễ" | "Trung bình" | "Khó"
  skill: "Ngữ pháp" | "Từ vựng" | "Kanji" | "Đọc hiểu" | "Nghe"
  isNew?: boolean // Flag để đánh dấu question mới tạo
  unitIds?: string[] // Thêm field unitIds
}

interface QuestionFormData {
  id: string
  content: string
  scope: 'KANJI' | 'VOCAB' | 'GRAMMAR' | 'LISTENING' | 'READING' | 'WRITING'
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'WRITING'
  explanation: string
  fileUrl: string
  uploadedFile: File | null
  options: Array<{
    id: string
    content: string
    isCorrect: boolean
  }>
  unitIds: string[]
}

interface AvailableQuestion {
  id: string
  content: string
  scope: string
  type: string
  explanation: string
  fileUrl: string | null
  createdAt: string
  options: any[] | null
  unitIds: string[]
}

interface Unit {
  id: string
  title: string
  description: string
  status: string
  chapterId: string
  prerequisiteUnitId: string | null
}

interface ExamData {
  title: string
  description: string
  examId: string
  courseId?: string
  chapterId?: string
  unitId?: string
  scope: string
  duration: number
  type: string
  gradingMethod: string
  instructions: string
  questions: ExamQuestion[]
  status: string
}

interface ExamCreationState {
  currentStep: number
  examData: ExamData
  isSubmitting: boolean
  error: string | null
  examCreated: boolean // Thêm flag để theo dõi exam đã được tạo
}

interface LocationState {
  scope: 'course' | 'chapter' | 'unit'
  scopeId: string
  scopeName: string
}

const StaffCreateExamPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState
  const { showToast } = useToast()

  const [examState, setExamState] = useState<ExamCreationState>({
    currentStep: 1,
    examData: {
      title: '',
      description: '',
      examId: '',
      courseId: state?.scope === 'course' ? state.scopeId : undefined,
      chapterId: state?.scope === 'chapter' ? state.scopeId : undefined,
      unitId: state?.scope === 'unit' ? state.scopeId : undefined,
      scope: state?.scope || 'course',
      duration: 60,
      type: 'MULTIPLE_CHOICE',
      gradingMethod: 'MANUAL',
      instructions: '',
      questions: [],
      status: 'ACTIVE'
    },
    isSubmitting: false,
    error: null,
    examCreated: false
  })

  // Question management state
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [showSelectQuestionDialog, setShowSelectQuestionDialog] = useState(false)
  const [showNewQuestionDialog, setShowNewQuestionDialog] = useState(false)

  // Available questions state (for selection popup)
  const [availableQuestions, setAvailableQuestions] = useState<AvailableQuestion[]>([])
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
  const [allUnits, setAllUnits] = useState<UnitType[]>([]) // All units for UnitSelector in NewQuestionDialog
  const [loading, setLoading] = useState(false)

  // Filters for available questions
  const [searchTerm, setSearchTerm] = useState('')
  const [unitFilter, setUnitFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [scopeFilter, setScopeFilter] = useState<string>('all')
  
  // Pagination for available questions
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    if (showSelectQuestionDialog) {
      loadAvailableUnits()
      loadAvailableQuestions()
    }
  }, [showSelectQuestionDialog, state?.scope, state?.scopeId])

  useEffect(() => {
    if (showNewQuestionDialog) {
      loadAllUnits() // Load all units for UnitSelector in NewQuestionDialog
    }
  }, [showNewQuestionDialog])

  useEffect(() => {
    if (showSelectQuestionDialog) {
      loadAvailableQuestions()
    }
  }, [currentPage, pageSize, searchTerm, unitFilter, typeFilter, scopeFilter])

  // Load all units for NewQuestionDialog UnitSelector
  const loadAllUnits = async () => {
    try {
      const units = await UnitService.getAllUnits()
      setAllUnits(units)
    } catch (error) {
      console.error('Error loading all units:', error)
      showToast('error', 'Lỗi khi tải danh sách units')
      setAllUnits([])
    }
  }

  // Load available units based on scope
  const loadAvailableUnits = async () => {
    try {
      setLoading(true)
      let units: Unit[] = []
      
      if (state?.scope === 'course') {
        // Load all units from all chapters of the course
        const chapters = await StaffExamService.getChaptersByCourseId(state.scopeId)
        const allUnits = await Promise.all(
          chapters.map(chapter => StaffExamService.getUnitsByChapterId(chapter.id))
        )
        units = allUnits.flat()
      } else if (state?.scope === 'chapter') {
        // Load units from the specific chapter
        units = await StaffExamService.getUnitsByChapterId(state.scopeId)
      } else if (state?.scope === 'unit') {
        // For unit scope, we don't need to load units for filter since we only show questions from this unit
        units = []
      }
      
      setAvailableUnits(units)
    } catch (error) {
      console.error('Error loading units:', error)
      showToast('error', 'Lỗi khi tải danh sách units')
    } finally {
      setLoading(false)
    }
  }

  // Load available questions with filtering
  const loadAvailableQuestions = async () => {
    try {
      setLoading(true)
      
      let params: any = {
        page: currentPage,
        size: pageSize
      }

      // Add search term
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      // Add filters
      if (typeFilter !== 'all') {
        params.type = typeFilter
      }
      if (scopeFilter !== 'all') {
        params.scope = scopeFilter
      }

      // Handle unit filtering based on exam scope
      if (state?.scope === 'unit') {
        // For unit scope, only show questions from this unit
        params.unitId = state.scopeId
      } else if (unitFilter !== 'all') {
        // For course/chapter scope, filter by selected unit
        params.unitId = unitFilter
      }

      const result = await StaffExamService.getQuestions(params)
      setAvailableQuestions(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch (error) {
      console.error('Error loading questions:', error)
      showToast('error', 'Lỗi khi tải danh sách câu hỏi')
      setAvailableQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ExamData, value: any) => {
    setExamState(prev => ({
      ...prev,
      examData: {
        ...prev.examData,
        [field]: value
      }
    }))
  }

  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setShowNewQuestionDialog(true)
  }

  const handleEditQuestion = (question: ExamQuestion) => {
    setEditingQuestion(question)
    setShowNewQuestionDialog(true)
  }

  const handleSaveNewQuestion = async (question: ExamQuestion) => {
    const existingIndex = examState.examData.questions.findIndex(q => q.id === question.id)
    
    if (existingIndex >= 0) {
      // Update existing question
      const existingQuestion = examState.examData.questions[existingIndex]
      
      if (existingQuestion.isNew === false) {
        // Question đã tồn tại trong DB - cập nhật ngay lập tức
        try {
          await updateExistingQuestion(question)
          showToast('success', 'Cập nhật câu hỏi thành công!')
          
          // Cập nhật local state với isNew = false để giữ trạng thái
          const updatedQuestion = { ...question, isNew: false }
          const updatedQuestions = [...examState.examData.questions]
          updatedQuestions[existingIndex] = updatedQuestion
          handleInputChange('questions', updatedQuestions)
        } catch (error: any) {
          showToast('error', error.message || 'Lỗi khi cập nhật câu hỏi')
          return // Không đóng dialog nếu có lỗi
        }
      } else {
        // Question mới (isNew = true) - chỉ cập nhật local state
        const updatedQuestion = { ...question, isNew: true }
        const updatedQuestions = [...examState.examData.questions]
        updatedQuestions[existingIndex] = updatedQuestion
        handleInputChange('questions', updatedQuestions)
      }
    } else {
      // Add new question with isNew flag
      const newQuestion = { ...question, isNew: true }
      handleInputChange('questions', [...examState.examData.questions, newQuestion])
    }
    
    setShowNewQuestionDialog(false)
    setEditingQuestion(null)
  }

  const handleSaveQuestion = (question: ExamQuestion) => {
    const existingIndex = examState.examData.questions.findIndex(q => q.id === question.id)
    
    if (existingIndex >= 0) {
      const updatedQuestions = [...examState.examData.questions]
      updatedQuestions[existingIndex] = question
      handleInputChange('questions', updatedQuestions)
    } else {
      handleInputChange('questions', [...examState.examData.questions, question])
    }
    
    setShowQuestionDialog(false)
    setEditingQuestion(null)
  }

  // Handlers extracted to reduce nested callbacks in JSX
  const handleEditQuestionClick = (question: ExamQuestion) => {
    handleEditQuestion(question)
  }

  const handleDeleteQuestionClick = (index: number) => {
    const updatedQuestions = examState.examData.questions.filter((_, i) => i !== index)
    handleInputChange('questions', updatedQuestions)
  }

  const createNewQuestion = async (question: ExamQuestion) => {
    // Step 2a: Create question
    await QuestionService.createQuestion({
      id: question.id,
      content: question.content,
      scope: question.scope,
      type: question.type,
      explanation: question.explanation || '',
      fileUrl: null,
      options: [],
      unitIds: question.unitIds || [] // Sử dụng unitIds từ question
    })

    // Step 2b: Create options for question (if MULTIPLE_CHOICE)
    if (question.type === 'MULTIPLE_CHOICE' && question.options) {
      for (let i = 0; i < question.options.length; i++) {
        const option = question.options[i]
        const optionId = `${question.id}-${i + 1}`
        
        await QuestionService.createQuestionOption(question.id, {
          id: optionId,
          content: option.content,
          isCorrect: option.isCorrect
        })
      }
    }
  }

  // Update existing question in database immediately
  const updateExistingQuestion = async (question: ExamQuestion) => {
    // Step 1: Update the question (without options in the request)
    const updateData = {
      id: question.id,
      content: question.content,
      scope: question.scope,
      type: question.type,
      explanation: question.explanation || '',
      fileUrl: null,
      options: [], // Empty options array since we'll update them separately
      unitIds: question.unitIds || []
    }

    await QuestionService.updateQuestion(question.id, updateData)

    // Step 2: Update each option separately
    if (question.type === 'MULTIPLE_CHOICE' && question.options) {
      for (let i = 0; i < question.options.length; i++) {
        const option = question.options[i]
        // Use the existing option ID if it exists, otherwise generate new one
        const optionId = option.id || `${question.id}-${i + 1}`
        
        const optionData = {
          id: optionId,
          content: option.content,
          isCorrect: option.isCorrect
        }

        await QuestionService.updateQuestionOption(optionId, optionData)
      }
    }
  }

  const createExamData = () => {
    let examScopeType: string
    if (state?.scope === 'course') {
      examScopeType = 'COURSE'
    } else if (state?.scope === 'chapter') {
      examScopeType = 'CHAPTER'
    } else {
      examScopeType = 'UNIT'
    }
    
    return {
      id: examState.examData.examId,
      title: examState.examData.title,
      description: examState.examData.description,
      duration: examState.examData.duration,
      type: examState.examData.type,
      examScopeType,
      gradingMethod: examState.examData.gradingMethod,
      courseId: state?.scope === 'course' ? state.scopeId : null,
      chapterId: state?.scope === 'chapter' ? state.scopeId : null,
      unitId: state?.scope === 'unit' ? state.scopeId : null,
      questionIds: []
    }
  }

  const handleSubmit = async () => {
    if (examState.examData.questions.length === 0) {
      setExamState(prev => ({
        ...prev,
        error: 'Exam phải có ít nhất 1 câu hỏi'
      }))
      return
    }

    setExamState(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      // Step 1: Tạo exam với questionIds rỗng
      const examData = createExamData()
      await StaffExamService.createExam(examData)

      // Step 2: Tạo các question mới (nếu có)
      const newQuestions = examState.examData.questions.filter(q => q.isNew === true)

      for (const question of newQuestions) {
        await createNewQuestion(question)
      }

      // Step 3: Thêm tất cả câu hỏi vào exam (bao gồm cả question mới và cũ)
      if (examState.examData.questions.length > 0) {
        const allQuestionIds = examState.examData.questions.map(q => q.id)
        await StaffExamService.addQuestionsToExam(examState.examData.examId, allQuestionIds)
      }

      showToast('success', 'Tạo exam và thêm câu hỏi thành công!')
      navigate('/staff/courses')
    } catch (error: any) {
      setExamState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Có lỗi xảy ra khi tạo exam',
        isSubmitting: false
      }))
      showToast('error', error.response?.data?.message || 'Có lỗi xảy ra khi tạo exam')
    }
  }

  const nextStep = () => {
    if (examState.currentStep < 3) {
      setExamState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
    }
  }

  const prevStep = () => {
    if (examState.currentStep > 1) {
      setExamState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))
    }
  }

  const getScopeDisplayName = () => {
    switch (state?.scope) {
      case 'course': return 'Khóa học'
      case 'chapter': return 'Chương'
      case 'unit': return 'Bài học'
      default: return 'Unknown'
    }
  }

  const isStepComplete = (s: number) => {
    if (s === 1) {
      return Boolean(
        examState.examData.title && 
        examState.examData.examId && 
        examState.examData.duration &&
        examState.examData.description
      )
    }
    if (s === 2) return examState.examData.questions.length > 0
    if (s === 3) return true // Step 3 is always complete since we removed settings
    return true
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 1, label: 'Thông tin cơ bản', icon: <FileText className="h-4 w-4" /> },
      { key: 2, label: 'Câu hỏi', icon: <BookOpen className="h-4 w-4" /> },
      { key: 3, label: 'Tóm tắt', icon: <Settings className="h-4 w-4" /> },
    ]
    const stepButtonClass = (s: number) => {
      if (examState.currentStep === s) return 'bg-blue-600 text-white'
      if (isStepComplete(s)) return 'bg-green-100 text-green-800'
      return 'bg-gray-100 text-gray-600'
    }
    const handleNavigateToStep = (s: number) => {
      setExamState(prev => ({ ...prev, currentStep: s }))
    }
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, index) => (
          <div key={s.key} className="flex items-center">
            <button
              onClick={handleNavigateToStep.bind(null, s.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${stepButtonClass(s.key)}`}
            >
              {s.icon}
              <span className="font-medium">{s.label}</span>
              {isStepComplete(s.key) && examState.currentStep !== s.key && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </button>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 transition-colors ${
                isStepComplete(s.key) ? 'bg-green-300' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderStep1 = () => (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">Thông tin cơ bản</h3>
      
      <div className="mb-4">
        <Badge variant="outline" className="mb-4">
          {getScopeDisplayName()}: {state?.scopeName}
        </Badge>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="examId">Exam ID *</Label>
          <Input
            id="examId"
            value={examState.examData.examId}
            onChange={(e) => handleInputChange('examId', e.target.value)}
            placeholder={`Ví dụ: ${state?.scopeId || 'scopeId'}-exam01, ${state?.scopeId || 'scopeId'}-exam02, ...`}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Tạo exam theo nguyên tắc: courseId-chapterId(nếu có)-unitId(nếu có)-số thứ tự 
          </p>
        </div>

        <div>
          <Label htmlFor="title">Tiêu đề exam *</Label>
          <Input
            id="title"
            value={examState.examData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Nhập tiêu đề exam"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Mô tả *</Label>
          <Textarea
            id="description"
            value={examState.examData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Mô tả về exam này"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Thời gian (phút) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={examState.examData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Loại câu hỏi</Label>
            <Input
              id="type"
              value={examState.examData.type}
              disabled
              className="bg-gray-100"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="gradingMethod">Phương thức chấm</Label>
          <Input
            id="gradingMethod"
            value={examState.examData.gradingMethod}
            disabled
            className="bg-gray-100"
          />
        </div>
      </div>
    </Card>
  )

  const renderStep2 = () => (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">Quản lý câu hỏi</h3>
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            Tổng số câu hỏi: <span className="font-semibold">{examState.examData.questions.length}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddQuestion} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Thêm câu hỏi mới
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowSelectQuestionDialog(true)}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Chọn câu hỏi có sẵn
          </Button>
        </div>
      </div>

      <div className={`space-y-4 ${examState.examData.questions.length > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
        {examState.examData.questions.map((question, index) => (
          <QuestionListItem
            key={question.id}
            question={question}
            index={index}
            onEdit={handleEditQuestionClick}
            onDelete={handleDeleteQuestionClick}
          />
        ))}

        {examState.examData.questions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi mới" hoặc "Chọn câu hỏi có sẵn" để bắt đầu.</p>
          </div>
        )}
      </div>
    </Card>
  )

  const renderStep3 = () => (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">Tóm tắt exam</h3>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Tiêu đề:</span>
              <span className="font-semibold">{examState.examData.title || 'Chưa nhập'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Exam ID:</span>
              <span className="font-semibold">{examState.examData.examId || 'Chưa nhập'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Số câu hỏi:</span>
              <span className="font-semibold">{examState.examData.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Thời gian:</span>
              <span className="font-semibold">{examState.examData.duration} phút</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Điểm đậu:</span>
              <span className="font-semibold">60%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Loại câu hỏi:</span>
              <span className="font-semibold">{examState.examData.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Phương thức chấm:</span>
              <span className="font-semibold">{examState.examData.gradingMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Phạm vi:</span>
              <span className="font-semibold">{getScopeDisplayName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Trạng thái:</span>
              <span className="font-semibold">{examState.examData.status}</span>
            </div>
          </div>
        </div>

        {examState.examData.description && (
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium text-gray-700">Mô tả:</span>
            <p className="text-gray-600 mt-1">{examState.examData.description}</p>
          </div>
        )}

        {examState.examData.instructions && (
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium text-gray-700">Hướng dẫn làm bài:</span>
            <p className="text-gray-600 mt-1">{examState.examData.instructions}</p>
          </div>
        )}
      </div>
    </Card>
  )

  const renderCurrentStep = () => {
    switch (examState.currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      default: return renderStep1()
    }
  }

  return (
    <StaffNavigation>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="mb-3 bg-transparent"
              >
                ← Quay lại
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Tạo Exam Mới</h1>
              <p className="text-gray-600">Tạo exam cho {getScopeDisplayName().toLowerCase()}: {state?.scopeName}</p>
            </div>
          </div>

          {examState.error && (
            <Alert variant="destructive">{examState.error}</Alert>
          )}

          {/* Progress Steps */}
          <Card>
            <CardContent className="p-6">{renderStepIndicator()}</CardContent>
          </Card>

          {/* Step Content with Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {renderCurrentStep()}

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={examState.currentStep === 1}
                >
                  Quay lại
                </Button>

                <div className="flex space-x-4">
                  {examState.currentStep < 3 ? (
                    <Button
                      onClick={nextStep}
                      disabled={!isStepComplete(examState.currentStep)}
                    >
                      Tiếp theo
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={examState.isSubmitting || examState.examData.questions.length === 0}
                    >
                      {examState.isSubmitting ? 'Đang tạo...' : 'Tạo Exam'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <ExamSummary examData={examState.examData} />
              <QuickActions
                goTo={(s) => setExamState(prev => ({ ...prev, currentStep: s }))}
              />
            </div>
          </div>

          {/* Question Dialog */}
          <QuestionDialog
            isOpen={showQuestionDialog}
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onClose={() => {
              setShowQuestionDialog(false)
              setEditingQuestion(null)
            }}
          />

          {/* New Question Dialog */}
          <NewQuestionDialog
            isOpen={showNewQuestionDialog}
            question={editingQuestion}
            onSave={handleSaveNewQuestion}
            onClose={() => {
              setShowNewQuestionDialog(false)
              setEditingQuestion(null)
            }}
            allUnits={allUnits}
          />

          {/* Select Question Dialog */}
          <SelectQuestionDialog
            isOpen={showSelectQuestionDialog}
            onClose={() => setShowSelectQuestionDialog(false)}
            onSelectQuestions={(questions) => {
              // Questions from existing database don't have isNew flag (remain undefined/false)
              const existingQuestions = questions.map(q => ({ ...q, isNew: false }))
              const updatedQuestions = [...examState.examData.questions, ...existingQuestions]
              handleInputChange('questions', updatedQuestions)
              setShowSelectQuestionDialog(false)
            }}
            state={state}
            availableQuestions={availableQuestions}
            availableUnits={availableUnits}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            unitFilter={unitFilter}
            setUnitFilter={setUnitFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            scopeFilter={scopeFilter}
            setScopeFilter={setScopeFilter}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            existingQuestions={examState.examData.questions}
          />
        </div>
      </div>
    </StaffNavigation>
  )
}

function ExamSummary({ examData }: Readonly<{ examData: ExamData }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tổng quan bài thi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{examData.questions.length}</div>
            <div className="text-sm text-gray-600">Câu hỏi</div>
          </div>
        </div>
        <div className="pt-4 border-t space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Thời gian:</span>
            <span className="font-medium">{examData.duration} phút</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Điểm đậu:</span>
            <span className="font-medium">60%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Loại:</span>
            <span className="font-medium">{examData.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Chấm điểm:</span>
            <span className="font-medium">{examData.gradingMethod}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuestionListItem({
  question,
  index,
  onEdit,
  onDelete,
}: Readonly<{
  question: ExamQuestion
  index: number
  onEdit: (q: ExamQuestion) => void
  onDelete: (idx: number) => void
}>) {
  return (
    <Card className="p-4 border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{question.type}</Badge>
            {question.scope && (
              <Badge variant="outline">{question.scope}</Badge>
            )}
          </div>
          <p className="font-medium mb-2">Câu {index + 1}: {question.question}</p>
          {question.type === 'MULTIPLE_CHOICE' && (
            <div className="text-sm text-gray-600">
              {question.options?.map((opt, i) => (
                <p key={opt.id} className={`flex items-center ${opt.isCorrect ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                  <span className="mr-2">{String.fromCharCode(65 + i)}.</span> {opt.content}
                  {opt.isCorrect && <CheckCircle className="h-3 w-3 ml-2 text-green-600" />}
                </p>
              ))}
            </div>
          )}
          {question.explanation && (
            <p className="text-sm text-gray-500 italic mt-2">
              Giải thích: {question.explanation}
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(question)}
          >
            Sửa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(index)}
          >
            Xóa
          </Button>
        </div>
      </div>
    </Card>
  )
}

function QuickActions({ goTo }: Readonly<{ goTo: (s: number) => void }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Hành động nhanh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
  <Button variant="ghost" className="w-full justify-start bg-transparent" onClick={() => goTo(1)}>
          Thông tin cơ bản
        </Button>
  <Button variant="ghost" className="w-full justify-start bg-transparent" onClick={() => goTo(2)}>
          Quản lý câu hỏi
        </Button>
  <Button variant="ghost" className="w-full justify-start bg-transparent" onClick={() => goTo(3)}>
          Cài đặt bài thi
        </Button>
      </CardContent>
    </Card>
  )
}

function NewQuestionDialog({
  isOpen,
  onClose,
  onSave,
  question,
  allUnits
}: Readonly<{
  isOpen: boolean
  onClose: () => void
  onSave: (question: ExamQuestion) => void
  question?: ExamQuestion | null
  allUnits: UnitType[]
}>) {
  const [formData, setFormData] = useState<QuestionFormData>({
    id: '',
    content: '',
    scope: 'VOCAB',
    type: 'MULTIPLE_CHOICE',
    explanation: '',
    fileUrl: '',
    uploadedFile: null,
    options: [
      { id: '1', content: '', isCorrect: true },
      { id: '2', content: '', isCorrect: false }
    ],
    unitIds: []
  })

  useEffect(() => {
    if (question) {
      // Edit mode
      setFormData({
        id: question.id,
        content: question.content || question.question,
        scope: question.scope,
        type: question.type,
        explanation: question.explanation || '',
        fileUrl: '',
        uploadedFile: null,
        options: question.options || [
          { id: '1', content: '', isCorrect: true },
          { id: '2', content: '', isCorrect: false }
        ],
        unitIds: question.unitIds || [] // Load unitIds từ existing question
      })
    } else {
      // Create mode - reset form
      setFormData({
        id: '',
        content: '',
        scope: 'VOCAB',
        type: 'MULTIPLE_CHOICE',
        explanation: '',
        fileUrl: '',
        uploadedFile: null,
        options: [
          { id: '1', content: '', isCorrect: true },
          { id: '2', content: '', isCorrect: false }
        ],
        unitIds: []
      })
    }
  }, [question, isOpen])

  if (!isOpen) return null

  const addOption = () => {
    if (formData.options.length < 6) {
      const newOptionId = (formData.options.length + 1).toString()
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { 
          id: newOptionId, 
          content: '', 
          isCorrect: false 
        }]
      }))
    }
  }

  const removeOption = (optionId: string) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter(opt => opt.id !== optionId)
      }))
    }
  }

  const updateOption = (optionId: string, content: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === optionId ? { ...opt, content } : opt)
    }))
  }

  const setCorrectOption = (optionId: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => ({ ...opt, isCorrect: opt.id === optionId }))
    }))
  }

  const handleSave = () => {
    if (!formData.id.trim() || !formData.content.trim()) {
      return
    }

    if (formData.type === 'MULTIPLE_CHOICE') {
      const hasCorrectAnswer = formData.options.some(opt => opt.isCorrect)
      const hasEmptyOption = formData.options.some(opt => !opt.content.trim())

      if (!hasCorrectAnswer || hasEmptyOption) {
        return
      }
    }

    const examQuestion: ExamQuestion = {
      id: formData.id,
      type: formData.type,
      question: formData.content,
      content: formData.content,
      scope: formData.scope,
      options: formData.type === 'MULTIPLE_CHOICE' ? formData.options : undefined,
      explanation: formData.explanation,
      points: 10,
      difficulty: 'Trung bình',
      skill: 'Ngữ pháp',
      unitIds: formData.unitIds // Thêm unitIds từ form
    }

    onSave(examQuestion)
  }

  return (
    <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto m-4 w-full shadow-2xl">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
          <h3 className="text-lg font-semibold">
            {question ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="questionId" className="block text-sm font-medium text-gray-700 mb-1">
                ID câu hỏi <span className="text-red-500">*</span>
              </label>
              <Input
                id="questionId"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                placeholder="Nhập ID câu hỏi"
                className="bg-white/70"
              />
            </div>
            <div>
              <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-1">
                File đính kèm
              </label>
              <div className="relative">
                <input
                  id="fileUpload"
                  type="file"
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setFormData(prev => ({ ...prev, uploadedFile: file }))
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/70 flex items-center justify-between cursor-pointer hover:bg-gray-50">
                  <span className="text-gray-500 text-sm">
                    {formData.uploadedFile?.name ?? 'Chọn file...'}
                  </span>
                  <Upload className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Type and Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="questionType" className="block text-sm font-medium text-gray-700 mb-1">Loại câu hỏi</label>
              <select
                id="questionType"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'WRITING'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                <option value="TRUE_FALSE">Đúng/Sai</option>
                <option value="WRITING">Tự luận</option>
              </select>
            </div>
            <div>
              <label htmlFor="questionScope" className="block text-sm font-medium text-gray-700 mb-1">Phạm vi</label>
              <select
                id="questionScope"
                value={formData.scope}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  scope: e.target.value as 'KANJI' | 'VOCAB' | 'GRAMMAR' | 'LISTENING' | 'READING' | 'WRITING'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="KANJI">Kanji</option>
                <option value="VOCAB">Từ vựng</option>
                <option value="GRAMMAR">Ngữ pháp</option>
                <option value="LISTENING">Nghe</option>
                <option value="READING">Đọc</option>
                <option value="WRITING">Viết</option>
              </select>
            </div>
          </div>

          {/* Question Content */}
          <div>
            <label htmlFor="questionContent" className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung câu hỏi <span className="text-red-500">*</span>
            </label>
            <textarea
              id="questionContent"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>

          {/* Multiple Choice Options */}
          {formData.type === "MULTIPLE_CHOICE" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="block text-sm font-medium text-gray-700">Các lựa chọn</div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={addOption}
                    disabled={formData.options.length >= 6}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Thêm
                  </Button>
                </div>
              </div>
              {formData.options.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-3 mb-3">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={option.isCorrect}
                    onChange={() => setCorrectOption(option.id)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{String.fromCharCode(65 + index)}</span>
                  </div>
                  <Input
                    placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                    value={option.content}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    className="flex-1 bg-white/70"
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      onClick={() => removeOption(option.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Unit Selection */}
          <div>
            <UnitSelector
              units={allUnits}
              selectedUnitIds={formData.unitIds}
              onChange={(unitIds) => setFormData(prev => ({ ...prev, unitIds }))}
              placeholder="Tìm kiếm và chọn units (tùy chọn)..."
              multiple={true}
              required={false}
            />
          </div>

          {/* Explanation */}
          <div>
            <label htmlFor="questionExplanation" className="block text-sm font-medium text-gray-700 mb-1">Giải thích (tùy chọn)</label>
            <textarea
              id="questionExplanation"
              value={formData.explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Giải thích đáp án cho học viên..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50/50 rounded-b-xl">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-white/70"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {question ? "Cập nhật" : "Thêm câu hỏi"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SelectQuestionDialog({ 
  isOpen, 
  onClose, 
  onSelectQuestions,
  state,
  availableQuestions,
  availableUnits,
  loading,
  searchTerm,
  setSearchTerm,
  unitFilter,
  setUnitFilter,
  typeFilter,
  setTypeFilter,
  scopeFilter,
  setScopeFilter,
  currentPage,
  setCurrentPage,
  totalPages,
  totalElements,
  pageSize,
  existingQuestions
}: Readonly<{
  isOpen: boolean
  onClose: () => void
  onSelectQuestions: (questions: ExamQuestion[]) => void
  state: LocationState | null
  availableQuestions: AvailableQuestion[]
  availableUnits: Unit[]
  loading: boolean
  searchTerm: string
  setSearchTerm: (value: string) => void
  unitFilter: string
  setUnitFilter: (value: string) => void
  typeFilter: string
  setTypeFilter: (value: string) => void
  scopeFilter: string
  setScopeFilter: (value: string) => void
  currentPage: number
  setCurrentPage: (value: number) => void
  totalPages: number
  totalElements: number
  pageSize: number
  existingQuestions: ExamQuestion[]
}>) {
  const [selectedQuestions, setSelectedQuestions] = useState<AvailableQuestion[]>([])

  if (!isOpen) return null

  const getScopeName = (scope: string) => {
    switch (scope) {
      case "KANJI":
        return "Kanji";
      case "VOCAB":
        return "Từ vựng";
      case "GRAMMAR":
        return "Ngữ pháp";
      case "LISTENING":
        return "Nghe";
      case "READING":
        return "Đọc";
      case "WRITING":
        return "Viết";
      default:
        return scope;
    }
  }

  const getQuestionTypeName = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "Trắc nghiệm";
      case "TRUE_FALSE":
        return "Đúng/Sai";
      case "WRITING":
        return "Tự luận";
      default:
        return "Khác";
    }
  }

  const handleSelectQuestion = (question: AvailableQuestion) => {
    const isAlreadyInExam = existingQuestions.some((q: ExamQuestion) => q.id === question.id)
    if (isAlreadyInExam) {
      // Don't allow selecting questions already in exam
      return
    }
    
    const isSelected = selectedQuestions.some(q => q.id === question.id)
    if (isSelected) {
      setSelectedQuestions(prev => prev.filter(q => q.id !== question.id))
    } else {
      setSelectedQuestions(prev => [...prev, question])
    }
  }

  const handleConfirmSelection = () => {
    // Convert AvailableQuestion to ExamQuestion format
    const examQuestions: ExamQuestion[] = selectedQuestions.map(q => ({
      id: q.id,
      type: q.type as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "WRITING",
      question: q.content,
      content: q.content,
      scope: q.scope as "KANJI" | "VOCAB" | "GRAMMAR" | "LISTENING" | "READING" | "WRITING",
      options: q.options || [],
      explanation: q.explanation,
      points: 10, // Default points
      difficulty: 'Trung bình' as const,
      skill: 'Ngữ pháp' as const // Default skill
    }))

    onSelectQuestions(examQuestions)
    setSelectedQuestions([])
  }

  return (
    <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl max-w-6xl max-h-[90vh] overflow-hidden mx-4 w-full shadow-2xl">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
          <h2 className="text-xl font-semibold">Chọn câu hỏi có sẵn</h2>
          <p className="text-blue-100 mt-1">Tìm và chọn câu hỏi để thêm vào bài thi</p>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-white/90">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo ID hoặc nội dung câu hỏi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/70"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {/* Unit Filter - only show if not unit scope */}
              {state?.scope !== 'unit' && (
                <div className="relative min-w-[200px]">
                  <SearchableUnitSelect
                    availableUnits={availableUnits}
                    selectedUnitId={unitFilter}
                    onChange={setUnitFilter}
                    placeholder="Chọn unit..."
                  />
                </div>
              )}
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả loại</option>
                <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                <option value="TRUE_FALSE">Đúng/Sai</option>
                <option value="WRITING">Tự luận</option>
              </select>
              
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả phạm vi</option>
                <option value="KANJI">Kanji</option>
                <option value="VOCAB">Từ vựng</option>
                <option value="GRAMMAR">Ngữ pháp</option>
                <option value="LISTENING">Nghe</option>
                <option value="READING">Đọc</option>
                <option value="WRITING">Viết</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Questions List */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Đang tải...</p>
            </div>
          ) : (
            <>
              {availableQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>Không tìm thấy câu hỏi nào phù hợp với bộ lọc.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableQuestions.map((question, index) => {
                    const isSelected = selectedQuestions.some(q => q.id === question.id)
                    const isAlreadyInExam = existingQuestions.some((q: ExamQuestion) => q.id === question.id)
                    const isDisabled = isAlreadyInExam
                    
                    // Determine button styling
                    let buttonClass = 'w-full text-left border rounded-lg p-4 cursor-pointer transition-all '
                    if (isDisabled) {
                      buttonClass += 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                    } else if (isSelected) {
                      buttonClass += 'border-blue-500 bg-blue-50 shadow-md'
                    } else {
                      buttonClass += 'border-gray-200 bg-white hover:shadow-md hover:border-gray-300'
                    }
                    
                    // Determine checkbox styling
                    let checkboxClass = 'w-6 h-6 rounded border-2 flex items-center justify-center '
                    if (isDisabled) {
                      checkboxClass += 'border-gray-400 bg-gray-300 text-gray-600'
                    } else if (isSelected) {
                      checkboxClass += 'border-blue-500 bg-blue-500 text-white'
                    } else {
                      checkboxClass += 'border-gray-300'
                    }
                    
                    return (
                      <button 
                        key={question.id} 
                        className={buttonClass}
                        onClick={() => !isDisabled && handleSelectQuestion(question)}
                        disabled={isDisabled}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={checkboxClass}>
                              {isDisabled && (
                                <span className="text-xs font-bold">✓</span>
                              )}
                              {!isDisabled && isSelected && (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </div>
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-blue-100 text-blue-800">
                                {getQuestionTypeName(question.type)}
                              </Badge>
                              {question.scope && (
                                <Badge className="bg-green-100 text-green-800">
                                  {getScopeName(question.scope)}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">ID: {question.id}</span>
                              {isDisabled && (
                                <Badge className="bg-red-100 text-red-800">
                                  Đã có trong bài thi
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <h4 className="font-medium text-gray-900 mb-2"
                            dangerouslySetInnerHTML={{
                              __html: question.content
                                .replace(/<u>/g, '<span style="text-decoration: underline;">')
                                .replace(/<\/u>/g, '</span>')
                                .replace(/<strong>/g, '<span style="font-weight: bold;">')
                                .replace(/<\/strong>/g, '</span>')
                                .replace(/<em>/g, '<span style="font-style: italic;">')
                                .replace(/<\/em>/g, '</span>')
                            }}
                        />

                        {question.explanation && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                            <strong>Giải thích:</strong> {question.explanation}
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-500">
                          Tạo: {new Date(question.createdAt).toLocaleString("vi-VN")}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} của {totalElements} câu hỏi
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  Trước
                </Button>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Sau
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between bg-gray-50/50 rounded-b-xl">
          <div className="text-sm text-gray-600">
            Đã chọn: <span className="font-semibold text-blue-600">{selectedQuestions.length}</span> câu hỏi
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                onClose()
                setSelectedQuestions([])
                setSearchTerm('')
                setCurrentPage(0)
              }}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              disabled={selectedQuestions.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Thêm {selectedQuestions.length} câu hỏi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// SearchableUnitSelect Component
function SearchableUnitSelect({
  availableUnits,
  selectedUnitId,
  onChange,
  placeholder
}: Readonly<{
  availableUnits: Unit[]
  selectedUnitId: string
  onChange: (unitId: string) => void
  placeholder: string
}>) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredUnits = availableUnits.filter(unit =>
    unit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedUnit = availableUnits.find(unit => unit.id === selectedUnitId)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative w-full border border-gray-300 rounded-lg bg-white/70 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-left px-3 py-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm truncate">
            {selectedUnit ? selectedUnit.title : placeholder}
          </span>
          <Search className="h-4 w-4 text-gray-400 ml-2" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tìm kiếm unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              className="w-full text-left p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
              onClick={() => {
                onChange('all')
                setIsOpen(false)
                setSearchTerm('')
              }}
            >
              <div className="text-sm font-medium text-gray-900">Tất cả units</div>
            </button>
            
            {filteredUnits.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Không tìm thấy unit nào
              </div>
            ) : (
              filteredUnits.map(unit => (
                <button
                  key={unit.id}
                  type="button"
                  className="w-full text-left p-3 hover:bg-blue-50 cursor-pointer"
                  onClick={() => {
                    onChange(unit.id)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {unit.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Unit ID: <span className="font-mono">{unit.id}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      Chapter: <span className="font-mono">{unit.chapterId}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffCreateExamPage
