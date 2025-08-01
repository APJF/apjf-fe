import axios from '../api/axios'
import type { ExamData, ExamSummary } from '../types/exam'

export class StaffExamService {
  private static readonly BASE_URL = '/api/staff/exams'

  // Tạo exam mới
  static async createExam(examData: ExamData): Promise<ExamData> {
    const token = localStorage.getItem('token')
    const response = await axios.post(this.BASE_URL, examData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  }

  // Lấy danh sách exam theo scope
  static async getExamsByScope(scope: 'course' | 'chapter' | 'unit', scopeId: string): Promise<ExamSummary[]> {
    const token = localStorage.getItem('token')
    
    // Mock data for development - replace with real API call later
    const mockExamSummaries: ExamSummary[] = [
      {
        id: 'exam-1',
        title: `Kiểm tra giữa kỳ ${scope === 'course' ? 'N5' : scope === 'chapter' ? 'Chương' : 'Bài'}`,
        description: `Bài kiểm tra đánh giá kiến thức cơ bản cho ${scope}`,
        duration: 45,
        totalPoints: 100,
        questionCount: 20,
        difficulty: 'Trung bình',
        level: 'N5',
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'exam-2',
        title: `Kiểm tra cuối kỳ ${scope === 'course' ? 'N5' : scope === 'chapter' ? 'Chương' : 'Bài'}`,
        description: `Bài kiểm tra tổng hợp toàn bộ ${scope}`,
        duration: 60,
        totalPoints: 150,
        questionCount: 30,
        difficulty: 'Khó',
        level: 'N5', 
        status: 'INACTIVE',
        createdAt: new Date().toISOString()
      }
    ];

    // For now, return mock data. Later replace with real API call:
    // const response = await axios.get(`${this.BASE_URL}/${scope}/${scopeId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${token}`
    //   }
    // })
    // return response.data
    
    return Promise.resolve(mockExamSummaries)
  }

  // Lấy chi tiết exam
  static async getExamById(examId: string): Promise<ExamData> {
    const token = localStorage.getItem('token')
    
    // Mock data for development - replace with real API call later
    const mockExamData: ExamData = {
      id: examId,
      title: 'Kiểm tra giữa kỳ N5 - Ngữ pháp cơ bản',
      description: 'Bài kiểm tra đánh giá kiến thức ngữ pháp cơ bản của học viên trong khóa học N5',
      courseId: '1',
      chapterId: undefined,
      unitId: undefined,
      scope: 'course',
      duration: 45,
      totalPoints: 25,
      passingScore: 70,
      difficulty: 'Trung bình',
      level: 'N5',
      instructions: 'Đọc kỹ từng câu hỏi trước khi chọn đáp án. Mỗi câu hỏi chỉ có một đáp án đúng. Bạn có 45 phút để hoàn thành bài thi.',
      questions: [
        {
          id: 'q1',
          type: 'MULTIPLE_CHOICE',
          question: 'Từ "こんにちは" trong tiếng Nhật có nghĩa là gì?',
          options: [
            { id: 'opt1', content: 'Xin chào', isCorrect: true },
            { id: 'opt2', content: 'Tạm biệt', isCorrect: false },
            { id: 'opt3', content: 'Cảm ơn', isCorrect: false },
            { id: 'opt4', content: 'Xin lỗi', isCorrect: false },
          ],
          explanation: '"こんにちは" (konnichiwa) là cách chào hỏi phổ biến trong tiếng Nhật, có nghĩa là "Xin chào".',
          points: 2,
          difficulty: 'Dễ',
          skill: 'Từ vựng',
        },
        {
          id: 'q2',
          type: 'MULTIPLE_CHOICE',
          question: 'Câu "私は学生です" có nghĩa là gì?',
          options: [
            { id: 'opt1', content: 'Tôi là học sinh', isCorrect: true },
            { id: 'opt2', content: 'Tôi là giáo viên', isCorrect: false },
            { id: 'opt3', content: 'Tôi là bác sĩ', isCorrect: false },
            { id: 'opt4', content: 'Tôi là công nhân', isCorrect: false },
          ],
          explanation: '"私は学生です" có nghĩa là "Tôi là học sinh". 学生 (gakusei) có nghĩa là học sinh/sinh viên.',
          points: 3,
          difficulty: 'Trung bình',
          skill: 'Ngữ pháp',
        },
        {
          id: 'q3',
          type: 'TRUE_FALSE',
          question: 'Kanji "水" có nghĩa là nước.',
          correctAnswer: 'true',
          explanation: 'Kanji "水" (mizu) có nghĩa là nước. Đây là một trong những kanji cơ bản nhất.',
          points: 2,
          difficulty: 'Dễ',
          skill: 'Kanji',
        },
      ],
      settings: {
        shuffleQuestions: false,
        shuffleOptions: true,
        showResults: true,
        allowRetake: true,
        timeLimit: true,
      },
      status: 'ACTIVE',
      createdAt: '2024-03-15T10:30:00Z',
      updatedAt: '2024-03-20T14:45:00Z',
    }

    // For now, return mock data. Later replace with real API call:
    // const response = await axios.get(`${this.BASE_URL}/${examId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${token}`
    //   }
    // })
    // return response.data
    
    return Promise.resolve(mockExamData)
  }

  // Cập nhật exam
  static async updateExam(examId: string, examData: Partial<ExamData>): Promise<ExamData> {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${this.BASE_URL}/${examId}`, examData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  }

  // Xóa exam
  static async deleteExam(examId: string): Promise<void> {
    const token = localStorage.getItem('token')
    await axios.delete(`${this.BASE_URL}/${examId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }

  // Thay đổi trạng thái exam
  static async updateExamStatus(examId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<ExamData> {
    const token = localStorage.getItem('token')
    const response = await axios.patch(`${this.BASE_URL}/${examId}/status`, { status }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  }

  // Upload media cho câu hỏi
  static async uploadMedia(file: File): Promise<string> {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post('/api/upload/media', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.url
  }
}
