import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Label } from '../../components/ui/Label'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Alert } from '../../components/ui/Alert'
import { StaffExamService } from '../../services/staffExamService'
import QuestionDialog from '../../components/exam/QuestionDialog'
import type { ExamData, ExamQuestion, DifficultyLevel, JLPTLevel, ExamScope } from '../../types/exam'

interface ExamCreationState {
  currentStep: number
  examData: ExamData
  isSubmitting: boolean
  error: string | null
}

interface LocationState {
  scope: ExamScope
  scopeId: string
  scopeName: string
}

const StaffCreateExamPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState

  const [examState, setExamState] = useState<ExamCreationState>({
    currentStep: 1,
    examData: {
      title: '',
      description: '',
      courseId: state?.scope === 'course' ? state.scopeId : undefined,
      chapterId: state?.scope === 'chapter' ? state.scopeId : undefined,
      unitId: state?.scope === 'unit' ? state.scopeId : undefined,
      scope: state?.scope || 'course',
      duration: 60,
      totalPoints: 100,
      passingScore: 70,
      difficulty: 'Trung bình',
      level: 'N5',
      instructions: '',
      questions: [],
      settings: {
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: true,
        allowRetake: false,
        timeLimit: true
      },
      status: 'ACTIVE'
    },
    isSubmitting: false,
    error: null
  })

  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)

  const handleInputChange = (field: keyof ExamData, value: any) => {
    setExamState(prev => ({
      ...prev,
      examData: {
        ...prev.examData,
        [field]: value
      }
    }))
  }

  const handleSettingsChange = (setting: string, value: boolean) => {
    setExamState(prev => ({
      ...prev,
      examData: {
        ...prev.examData,
        settings: {
          ...prev.examData.settings,
          [setting]: value
        }
      }
    }))
  }

  const createNewQuestion = (): ExamQuestion => ({
    id: `temp_${Date.now()}`,
    type: 'MULTIPLE_CHOICE',
    question: '',
    options: [
      { id: 'opt1', content: '', isCorrect: false },
      { id: 'opt2', content: '', isCorrect: false },
      { id: 'opt3', content: '', isCorrect: false },
      { id: 'opt4', content: '', isCorrect: false }
    ],
    correctAnswer: '',
    explanation: '',
    points: 10,
    difficulty: 'Trung bình',
    skill: 'Ngữ pháp'
  })

  const handleAddQuestion = () => {
    const newQuestion = createNewQuestion()
    setEditingQuestion(newQuestion)
    setShowQuestionDialog(true)
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
      await StaffExamService.createExam(examState.examData)
      navigate('/staff/courses')
    } catch (error: any) {
      setExamState(prev => ({
        ...prev,
        error: error.response?.data?.message || 'Có lỗi xảy ra khi tạo exam',
        isSubmitting: false
      }))
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

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
            ${examState.currentStep >= step 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'border-gray-300 text-gray-500'}`}>
            {step}
          </div>
          {step < 3 && (
            <div className={`w-16 h-0.5 ${examState.currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )

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
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            value={examState.examData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Mô tả về exam này"
            rows={3}
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
            <Label htmlFor="totalPoints">Tổng điểm *</Label>
            <Input
              id="totalPoints"
              type="number"
              min="1"
              value={examState.examData.totalPoints}
              onChange={(e) => handleInputChange('totalPoints', parseInt(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="passingScore">Điểm đậu (%)</Label>
            <Input
              id="passingScore"
              type="number"
              min="0"
              max="100"
              value={examState.examData.passingScore}
              onChange={(e) => handleInputChange('passingScore', parseInt(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Độ khó</Label>
            <select
              id="difficulty" 
              value={examState.examData.difficulty}
              onChange={(e) => handleInputChange('difficulty', e.target.value as DifficultyLevel)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="Dễ">Dễ</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Khó">Khó</option>
            </select>
          </div>

          <div>
            <Label htmlFor="level">Cấp độ JLPT</Label>
            <select
              id="level"
              value={examState.examData.level}
              onChange={(e) => handleInputChange('level', e.target.value as JLPTLevel)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="N5">N5</option>
              <option value="N4">N4</option>
              <option value="N3">N3</option>
              <option value="N2">N2</option>
              <option value="N1">N1</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="instructions">Hướng dẫn làm bài</Label>
          <Textarea
            id="instructions"
            value={examState.examData.instructions}
            onChange={(e) => handleInputChange('instructions', e.target.value)}
            placeholder="Hướng dẫn chi tiết cho học viên"
            rows={4}
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
          <p className="text-gray-600">
            Tổng điểm: <span className="font-semibold">
              {examState.examData.questions.reduce((sum, q) => sum + q.points, 0)}
            </span>
          </p>
        </div>
        <Button onClick={handleAddQuestion}>
          + Thêm câu hỏi
        </Button>
      </div>

      <div className="space-y-4">
        {examState.examData.questions.map((question, index) => (
          <Card key={question.id} className="p-4 border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{question.type}</Badge>
                  <Badge variant="outline">{question.difficulty}</Badge>
                  <Badge variant="outline">{question.skill}</Badge>
                  <span className="text-sm text-gray-500">{question.points} điểm</span>
                </div>
                <p className="font-medium mb-2">Câu {index + 1}: {question.question}</p>
                {question.type === 'MULTIPLE_CHOICE' && (
                  <div className="text-sm text-gray-600">
                    {question.options?.map((opt, i) => (
                      <p key={opt.id} className={opt.isCorrect ? 'text-green-600 font-medium' : ''}>
                        {String.fromCharCode(65 + i)}. {opt.content}
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
                  onClick={() => {
                    setEditingQuestion(question)
                    setShowQuestionDialog(true)
                  }}
                >
                  Sửa
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const updatedQuestions = examState.examData.questions.filter((_, i) => i !== index)
                    handleInputChange('questions', updatedQuestions)
                  }}
                >
                  Xóa
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {examState.examData.questions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</p>
          </div>
        )}
      </div>
    </Card>
  )

  const renderStep3 = () => (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">Cài đặt exam</h3>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">Cài đặt hiển thị</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={examState.examData.settings.shuffleQuestions}
                  onChange={(e) => handleSettingsChange('shuffleQuestions', e.target.checked)}
                  className="rounded"
                />
                <span>Trộn thứ tự câu hỏi</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={examState.examData.settings.shuffleOptions}
                  onChange={(e) => handleSettingsChange('shuffleOptions', e.target.checked)}
                  className="rounded"
                />
                <span>Trộn thứ tự đáp án</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={examState.examData.settings.showResults}
                  onChange={(e) => handleSettingsChange('showResults', e.target.checked)}
                  className="rounded"
                />
                <span>Hiển thị kết quả sau khi hoàn thành</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Cài đặt thực hiện</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={examState.examData.settings.allowRetake}
                  onChange={(e) => handleSettingsChange('allowRetake', e.target.checked)}
                  className="rounded"
                />
                <span>Cho phép làm lại</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={examState.examData.settings.timeLimit}
                  onChange={(e) => handleSettingsChange('timeLimit', e.target.checked)}
                  className="rounded"
                />
                <span>Giới hạn thời gian</span>
              </label>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium mb-4">Tóm tắt exam</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Tiêu đề:</span> {examState.examData.title}</p>
                <p><span className="font-medium">Số câu hỏi:</span> {examState.examData.questions.length}</p>
                <p><span className="font-medium">Thời gian:</span> {examState.examData.duration} phút</p>
                <p><span className="font-medium">Tổng điểm:</span> {examState.examData.totalPoints}</p>
              </div>
              <div>
                <p><span className="font-medium">Điểm đậu:</span> {examState.examData.passingScore}%</p>
                <p><span className="font-medium">Độ khó:</span> {examState.examData.difficulty}</p>
                <p><span className="font-medium">Cấp độ:</span> {examState.examData.level}</p>
                <p><span className="font-medium">Phạm vi:</span> {getScopeDisplayName()}</p>
              </div>
            </div>
          </div>
        </div>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            ← Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Tạo Exam Mới</h1>
          <p className="text-gray-600 mt-2">
            Tạo exam cho {getScopeDisplayName().toLowerCase()}: {state?.scopeName}
          </p>
        </div>

        {examState.error && (
          <Alert variant="destructive" className="mb-6">
            {examState.error}
          </Alert>
        )}

        {renderStepIndicator()}

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
                disabled={!examState.examData.title}
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
      </div>
    </div>
  )
}

export default StaffCreateExamPage
