import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import QuestionDialog from '../components/exam/QuestionDialog'
import { StaffNavigation } from '../components/layout/StaffNavigation'
import { StaffExamService } from '../services/staffExamService'
import type { ExamData, ExamQuestion } from '../types/exam'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  FileText,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  XCircle,
  Play,
  Settings,
  AlertTriangle,
  Copy,
  Archive,
} from 'lucide-react'

export const StaffUpdateExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [currentStep, setCurrentStep] = useState<'basic' | 'questions' | 'settings' | 'preview'>('basic')
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Get scope information from navigation state
  const { scope, scopeId, scopeName } = location.state || {}

  // Load exam data
  useEffect(() => {
    const loadExamData = async () => {
      if (!examId) {
        setError('ID bài thi không hợp lệ')
        return
      }

      setIsLoading(true)
      try {
        const data = await StaffExamService.getExamById(examId)
        setExamData(data)
        setError(null)
      } catch (error) {
        console.error('Error loading exam:', error)
        setError('Không thể tải thông tin bài thi')
      } finally {
        setIsLoading(false)
      }
    }

    loadExamData()
  }, [examId])

  const updateExamData = (field: keyof ExamData, value: any) => {
    if (!examData) return
    
    setExamData(prev => prev ? {
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString(),
    } : null)
    setHasUnsavedChanges(true)
  }

  const addQuestion = (question: ExamQuestion) => {
    if (!examData) return
    
    setExamData(prev => prev ? {
      ...prev,
      questions: [...prev.questions, question],
      totalPoints: prev.totalPoints + question.points,
      updatedAt: new Date().toISOString(),
    } : null)
    setHasUnsavedChanges(true)
  }

  const updateQuestion = (questionId: string, updatedQuestion: ExamQuestion) => {
    if (!examData) return
    
    setExamData(prev => {
      if (!prev) return null
      const oldQuestion = prev.questions.find(q => q.id === questionId)
      const pointsDiff = updatedQuestion.points - (oldQuestion?.points || 0)

      return {
        ...prev,
        questions: prev.questions.map(q => q.id === questionId ? updatedQuestion : q),
        totalPoints: prev.totalPoints + pointsDiff,
        updatedAt: new Date().toISOString(),
      }
    })
    setHasUnsavedChanges(true)
  }

  const deleteQuestion = (questionId: string) => {
    if (!examData) return
    
    const question = examData.questions.find(q => q.id === questionId)
    if (question) {
      setExamData(prev => prev ? {
        ...prev,
        questions: prev.questions.filter(q => q.id !== questionId),
        totalPoints: prev.totalPoints - question.points,
        updatedAt: new Date().toISOString(),
      } : null)
      setHasUnsavedChanges(true)
    }
    setShowDeleteConfirm(null)
  }

  const duplicateQuestion = (questionId: string) => {
    if (!examData) return
    
    const question = examData.questions.find(q => q.id === questionId)
    if (question) {
      const duplicatedQuestion = {
        ...question,
        id: `${question.id}_copy_${Date.now()}`,
        question: `${question.question} (Bản sao)`,
      }
      addQuestion(duplicatedQuestion)
    }
  }

  const handleSaveExam = async () => {
    if (!examData || !examId) return

    try {
      await StaffExamService.updateExam(examId, examData)
      setHasUnsavedChanges(false)
      setSuccessMessage('Bài thi đã được cập nhật thành công!')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      console.error('Error saving exam:', error)
      setError('Không thể lưu bài thi')
    }
  }

  const handlePublishExam = async () => {
    if (!examData || !examId) return

    try {
      await StaffExamService.updateExamStatus(examId, 'ACTIVE')
      setExamData(prev => prev ? { ...prev, status: 'ACTIVE' } : null)
      setSuccessMessage('Bài thi đã được kích hoạt thành công!')
    } catch (error) {
      console.error('Error publishing exam:', error)
      setError('Không thể kích hoạt bài thi')
    }
  }

  const handleArchiveExam = async () => {
    if (!examData || !examId) return

    try {
      await StaffExamService.updateExamStatus(examId, 'INACTIVE')
      setExamData(prev => prev ? { ...prev, status: 'INACTIVE' } : null)
      setSuccessMessage('Bài thi đã được vô hiệu hóa!')
    } catch (error) {
      console.error('Error archiving exam:', error)
      setError('Không thể vô hiệu hóa bài thi')
    }
  }

  const handleBackNavigation = () => {
    if (scope && scopeId) {
      // Navigate back to the specific detail page based on scope
      switch (scope) {
        case 'course':
          navigate(`/staff/courses/${scopeId}`)
          break
        case 'chapter':
          navigate(`/staff/courses/${examData?.courseId}/chapters/${scopeId}`)
          break
        case 'unit':
          navigate(`/staff/courses/${examData?.courseId}/chapters/${examData?.chapterId}/units/${scopeId}`)
          break
        default:
          navigate('/staff/courses')
      }
    } else {
      navigate(-1) // Go back to previous page
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đã kích hoạt'
      case 'INACTIVE':
        return 'Chưa kích hoạt'
      default:
        return 'Không xác định'
    }
  }

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'basic':
        return <FileText className="h-4 w-4" />
      case 'questions':
        return <BookOpen className="h-4 w-4" />
      case 'settings':
        return <Settings className="h-4 w-4" />
      case 'preview':
        return <Eye className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const isStepComplete = (step: string) => {
    if (!examData) return false
    
    switch (step) {
      case 'basic':
        return examData.title && examData.description
      case 'questions':
        return examData.questions.length > 0
      case 'settings':
        return true
      case 'preview':
        return true
      default:
        return false
    }
  }

  if (isLoading) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto text-blue-600 animate-pulse mb-4" />
            <p className="text-xl text-blue-600 font-medium">Đang tải thông tin bài thi...</p>
          </div>
        </div>
      </StaffNavigation>
    )
  }

  if (error && !examData) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <div className="ml-2">
              <h3 className="font-semibold">Lỗi tải dữ liệu</h3>
              <p className="text-sm mt-1">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => window.location.reload()} size="sm">
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

  if (!examData) {
    return (
      <StaffNavigation>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600">Không tìm thấy bài thi</p>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={handleBackNavigation} className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Quay lại</span>
                </Button>
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa bài thi</h1>
                    <Badge className={getStatusColor(examData.status)}>
                      {getStatusText(examData.status)}
                    </Badge>
                    {hasUnsavedChanges && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Có thay đổi chưa lưu
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600">
                    ID: {examData.id} • Cập nhật lần cuối: {examData.updatedAt ? new Date(examData.updatedAt).toLocaleString('vi-VN') : 'Chưa cập nhật'}
                  </p>
                  {scopeName && (
                    <p className="text-sm text-blue-600">
                      Phạm vi: {scopeName} ({scope})
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleSaveExam} className="bg-transparent">
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </Button>
                {examData.status === 'INACTIVE' && (
                  <Button onClick={handlePublishExam} className="bg-green-600 hover:bg-green-700">
                    <Play className="h-4 w-4 mr-2" />
                    Kích hoạt
                  </Button>
                )}
                {examData.status === 'ACTIVE' && (
                  <Button variant="outline" onClick={handleArchiveExam} className="bg-transparent">
                    <Archive className="h-4 w-4 mr-2" />
                    Vô hiệu hóa
                  </Button>
                )}
              </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <Alert className="bg-green-50 border-green-200 text-green-800 mt-4">
                <CheckCircle className="h-4 w-4" />
                <div className="ml-2">{successMessage}</div>
              </Alert>
            )}
            {error && (
              <Alert className="bg-red-50 border-red-200 text-red-800 mt-4">
                <XCircle className="h-4 w-4" />
                <div className="ml-2">{error}</div>
              </Alert>
            )}
          </div>

          {/* Progress Steps */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {['basic', 'questions', 'settings', 'preview'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(step as any)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        currentStep === step
                          ? 'bg-blue-600 text-white'
                          : isStepComplete(step)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getStepIcon(step)}
                      <span className="font-medium">
                        {step === 'basic' && 'Thông tin cơ bản'}
                        {step === 'questions' && 'Câu hỏi'}
                        {step === 'settings' && 'Cài đặt'}
                        {step === 'preview' && 'Xem trước'}
                      </span>
                      {isStepComplete(step) && currentStep !== step && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                    {index < 3 && <div className="w-8 h-0.5 bg-gray-300 mx-2" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {currentStep === 'basic' && (
                <BasicInfoStep 
                  examData={examData} 
                  updateExamData={updateExamData}
                />
              )}
              {currentStep === 'questions' && (
                <QuestionsStep
                  examData={examData}
                  onAddQuestion={() => {
                    setEditingQuestion(null)
                    setShowQuestionDialog(true)
                  }}
                  onEditQuestion={(question) => {
                    setEditingQuestion(question)
                    setShowQuestionDialog(true)
                  }}
                  onDeleteQuestion={(questionId) => setShowDeleteConfirm(questionId)}
                  onDuplicateQuestion={duplicateQuestion}
                />
              )}
              {currentStep === 'settings' && (
                <SettingsStep examData={examData} updateExamData={updateExamData} />
              )}
              {currentStep === 'preview' && (
                <PreviewStep examData={examData} />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ExamSummary examData={examData} />
              <QuickActions setCurrentStep={setCurrentStep} />
            </div>
          </div>

          {/* Question Dialog */}
          <QuestionDialog
            isOpen={showQuestionDialog}
            question={editingQuestion}
            onSave={(question: ExamQuestion) => {
              if (editingQuestion) {
                updateQuestion(editingQuestion.id, question)
              } else {
                addQuestion(question)
              }
              setShowQuestionDialog(false)
              setEditingQuestion(null)
            }}
            onClose={() => {
              setShowQuestionDialog(false)
              setEditingQuestion(null)
            }}
          />

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Xác nhận xóa câu hỏi</h3>
                <p className="text-gray-600 mb-6">
                  Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.
                </p>
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="bg-transparent"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={() => showDeleteConfirm && deleteQuestion(showDeleteConfirm)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Xóa câu hỏi
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StaffNavigation>
  )
}

// Basic Info Step Component
interface BasicInfoStepProps {
  examData: ExamData
  updateExamData: (field: keyof ExamData, value: any) => void
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ examData, updateExamData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cơ bản</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tên bài thi <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="VD: Kiểm tra giữa kỳ N5"
              value={examData.title}
              onChange={(e) => updateExamData('title', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Trình độ</label>
            <select
              value={examData.level}
              onChange={(e) => updateExamData('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Mô tả</label>
          <Textarea
            placeholder="Mô tả về nội dung và mục tiêu của bài thi..."
            value={examData.description}
            onChange={(e) => updateExamData('description', e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Thời gian (phút)</label>
            <Input
              type="number"
              value={examData.duration}
              onChange={(e) => updateExamData('duration', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Điểm đạt (%)</label>
            <Input
              type="number"
              value={examData.passingScore}
              onChange={(e) => updateExamData('passingScore', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Độ khó</label>
            <select
              value={examData.difficulty}
              onChange={(e) => updateExamData('difficulty', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Dễ">Dễ</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Khó">Khó</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Hướng dẫn làm bài</label>
          <Textarea
            placeholder="Hướng dẫn chi tiết cho học viên về cách làm bài thi..."
            value={examData.instructions}
            onChange={(e) => updateExamData('instructions', e.target.value)}
            rows={4}
          />
        </div>

        {/* Exam Metadata */}
        <div className="pt-4 border-t">
          <h3 className="font-medium text-gray-900 mb-3">Thông tin bài thi</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">ID bài thi: </span>
              <span className="font-medium">{examData.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Trạng thái: </span>
              <Badge className={getStatusColor(examData.status)}>{getStatusText(examData.status)}</Badge>
            </div>
            <div>
              <span className="text-gray-600">Tạo lúc: </span>
              <span className="font-medium">{examData.createdAt ? new Date(examData.createdAt).toLocaleString('vi-VN') : 'Chưa xác định'}</span>
            </div>
            <div>
              <span className="text-gray-600">Cập nhật: </span>
              <span className="font-medium">{examData.updatedAt ? new Date(examData.updatedAt).toLocaleString('vi-VN') : 'Chưa cập nhật'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Questions Step Component
interface QuestionsStepProps {
  examData: ExamData
  onAddQuestion: () => void
  onEditQuestion: (question: ExamQuestion) => void
  onDeleteQuestion: (questionId: string) => void
  onDuplicateQuestion: (questionId: string) => void
}

const QuestionsStep: React.FC<QuestionsStepProps> = ({
  examData,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
}) => {
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'TRUE_FALSE':
        return <XCircle className="h-4 w-4 text-green-600" />
      case 'WRITING':
        return <Edit className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getQuestionTypeName = (type: string) => {
    switch (type) {
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Dễ':
        return 'bg-green-100 text-green-800'
      case 'Trung bình':
        return 'bg-yellow-100 text-yellow-800'
      case 'Khó':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Câu hỏi ({examData.questions.length})</CardTitle>
          <Button onClick={onAddQuestion} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Thêm câu hỏi
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {examData.questions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có câu hỏi nào</h3>
            <p className="text-gray-600 mb-4">Bắt đầu tạo câu hỏi đầu tiên cho bài thi của bạn</p>
            <Button onClick={onAddQuestion} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Thêm câu hỏi đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {examData.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getQuestionTypeIcon(question.type)}
                      <Badge variant="outline">{getQuestionTypeName(question.type)}</Badge>
                      <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
                      <Badge variant="outline">{question.skill}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{question.points} điểm</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDuplicateQuestion(question.id)}
                      className="text-gray-600 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditQuestion(question)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteQuestion(question.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>

                {question.type === 'MULTIPLE_CHOICE' && question.options && (
                  <div className="space-y-1">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={option.id}
                        className={`text-sm p-2 rounded ${
                          option.isCorrect 
                            ? 'bg-green-50 text-green-800 border border-green-200' 
                            : 'text-gray-600'
                        }`}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                        {option.content}
                        {option.isCorrect && <CheckCircle className="h-3 w-3 inline ml-2 text-green-600" />}
                      </div>
                    ))}
                  </div>
                )}

                {question.type === 'TRUE_FALSE' && (
                  <div className="text-sm text-gray-600">
                    Đáp án đúng:{' '}
                    <span className="font-medium">{question.correctAnswer === 'true' ? 'Đúng' : 'Sai'}</span>
                  </div>
                )}

                {question.type === 'WRITING' && (
                  <div className="text-sm text-gray-600">
                    Đáp án mẫu: <span className="font-medium">{question.correctAnswer}</span>
                  </div>
                )}

                {question.explanation && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    <strong>Giải thích:</strong> {question.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Settings Step Component
interface SettingsStepProps {
  examData: ExamData
  updateExamData: (field: keyof ExamData, value: any) => void
}

const SettingsStep: React.FC<SettingsStepProps> = ({ examData, updateExamData }) => {
  const updateSetting = (key: keyof ExamData['settings'], value: boolean) => {
    updateExamData('settings', {
      ...examData.settings,
      [key]: value,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt bài thi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Xáo trộn câu hỏi</h4>
              <p className="text-sm text-gray-600">Thay đổi thứ tự câu hỏi cho mỗi lần thi</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={examData.settings.shuffleQuestions}
                onChange={(e) => updateSetting('shuffleQuestions', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Xáo trộn đáp án</h4>
              <p className="text-sm text-gray-600">Thay đổi thứ tự các lựa chọn trong câu trắc nghiệm</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={examData.settings.shuffleOptions}
                onChange={(e) => updateSetting('shuffleOptions', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Hiển thị kết quả</h4>
              <p className="text-sm text-gray-600">Cho phép học viên xem kết quả sau khi hoàn thành</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={examData.settings.showResults}
                onChange={(e) => updateSetting('showResults', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Cho phép làm lại</h4>
              <p className="text-sm text-gray-600">Học viên có thể làm lại bài thi nhiều lần</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={examData.settings.allowRetake}
                onChange={(e) => updateSetting('allowRetake', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Giới hạn thời gian</h4>
              <p className="text-sm text-gray-600">Áp dụng giới hạn thời gian cho bài thi</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={examData.settings.timeLimit}
                onChange={(e) => updateSetting('timeLimit', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Preview Step Component
const PreviewStep: React.FC<{ examData: ExamData }> = ({ examData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Xem trước bài thi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{examData.title}</h2>
          <p className="text-gray-600 mb-4">{examData.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{examData.duration}</div>
              <div className="text-sm text-gray-600">Phút</div>
            </div>
            <div className="text-center">
              <FileText className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{examData.questions.length}</div>
              <div className="text-sm text-gray-600">Câu hỏi</div>
            </div>
            <div className="text-center">
              <Target className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{examData.totalPoints}</div>
              <div className="text-sm text-gray-600">Điểm</div>
            </div>
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-gray-900">{examData.passingScore}%</div>
              <div className="text-sm text-gray-600">Điểm đạt</div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge className="bg-green-100 text-green-800">{examData.level}</Badge>
            <Badge className="bg-blue-100 text-blue-800">{examData.difficulty}</Badge>
            <Badge className={getStatusColor(examData.status)}>{getStatusText(examData.status)}</Badge>
          </div>
        </div>

        {examData.instructions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Hướng dẫn làm bài</h3>
            <p className="text-gray-700">{examData.instructions}</p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Danh sách câu hỏi</h3>
          {examData.questions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-blue-600">Câu {index + 1}:</span>
                <Badge variant="outline">
                  {question.type === 'MULTIPLE_CHOICE'
                    ? 'Trắc nghiệm'
                    : question.type === 'TRUE_FALSE'
                      ? 'Đúng/Sai'
                      : 'Tự luận'}
                </Badge>
                <Badge className="bg-gray-100 text-gray-800">{question.points} điểm</Badge>
              </div>
              <p className="text-gray-900">{question.question}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Exam Summary Sidebar Component
const ExamSummary: React.FC<{ examData: ExamData }> = ({ examData }) => {
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
        <CardTitle className="text-lg">Tổng quan bài thi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{examData.questions.length}</div>
            <div className="text-sm text-gray-600">Câu hỏi</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{examData.totalPoints}</div>
            <div className="text-sm text-gray-600">Tổng điểm</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Phân loại câu hỏi</h4>
          {Object.entries(questionsByType).map(([type, count]) => (
            <div key={type} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : type === 'TRUE_FALSE' ? 'Đúng/Sai' : 'Tự luận'}
              </span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Thời gian:</span>
            <span className="font-medium">{examData.duration} phút</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Điểm đạt:</span>
            <span className="font-medium">{examData.passingScore}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Độ khó:</span>
            <span className="font-medium">{examData.difficulty}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Actions Sidebar Component
interface QuickActionsProps {
  setCurrentStep: (step: 'basic' | 'questions' | 'settings' | 'preview') => void
}

const QuickActions: React.FC<QuickActionsProps> = ({ setCurrentStep }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Hành động nhanh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start bg-transparent" 
          onClick={() => setCurrentStep('basic')}
        >
          <FileText className="h-4 w-4 mr-2" />
          Thông tin cơ bản
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start bg-transparent"
          onClick={() => setCurrentStep('questions')}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Quản lý câu hỏi
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start bg-transparent"
          onClick={() => setCurrentStep('settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Cài đặt bài thi
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start bg-transparent"
          onClick={() => setCurrentStep('preview')}
        >
          <Eye className="h-4 w-4 mr-2" />
          Xem trước
        </Button>
      </CardContent>
    </Card>
  )
}

// Helper functions
function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'INACTIVE':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Đã kích hoạt'
    case 'INACTIVE':
      return 'Chưa kích hoạt'
    default:
      return 'Không xác định'
  }
}

export default StaffUpdateExamPage
