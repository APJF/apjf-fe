import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Label } from '../ui/Label'
import type { ExamQuestion, QuestionType, DifficultyLevel, SkillType, Question } from '../../types/exam'

interface QuestionDialogProps {
  isOpen: boolean
  question: ExamQuestion | null
  onSave: (question: Question) => void
  onClose: () => void
}

const QuestionDialog: React.FC<QuestionDialogProps> = ({
  isOpen,
  question,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<ExamQuestion>({
    id: '',
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

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (question) {
      setFormData(question)
    } else {
      // Reset form for new question
      setFormData({
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
    }
    setErrors({})
  }, [question, isOpen])

  const handleInputChange = (field: keyof ExamQuestion, value: ExamQuestion[keyof ExamQuestion]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleOptionChange = (index: number, field: 'content' | 'isCorrect', value: string | boolean) => {
    const updatedOptions = [...formData.options!]
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    }

    // For multiple choice, only one option can be correct
    if (field === 'isCorrect' && value === true && formData.type === 'MULTIPLE_CHOICE') {
      updatedOptions.forEach((opt, i) => {
        if (i !== index) {
          opt.isCorrect = false
        }
      })
    }

    setFormData(prev => ({
      ...prev,
      options: updatedOptions
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.question.trim()) {
      newErrors.question = 'Câu hỏi không được để trống'
    }

    if (formData.type === 'MULTIPLE_CHOICE') {
      const hasCorrectAnswer = formData.options?.some(opt => opt.isCorrect)
      if (!hasCorrectAnswer) {
        newErrors.options = 'Phải có ít nhất một đáp án đúng'
      }
      
      const hasEmptyOption = formData.options?.some(opt => !opt.content.trim())
      if (hasEmptyOption) {
        newErrors.options = 'Tất cả các lựa chọn phải có nội dung'
      }
    }

    if (formData.type === 'TRUE_FALSE' && !formData.correctAnswer) {
      newErrors.correctAnswer = 'Phải chọn đáp án đúng'
    }

    if (formData.type === 'WRITING' && !formData.correctAnswer?.trim()) {
      newErrors.correctAnswer = 'Phải nhập câu trả lời mẫu'
    }

    if (formData.points <= 0) {
      newErrors.points = 'Điểm phải lớn hơn 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      // Convert ExamQuestion formData to Question format
      const questionToSave: Question = {
        id: formData.id,
        type: formData.type,
        question: formData.question,
        options: formData.options,
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation,
        points: formData.points,
        difficulty: formData.difficulty,
        skill: formData.skill,
        fileUrl: formData.fileUrl
      };
      onSave(questionToSave);
    }
  }

  const handleTypeChange = (newType: QuestionType) => {
    const updatedFormData = { ...formData, type: newType }

    // Reset type-specific fields
    if (newType === 'MULTIPLE_CHOICE') {
      updatedFormData.options = [
        { id: 'opt1', content: '', isCorrect: false },
        { id: 'opt2', content: '', isCorrect: false },
        { id: 'opt3', content: '', isCorrect: false },
        { id: 'opt4', content: '', isCorrect: false }
      ]
      updatedFormData.correctAnswer = ''
    } else {
      // For TRUE_FALSE and WRITING types
      updatedFormData.options = undefined
      updatedFormData.correctAnswer = ''
    }

    setFormData(updatedFormData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-6">
            {question?.id?.startsWith('temp_') || !question ? 'Thêm câu hỏi mới' : 'Chỉnh sửa câu hỏi'}
          </h3>

          <div className="space-y-6">
            {/* Question Type */}
            <div>
              <Label>Loại câu hỏi *</Label>
              <div className="flex gap-4 mt-2">
                {(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'WRITING'] as QuestionType[]).map((type) => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="questionType"
                      value={type}
                      checked={formData.type === type}
                      onChange={() => handleTypeChange(type)}
                    />
                    <span>
                      {type === 'MULTIPLE_CHOICE' && 'Trắc nghiệm'}
                      {type === 'TRUE_FALSE' && 'Đúng/Sai'}
                      {type === 'WRITING' && 'Tự luận'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question Content */}
            <div>
              <Label htmlFor="question">Nội dung câu hỏi *</Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) => handleInputChange('question', e.target.value)}
                placeholder="Nhập nội dung câu hỏi"
                rows={3}
                className={errors.question ? 'border-red-500' : ''}
              />
              {errors.question && <p className="text-red-500 text-sm mt-1">{errors.question}</p>}
            </div>

            {/* Question Options - Multiple Choice */}
            {formData.type === 'MULTIPLE_CHOICE' && (
              <div>
                <Label>Các lựa chọn *</Label>
                <div className="space-y-3 mt-2">
                  {formData.options?.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={option.isCorrect}
                        onChange={() => handleOptionChange(index, 'isCorrect', true)}
                      />
                      <div className="flex-1">
                        <Input
                          value={option.content}
                          onChange={(e) => handleOptionChange(index, 'content', e.target.value)}
                          placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {errors.options && <p className="text-red-500 text-sm mt-1">{errors.options}</p>}
              </div>
            )}

            {/* True/False Options */}
            {formData.type === 'TRUE_FALSE' && (
              <div>
                <Label>Đáp án đúng *</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="trueFalse"
                      value="true"
                      checked={formData.correctAnswer === 'true'}
                      onChange={() => handleInputChange('correctAnswer', 'true')}
                    />
                    <span>Đúng</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="trueFalse"
                      value="false"
                      checked={formData.correctAnswer === 'false'}
                      onChange={() => handleInputChange('correctAnswer', 'false')}
                    />
                    <span>Sai</span>
                  </label>
                </div>
                {errors.correctAnswer && <p className="text-red-500 text-sm mt-1">{errors.correctAnswer}</p>}
              </div>
            )}

            {/* Writing Answer */}
            {formData.type === 'WRITING' && (
              <div>
                <Label htmlFor="correctAnswer">Câu trả lời mẫu *</Label>
                <Textarea
                  id="correctAnswer"
                  value={formData.correctAnswer || ''}
                  onChange={(e) => handleInputChange('correctAnswer', e.target.value)}
                  placeholder="Nhập câu trả lời mẫu"
                  rows={3}
                  className={errors.correctAnswer ? 'border-red-500' : ''}
                />
                {errors.correctAnswer && <p className="text-red-500 text-sm mt-1">{errors.correctAnswer}</p>}
              </div>
            )}

            {/* Question Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="points">Điểm số *</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => handleInputChange('points', parseInt(e.target.value))}
                  className={errors.points ? 'border-red-500' : ''}
                />
                {errors.points && <p className="text-red-500 text-sm mt-1">{errors.points}</p>}
              </div>

              <div>
                <Label htmlFor="difficulty">Độ khó</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value as DifficultyLevel)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Dễ">Dễ</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Khó">Khó</option>
                </select>
              </div>

              <div>
                <Label htmlFor="skill">Kỹ năng</Label>
                <select
                  id="skill"
                  value={formData.skill}
                  onChange={(e) => handleInputChange('skill', e.target.value as SkillType)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Ngữ pháp">Ngữ pháp</option>
                  <option value="Từ vựng">Từ vựng</option>
                  <option value="Kanji">Kanji</option>
                  <option value="Đọc hiểu">Đọc hiểu</option>
                  <option value="Nghe">Nghe</option>
                </select>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <Label htmlFor="explanation">Giải thích (tùy chọn)</Label>
              <Textarea
                id="explanation"
                value={formData.explanation || ''}
                onChange={(e) => handleInputChange('explanation', e.target.value)}
                placeholder="Giải thích đáp án hoặc cách giải"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {question?.id?.startsWith('temp_') || !question ? 'Thêm câu hỏi' : 'Cập nhật câu hỏi'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionDialog
