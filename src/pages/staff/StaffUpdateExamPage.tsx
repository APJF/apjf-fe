import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Label } from '../../components/ui/Label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { UnitSelector } from '../../components/ui/UnitSelector'
import { StaffExamService } from '../../services/staffExamService'
import { UnitService, type Unit } from '../../services/unitService'
import { QuestionService } from '../../services/questionService'
import { StaffNavigation } from '../../components/layout/StaffNavigation'
import { useToast } from '../../hooks/useToast'
// import { useAuth } from '../../hooks/useAuth'
import { 
  FileText, 
  BookOpen, 
  Settings, 
  CheckCircle, 
  Plus, 
  Search, 
  Minus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  ArrowLeft
} from "lucide-react"
import type { Question } from '../../types/question'
import axios from 'axios'

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

interface ExamData {
  id?: string
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
  createdAt?: string
  updatedAt?: string
  totalPoints?: number
  level?: string
  passingScore?: number
  difficulty?: string
  settings?: {
    shuffleQuestions: boolean
    shuffleOptions: boolean
    showResults: boolean
    allowRetake: boolean
    timeLimit: boolean
  }
}

interface ExamUpdateState {
  currentStep: number
  examData: ExamData | null
  isSubmitting: boolean
  error: string | null
  isLoading: boolean
}

interface LocationState {
  scope: 'course' | 'chapter' | 'unit'
  scopeId: string
  scopeName: string
}

export const StaffUpdateExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState
  const { showToast } = useToast()
  // const { user } = useAuth()

  const [examState, setExamState] = useState<ExamUpdateState>({
    currentStep: 1,
    examData: null,
    isSubmitting: false,
    error: null,
    isLoading: true
  })

  // Question management state
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)
  // const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [showSelectQuestionDialog, setShowSelectQuestionDialog] = useState(false)
  const [showNewQuestionDialog, setShowNewQuestionDialog] = useState(false)

  // Available questions state (for selection popup) - sử dụng Question type từ question.ts
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [allUnits, setAllUnits] = useState<Unit[]>([]) // All units for UnitSelector in NewQuestionDialog
  const [loading, setLoading] = useState(false)

  // Filters for available questions - cập nhật theo StaffCreateQuestion
  const [searchQuestionId, setSearchQuestionId] = useState('')
  const [unitFilter, setUnitFilter] = useState<string>('all')
  
  // Pagination for available questions - cập nhật với pageSize changeable
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Load exam data on component mount
  useEffect(() => {
    loadExamData()
    loadUnitsForCourse()
  }, [examId])

  useEffect(() => {
    if (showSelectQuestionDialog) {
      loadUnitsForCourse() // Load units for filter
      const delayedFetch = setTimeout(() => {
        loadAvailableQuestions()
      }, 300) // Debounce search
      
      return () => clearTimeout(delayedFetch)
    }
  }, [showSelectQuestionDialog, currentPage, pageSize, searchQuestionId, unitFilter])

  // Load units based on course scope for both filter and NewQuestionDialog
  // Using old logic: get chapters by courseId, then get units by chapterId
  const loadUnitsForCourse = async () => {
    try {
      let staffUnits: any[] = []
      
      if (examState.examData?.scope === 'COURSE') {
        // Step 1: Get all chapters of this course
        const chapters = await StaffExamService.getChaptersByCourseId(examState.examData.courseId!)
        console.log('Chapters for course:', chapters)
        
        // Step 2: Get units for each chapter
        for (const chapter of chapters) {
          try {
            const chapterUnits = await StaffExamService.getUnitsByChapterId(chapter.id)
            staffUnits = [...staffUnits, ...chapterUnits]
          } catch (error) {
            console.error(`Error loading units for chapter ${chapter.id}:`, error)
            // Continue with other chapters even if one fails
          }
        }
      } else if (examState.examData?.scope === 'CHAPTER') {
        // Load units by chapter directly
        staffUnits = await StaffExamService.getUnitsByChapterId(examState.examData.chapterId!)
      } else if (examState.examData?.scope === 'UNIT') {
        // For unit scope, we need to get the specific unit info
        // Since we don't have a direct API, we'll get all units and filter by ID
        const allUnits = await UnitService.getAllUnits()
        const unitData = allUnits.find(unit => unit.id === examState.examData?.unitId)
        if (unitData) {
          staffUnits = [{
            id: unitData.id,
            title: unitData.title,
            description: '',
            status: 'ACTIVE',
            chapterId: unitData.chapterId,
            courseId: unitData.courseId,
            prerequisiteUnitId: null
          }]
        }
      }
      
      console.log('All units loaded for scope:', staffUnits)
      
      // Convert StaffUnit to Unit format
      const units: Unit[] = staffUnits.map(unit => ({
        id: unit.id,
        title: unit.title,
        chapterId: unit.chapterId,
        courseId: unit.courseId
      }))
      
      setAllUnits(units)
    } catch (error) {
      console.error('Error loading units for course:', error)
      showToast('error', 'Lỗi khi tải danh sách units')
      setAllUnits([])
    }
  }

  // Load available questions with filtering - sử dụng QuestionService như StaffCreateQuestion
  const loadAvailableQuestions = async () => {
    try {
      setLoading(true)
      
      // Prepare filters theo cách của StaffCreateQuestion
      const questionIdParam = searchQuestionId?.trim() || undefined
      const unitIdParam = unitFilter === "all" ? undefined : unitFilter
      
      const pagedData = await QuestionService.getAllQuestions(
        currentPage, 
        pageSize, 
        questionIdParam, 
        unitIdParam
      )
      console.log('Paged questions data received:', pagedData)
      
      // pagedData is now PagedQuestions type with all pagination info
      const safeQuestionsData = Array.isArray(pagedData.content) ? pagedData.content : []
      setAvailableQuestions(safeQuestionsData)
      
      // Set pagination info from PagedQuestions
      if (pagedData.number !== currentPage) {
        setCurrentPage(pagedData.number || 0)
      }
      setTotalPages(pagedData.totalPages)
      setTotalElements(pagedData.totalElements)
    } catch (error) {
      console.error('Error loading questions:', error)
      showToast('error', 'Lỗi khi tải danh sách câu hỏi')
      setAvailableQuestions([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (showNewQuestionDialog) {
      loadAllUnits() // Load all units for UnitSelector in NewQuestionDialog
    }
  }, [showNewQuestionDialog])

  // Load exam data by ID
  const loadExamData = async () => {
    if (!examId) {
      setExamState(prev => ({
        ...prev,
        error: 'ID bài thi không hợp lệ',
        isLoading: false
      }))
      return
    }

    try {
      setExamState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Get auth headers
      const token = localStorage.getItem('access_token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      
      // API call to get exam details
      const examResponse = await axios.get(`http://localhost:8080/api/exams/${examId}`, { headers })
      
      if (!examResponse.data.success) {
        throw new Error(examResponse.data.message || 'Không thể tải thông tin bài thi')
      }

      const examData = examResponse.data.data

      // API call to get exam questions - sử dụng QuestionService để lấy thông tin đầy đủ bao gồm đáp án đúng
      const questionsResponse = await axios.get(`http://localhost:8080/api/exams/${examId}/questions`, { headers })
      
      if (!questionsResponse.data.success) {
        throw new Error(questionsResponse.data.message || 'Không thể tải câu hỏi bài thi')
      }

      const questionIds = questionsResponse.data.data || []
      const detailedQuestions = []

      // Lấy thông tin chi tiết từng câu hỏi qua QuestionService để có đáp án đúng
      for (const questionId of questionIds) {
        try {
          // Ensure questionId is a string, not an object
          const idString = typeof questionId === 'string' ? questionId : questionId.id || questionId
          console.log(`Loading question details for ID: ${idString}`)
          
          // Kết hợp 2 API calls:
          // 1. getQuestionById - lấy thông tin chi tiết đầy đủ (nhưng không có đáp án đúng)
          // 2. getAllQuestions với search - lấy đáp án đúng (isCorrect flag)
          
          const [detailQuestion, searchResult] = await Promise.all([
            QuestionService.getQuestionById(idString),
            QuestionService.getAllQuestions(0, 1, idString, undefined)
          ])
          
          console.log(`Detail question (no correct answers):`, detailQuestion)
          console.log(`Search result (with correct answers):`, searchResult)
          
          // Combine data: use detail question as base, but merge correct answers from search
          let combinedQuestion = { ...detailQuestion }
          
          if (searchResult.content && searchResult.content.length > 0) {
            const searchQuestion = searchResult.content[0]
            console.log(`Search question found with options:`, searchQuestion.options)
            
            // Merge options with correct answers from search result
            if (searchQuestion.options && searchQuestion.options.length > 0) {
              combinedQuestion.options = searchQuestion.options.map(searchOption => ({
                id: searchOption.id,
                content: searchOption.content,
                isCorrect: searchOption.isCorrect // This is the key data we need
              }))
            }
          }
          
          console.log(`Combined question ${idString} with correct answers:`, combinedQuestion.options)
          detailedQuestions.push(combinedQuestion)
        } catch (error) {
          console.error(`Error loading question ${questionId}:`, error)
          // Nếu không lấy được từ QuestionService, tạo question cơ bản
          const idString = typeof questionId === 'string' ? questionId : questionId.id || questionId
          detailedQuestions.push({
            id: idString,
            content: `Câu hỏi ${idString}`,
            type: 'MULTIPLE_CHOICE',
            scope: 'VOCAB',
            options: [],
            explanation: '',
            unitIds: []
          })
        }
      }

      // Convert API response to ExamData format
      const processedExamData: ExamData = {
        id: examData.id,
        title: examData.title,
        description: examData.description,
        examId: examData.id,
        courseId: examData.courseId,
        chapterId: examData.chapterId,
        unitId: examData.unitId,
        scope: examData.examScopeType || 'COURSE',
        duration: examData.duration || 60,
        type: examData.type,
        gradingMethod: examData.gradingMethod,
        instructions: examData.instructions || '',
        questions: detailedQuestions.map((q: any) => {
          console.log(`Processing question ${q.id} with options:`, q.options)
          return {
            id: q.id,
            type: q.type,
            question: q.content,
            content: q.content,
            scope: q.scope,
            options: q.options ? q.options.map((opt: any) => ({
              id: opt.id,
              content: opt.content,
              isCorrect: opt.isCorrect
            })) : [],
            correctAnswer: '',
            explanation: q.explanation || '',
            difficulty: "Trung bình" as const,
            skill: "Ngữ pháp" as const,
            isNew: false, // Existing questions from exam
            unitIds: q.unitIds || []
          }
        }),
        status: 'ACTIVE',
        createdAt: examData.createdAt,
        updatedAt: examData.updatedAt,
        totalPoints: detailedQuestions.length * 1, // Calculate based on actual questions
        level: 'N5', // Default level, có thể cần điều chỉnh
        passingScore: 60,
        difficulty: 'Trung bình',
        settings: {
          shuffleQuestions: false,
          shuffleOptions: false,
          showResults: true,
          allowRetake: true,
          timeLimit: true
        }
      }

      setExamState(prev => ({
        ...prev,
        examData: processedExamData,
        isLoading: false
      }))
    } catch (error: any) {
      console.error('Error loading exam data:', error)
      setExamState(prev => ({
        ...prev,
        error: error.response?.data?.message || error.message || 'Không thể tải thông tin bài thi',
        isLoading: false
      }))
    }
  }

  // Load all units for NewQuestionDialog UnitSelector
  const loadAllUnits = async () => {
    try {
      const units = await UnitService.getAllUnits()
      // Mock units loaded - will be replaced with real API integration when provided
      console.log('Units loaded:', units.length)
    } catch (error) {
      console.error('Error loading all units:', error)
      showToast('error', 'Lỗi khi tải danh sách units')
    }
  }

  const handleInputChange = (field: keyof ExamData, value: any) => {
    if (!examState.examData) return
    
    setExamState(prev => ({
      ...prev,
      examData: prev.examData ? {
        ...prev.examData,
        [field]: value
      } : null
    }))
  }

  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setShowNewQuestionDialog(true)
  }

  const handleSaveNewQuestion = async (question: ExamQuestion) => {
    if (!examState.examData) return
    
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

  const handleDeleteQuestion = (questionId: string) => {
    if (!examState.examData) return
    
    const updatedQuestions = examState.examData.questions.filter(q => q.id !== questionId)
    handleInputChange('questions', updatedQuestions)
  }

  const handleEditQuestionClick = async (question: ExamQuestion) => {
    try {
      // If this is a new question (isNew = true), no need to fetch from API
      if (question.isNew === true) {
        setEditingQuestion(question)
        setShowNewQuestionDialog(true)
        return
      }
      
      // For existing questions, kết hợp dữ liệu từ 2 nguồn:
      // 1. question từ list (có thông tin đáp án đúng)
      // 2. fullQuestion từ detail API (có đầy đủ thông tin khác như units)
      console.log('Question from list (có correct answers):', question)
      
      // Fetch full question details to get complete data including units
      console.log('Fetching question details for ID:', question.id)
      const fullQuestion = await QuestionService.getQuestionById(question.id)
      console.log('Full question from detail API:', fullQuestion)
      
      // Combine options: use options from question (với isCorrect) nhưng ensure có đầy đủ fields
      const combinedOptions = question.options?.map((listOption, index) => ({
        id: listOption.id || `${question.id}-${index + 1}`,
        content: listOption.content,
        isCorrect: listOption.isCorrect // Lấy isCorrect từ list data
      })) || []
      
      // Nếu fullQuestion có options mà list không có, merge chúng
      if (fullQuestion.options && fullQuestion.options.length > 0) {
        fullQuestion.options.forEach((detailOption) => {
          const existingOption = combinedOptions.find(opt => opt.id === detailOption.id)
          if (!existingOption) {
            // Option mới từ detail API, add vào (nhưng cần xác định isCorrect từ list)
            const listMatch = question.options?.find(opt => opt.content === detailOption.content)
            combinedOptions.push({
              id: detailOption.id || `${question.id}-${combinedOptions.length + 1}`,
              content: detailOption.content,
              isCorrect: listMatch?.isCorrect || false
            })
          } else {
            // Update content từ detail API nhưng giữ nguyên isCorrect từ list
            existingOption.content = detailOption.content
          }
        })
      }

      // Ensure unitIds is always an array (lấy từ detail API)
      const safeUnitIds = Array.isArray(fullQuestion.unitIds) ? fullQuestion.unitIds : []
      
      console.log('Combined options with correct answers:', combinedOptions)
      console.log('Safe unitIds from detail API:', safeUnitIds)

      // Use combined data for editingQuestion
      const combinedQuestion: ExamQuestion = {
        ...question,
        // Update with data from detail API
        content: fullQuestion.content || question.content,
        explanation: fullQuestion.explanation || question.explanation,
        options: combinedOptions,
        unitIds: safeUnitIds,
        // Keep the ExamQuestion specific fields
        question: fullQuestion.content || question.content,
        type: 'MULTIPLE_CHOICE', // Fixed to MULTIPLE_CHOICE
        difficulty: question.difficulty,
        skill: question.skill,
        isNew: false // Existing question
      }
      
      setEditingQuestion(combinedQuestion)
      setShowNewQuestionDialog(true)
    } catch (error: any) {
      console.error('Error fetching question details:', error)
      showToast('error', error.message || 'Không thể tải chi tiết câu hỏi')
    }
  }

  const handleDeleteQuestionClick = (questionId: string) => {
    handleDeleteQuestion(questionId)
  }

  const handleSelectQuestions = (questions: ExamQuestion[]) => {
    if (!examState.examData) return
    
    // Add questions to exam data, avoiding duplicates
    const existingIds = new Set(examState.examData.questions.map(q => q.id))
    const newQuestions = questions.filter(q => !existingIds.has(q.id))
    
    handleInputChange('questions', [...examState.examData.questions, ...newQuestions])
    setShowSelectQuestionDialog(false)
  }

  // Create new question API call
  const createNewQuestion = async (question: ExamQuestion) => {
    try {
      // Step 2a: Create question (without options)
      const questionData: QuestionFormData = {
        id: question.id,
        content: question.content,
        scope: question.scope,
        type: question.type,
        explanation: question.explanation || '',
        fileUrl: '',
        uploadedFile: null,
        options: [], // Empty options array như trong StaffCreateExamPage
        unitIds: question.unitIds || []
      }

      await QuestionService.createQuestion(questionData)

      // Step 2b: Create options for question (if MULTIPLE_CHOICE) - giống logic StaffCreateExamPage
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

      showToast('success', 'Tạo câu hỏi mới thành công!')
    } catch (error: any) {
      console.error('Error creating new question:', error)
      showToast('error', error.response?.data?.message || 'Lỗi khi tạo câu hỏi mới')
      throw error
    }
  }

  // Update existing question in database immediately
  const updateExistingQuestion = async (question: ExamQuestion) => {
    try {
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

      showToast('success', 'Cập nhật câu hỏi thành công!')
    } catch (error: any) {
      console.error('Error updating existing question:', error)
      showToast('error', error.response?.data?.message || 'Lỗi khi cập nhật câu hỏi')
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!examState.examData || !examId) return

    setExamState(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      // Step 1: Tạo các question mới (những question có flag isNew = true)
      const newQuestions = examState.examData.questions.filter(q => q.isNew === true)
      for (const question of newQuestions) {
        await createNewQuestion(question)
      }

      // Step 2: Cập nhật thông tin cơ bản của exam
      const updateExamPayload = {
        id: examState.examData.examId,
        title: examState.examData.title,
        description: examState.examData.description,
        duration: examState.examData.duration,
        type: examState.examData.type,
        examScopeType: examState.examData.scope,
        gradingMethod: examState.examData.gradingMethod,
        courseId: examState.examData.courseId,
        chapterId: examState.examData.chapterId,
        unitId: examState.examData.unitId,
        questionIds: [] // Theo yêu cầu API, cần có field này (sẽ được xóa sau khi update)
      }

      // Get auth headers
      const token = localStorage.getItem('access_token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const updateResponse = await axios.put(`http://localhost:8080/api/exams/${examId}`, updateExamPayload, { headers })
      
      if (!updateResponse.data.success) {
        throw new Error(updateResponse.data.message || 'Không thể cập nhật thông tin bài thi')
      }

      // Step 3: Thêm lại danh sách câu hỏi vào exam (vì sau khi update exam, các question sẽ bị mất liên kết)
      if (examState.examData.questions.length > 0) {
        const questionIds = examState.examData.questions.map(q => q.id)

        const addQuestionsResponse = await axios.post(
          `http://localhost:8080/api/exams/${examId}/questions`, 
          questionIds, // Gửi array đơn giản theo format API
          { headers }
        )
        
        if (!addQuestionsResponse.data.success) {
          console.warn('Warning: Could not add questions back to exam:', addQuestionsResponse.data.message)
          // Don't throw error here, just log warning since main exam update succeeded
        }
      }

      showToast('success', 'Cập nhật bài thi thành công!')
      handleBackNavigation()
    } catch (error: any) {
      console.error('Error updating exam:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật bài thi'
      setExamState(prev => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false
      }))
      showToast('error', errorMessage)
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

  const handleBackNavigation = () => {
    if (state && state.scopeId) {
      // Navigate back to the specific detail page based on scope
      switch (state.scope) {
        case 'course':
          navigate(`/staff/courses/${state.scopeId}`)
          break
        case 'chapter':
          navigate(`/staff/courses/${examState.examData?.courseId}/chapters/${state.scopeId}`)
          break
        case 'unit':
          navigate(`/staff/courses/${examState.examData?.courseId}/chapters/${examState.examData?.chapterId}/units/${state.scopeId}`)
          break
        default:
          navigate('/staff/courses')
      }
    } else {
      navigate(-1) // Go back to previous page
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
    if (!examState.examData) return false
    
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
            value={examState.examData?.examId || ''}
            onChange={(e) => handleInputChange('examId', e.target.value)}
            placeholder={`Ví dụ: ${state?.scopeId || 'scopeId'}-exam01, ${state?.scopeId || 'scopeId'}-exam02, ...`}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            ID exam theo nguyên tắc: courseId-chapterId(nếu có)-unitId(nếu có)-số thứ tự 
          </p>
        </div>

        <div>
          <Label htmlFor="title">Tiêu đề exam *</Label>
          <Input
            id="title"
            value={examState.examData?.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Nhập tiêu đề exam"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Mô tả *</Label>
          <Textarea
            id="description"
            value={examState.examData?.description || ''}
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
              value={examState.examData?.duration || 0}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Loại câu hỏi</Label>
            <Input
              id="type"
              value={examState.examData?.type || ''}
              disabled
              className="bg-gray-100"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="gradingMethod">Phương thức chấm</Label>
          <Input
            id="gradingMethod"
            value={examState.examData?.gradingMethod || ''}
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
            Tổng số câu hỏi: <span className="font-semibold">{examState.examData?.questions.length || 0}</span>
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

      <div className={`space-y-4 ${(examState.examData?.questions.length || 0) > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
        {examState.examData?.questions.map((question, index) => (
          <QuestionListItem
            key={question.id}
            question={question}
            index={index}
            onEdit={handleEditQuestionClick}
            onDelete={handleDeleteQuestionClick}
          />
        ))}

        {(!examState.examData?.questions || examState.examData.questions.length === 0) && (
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
              <span className="font-semibold">{examState.examData?.title || 'Chưa nhập'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Exam ID:</span>
              <span className="font-semibold">{examState.examData?.examId || 'Chưa nhập'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Số câu hỏi:</span>
              <span className="font-semibold">{examState.examData?.questions.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Thời gian:</span>
              <span className="font-semibold">{examState.examData?.duration || 0} phút</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Điểm đậu:</span>
              <span className="font-semibold">{examState.examData?.passingScore || 60}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Loại câu hỏi:</span>
              <span className="font-semibold">{examState.examData?.type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Phương thức chấm:</span>
              <span className="font-semibold">{examState.examData?.gradingMethod || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Phạm vi:</span>
              <span className="font-semibold">{getScopeDisplayName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Trạng thái:</span>
              <span className="font-semibold">{examState.examData?.status || 'N/A'}</span>
            </div>
          </div>
        </div>

        {examState.examData?.description && (
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium text-gray-700">Mô tả:</span>
            <p className="text-gray-600 mt-1">{examState.examData.description}</p>
          </div>
        )}

        {examState.examData?.instructions && (
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

  // Loading state
  if (examState.isLoading) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-blue-600 animate-pulse mb-4" />
            <p className="text-xl text-blue-600 font-medium">Đang tải thông tin exam...</p>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  // Error state
  if (examState.error && !examState.examData) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-2">
              <h3 className="font-semibold">Lỗi tải dữ liệu</h3>
              <p className="text-sm mt-1">{examState.error}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={loadExamData} size="sm">
                  Thử lại
                </Button>
                <Button variant="outline" onClick={handleBackNavigation} size="sm">
                  Quay lại
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      </StaffNavigation>
    )
  }

  if (!examState.examData) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">Không tìm thấy exam</p>
            <Button onClick={handleBackNavigation} className="mt-4">
              Quay lại
            </Button>
          </div>
        </div>
      </StaffNavigation>
    )
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
                onClick={handleBackNavigation}
                className="mb-3 bg-transparent flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa Exam</h1>
              <p className="text-gray-600">
                Chỉnh sửa exam cho {getScopeDisplayName().toLowerCase()}: {state?.scopeName}
                {examState.examData.id && (
                  <span className="ml-2 text-sm">
                    (ID: {examState.examData.id})
                  </span>
                )}
              </p>
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
                      disabled={examState.isSubmitting || (examState.examData?.questions.length || 0) === 0}
                    >
                      {examState.isSubmitting ? 'Đang cập nhật...' : 'Cập nhật Exam'}
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

          {/* Question Dialog - commented out temporarily */}
          {/* <QuestionDialog
            isOpen={showQuestionDialog}
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onClose={() => {
              setShowQuestionDialog(false)
              setEditingQuestion(null)
            }}
          /> */}

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
            onSelectQuestions={handleSelectQuestions}
            availableQuestions={availableQuestions}
            availableUnits={allUnits}
            loading={loading}
            searchQuestionId={searchQuestionId}
            setSearchQuestionId={setSearchQuestionId}
            unitFilter={unitFilter}
            setUnitFilter={setUnitFilter}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            setPageSize={setPageSize}
            existingQuestions={examState.examData?.questions || []}
          />
        </div>
      </div>
    </StaffNavigation>
  )
}

// QuestionListItem Component
interface QuestionListItemProps {
  question: ExamQuestion
  index: number
  onEdit: (question: ExamQuestion) => void
  onDelete: (questionId: string) => void
}

const QuestionListItem: React.FC<QuestionListItemProps> = ({ question, index, onEdit, onDelete }) => {
  const getQuestionTypeIcon = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'TRUE_FALSE':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'WRITING':
        return <Edit className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getQuestionTypeName = () => {
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return 'Trắc nghiệm'
      case 'TRUE_FALSE':
        return 'Đúng/Sai'
      case 'WRITING':
        return 'Tự luận'
      default:
        return 'Khác'
    }
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
          </div>
          <div className="flex items-center space-x-2">
            {getQuestionTypeIcon()}
            <Badge variant="outline">{getQuestionTypeName()}</Badge>
            {question.scope && question.scope !== 'GRAMMAR' && (
              <Badge variant="outline">{question.scope}</Badge>
            )}
            {question.isNew && (
              <Badge className="bg-orange-100 text-orange-800">Mới</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(question)}
            className="text-blue-600 hover:bg-blue-50"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(question.id)}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h4 className="font-medium text-gray-900 mb-2">{question.question || question.content}</h4>

      {question.type === 'MULTIPLE_CHOICE' && question.options && question.options.length > 0 && (
        <div className="space-y-1 mb-2">
          {question.options.map((option, optionIndex) => (
            <div
              key={option.id}
              className={`text-sm p-2 rounded flex items-center ${
                option.isCorrect 
                  ? "bg-green-50 text-green-800 border border-green-200" 
                  : "text-gray-600 bg-gray-50"
              }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
              <span className="flex-1">{option.content}</span>
              {option.isCorrect && <CheckCircle className="h-3 w-3 ml-2 text-green-600" />}
            </div>
          ))}
        </div>
      )}

      {question.explanation && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
          <strong>Giải thích:</strong> {question.explanation}
        </div>
      )}
    </div>
  )
}

// ExamSummary Component  
interface ExamSummaryProps {
  examData: ExamData
}

const ExamSummary: React.FC<ExamSummaryProps> = ({ examData }) => {
  const questionsByType = examData.questions.reduce(
    (acc, question) => {
      acc[question.type] = (acc[question.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tổng quan exam</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{examData.questions.length}</div>
            <div className="text-sm text-gray-600">Câu hỏi</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Phân loại câu hỏi</h4>
          {Object.entries(questionsByType).map(([type, count]) => {
            const getQuestionTypeName = (questionType: string) => {
              if (questionType === 'MULTIPLE_CHOICE') return 'Trắc nghiệm'
              if (questionType === 'TRUE_FALSE') return 'Đúng/Sai'
              return 'Tự luận'
            }

            return (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {getQuestionTypeName(type)}
                </span>
                <span className="font-medium">{count}</span>
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Thời gian:</span>
            <span className="font-medium">{examData.duration} phút</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Điểm đạt:</span>
            <span className="font-medium">{examData.passingScore || 60}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Trạng thái:</span>
            <span className="font-medium">{examData.status}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// QuickActions Component
interface QuickActionsProps {
  goTo: (step: number) => void
}

const QuickActions: React.FC<QuickActionsProps> = ({ goTo }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Hành động nhanh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start bg-transparent" 
          onClick={() => goTo(1)}
        >
          <FileText className="h-4 w-4 mr-2" />
          Thông tin cơ bản
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start bg-transparent"
          onClick={() => goTo(2)}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Quản lý câu hỏi
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start bg-transparent"
          onClick={() => goTo(3)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Xem tóm tắt
        </Button>
      </CardContent>
    </Card>
  )
}

// NewQuestionDialog component - full implementation từ StaffCreateQuestion
interface NewQuestionDialogProps {
  isOpen: boolean
  question: ExamQuestion | null
  onSave: (question: ExamQuestion) => void
  onClose: () => void
  allUnits: Unit[]
}

const NewQuestionDialog: React.FC<NewQuestionDialogProps> = ({ 
  isOpen, 
  question, 
  onSave, 
  onClose,
  allUnits
}) => {
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

  const { showToast } = useToast()

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
        unitIds: question.unitIds || []
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
      showToast('error', 'Vui lòng nhập đầy đủ ID và nội dung câu hỏi')
      return
    }

    if (formData.type === 'MULTIPLE_CHOICE') {
      const hasCorrectAnswer = formData.options.some(opt => opt.isCorrect)
      const hasEmptyOption = formData.options.some(opt => !opt.content.trim())

      if (!hasCorrectAnswer || hasEmptyOption) {
        showToast('error', 'Vui lòng điền đầy đủ các lựa chọn và chọn đáp án đúng')
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
      difficulty: 'Trung bình',
      skill: 'Ngữ pháp',
      unitIds: formData.unitIds,
      isNew: !question // Mark as new if creating, not editing
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
                onChange={(e) => {
                  const newQuestionId = e.target.value;
                  setFormData(prev => {
                    // Update question ID and regenerate option IDs if creating new question
                    const updatedOptions = !question && prev.options.length > 0 && newQuestionId
                      ? prev.options.map((option, index) => ({
                          ...option,
                          id: `${newQuestionId}-${index + 1}`
                        }))
                      : prev.options;

                    return {
                      ...prev,
                      id: newQuestionId,
                      options: updatedOptions
                    };
                  });
                }}
                placeholder="Nhập ID câu hỏi"
                className="bg-white/70"
              />
            </div>
            <div>
              <label htmlFor="questionType" className="block text-sm font-medium text-gray-700 mb-1">Loại câu hỏi</label>
              <Input
                id="questionType"
                value="Trắc nghiệm"
                disabled
                className="bg-gray-100 text-gray-600"
              />
            </div>
          </div>

          {/* Scope */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div></div>
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
              multiple={false}
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
  availableQuestions,
  availableUnits,
  loading,
  searchQuestionId,
  setSearchQuestionId,
  unitFilter,
  setUnitFilter,
  currentPage,
  setCurrentPage,
  totalPages,
  totalElements,
  pageSize,
  setPageSize,
  existingQuestions
}: Readonly<{
  isOpen: boolean
  onClose: () => void
  onSelectQuestions: (questions: ExamQuestion[]) => void
  availableQuestions: Question[]
  availableUnits: Unit[]
  loading: boolean
  searchQuestionId: string
  setSearchQuestionId: (value: string) => void
  unitFilter: string
  setUnitFilter: (value: string) => void
  currentPage: number
  setCurrentPage: (value: number) => void
  totalPages: number
  totalElements: number
  pageSize: number
  setPageSize: (value: number) => void
  existingQuestions: ExamQuestion[]
}>) {
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([])

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

  const handleSelectQuestion = (question: Question) => {
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
    // Convert Question to ExamQuestion format
    const examQuestions: ExamQuestion[] = selectedQuestions.map(q => ({
      id: q.id,
      type: q.type,
      question: q.content,
      content: q.content,
      scope: q.scope,
      options: q.options || [],
      explanation: q.explanation,
      difficulty: 'Trung bình' as const,
      skill: 'Ngữ pháp' as const, // Default skill
      unitIds: q.unitIds || []
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

        {/* Filters - cập nhật theo yêu cầu */}
        <div className="p-6 border-b border-gray-200 bg-white/90">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo Question ID..."
                  value={searchQuestionId}
                  onChange={(e) => setSearchQuestionId(e.target.value)}
                  className="pl-10 bg-white/70"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {/* Unit Filter */}
              <div className="w-64">
                <UnitSelector
                  units={availableUnits}
                  selectedUnitIds={unitFilter === "all" ? [] : [unitFilter]}
                  onChange={(unitIds) => setUnitFilter(unitIds.length > 0 ? unitIds[0] : "all")}
                  placeholder="Tất cả units"
                  multiple={false}
                  required={false}
                />
              </div>
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

                        {/* Hiển thị options cho MULTIPLE_CHOICE như StaffCreateQuestion */}
                        {question.type === "MULTIPLE_CHOICE" && question.options && (
                          <div className="space-y-1 mb-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={option.id}
                                className={`text-sm p-2 rounded ${
                                  option.isCorrect ? "bg-green-50 text-green-800 border border-green-200" : "text-gray-600"
                                }`}
                              >
                                <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                                {option.content}
                                {option.isCorrect && <CheckCircle className="h-3 w-3 inline ml-2 text-green-600" />}
                              </div>
                            ))}
                          </div>
                        )}

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

        {/* Pagination - cập nhật theo StaffCreateQuestion */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Hiển thị {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} của {totalElements} câu hỏi
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {/* Page size selector */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(0) // Reset to first page
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 / trang</option>
                  <option value={10}>10 / trang</option>
                  <option value={20}>20 / trang</option>
                  <option value={50}>50 / trang</option>
                </select>
                
                {/* Pagination buttons */}
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                    className="px-2 py-1"
                  >
                    ««
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-2 py-1"
                  >
                    ‹
                  </Button>
                  
                  {/* Page numbers */}
                  {(() => {
                    const pages = []
                    const startPage = Math.max(0, currentPage - 2)
                    const endPage = Math.min(totalPages - 1, currentPage + 2)
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={i === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i)}
                          className={`px-3 py-1 ${i === currentPage ? 'bg-blue-600 text-white' : ''}`}
                        >
                          {i + 1}
                        </Button>
                      )
                    }
                    return pages
                  })()}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-2 py-1"
                  >
                    ›
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-2 py-1"
                  >
                    »»
                  </Button>
                </div>
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
                setSearchQuestionId('')
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

export default StaffUpdateExamPage
