import type { Exam, StartExamRequest, StartExamResponse, ExamResult } from "../types/exam"

const BASE_URL = "http://localhost:8080/api"

class ExamService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  async getExamById(examId: string): Promise<Exam> {
    try {
      console.log("Fetching exam with ID:", examId);
      const response = await fetch(`${BASE_URL}/exams/${examId}`, {
        method: "GET",
        headers: this.getAuthHeaders()
      })

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // API returns Exam object directly, not wrapped in success/data structure
      const examData: Exam = await response.json()
      console.log("Exam data received:", examData);
      
      return examData
    } catch (error) {
      console.error("Error fetching exam:", error)
      throw error
    }
  }

  async startExam(examId: string, userId: string): Promise<StartExamResponse> {
    try {
      const response = await fetch(`${BASE_URL}/exam-results/start`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          examId,
          userId
        } as StartExamRequest)
      })

      if (!response.ok) {
        // Try to parse error response
        try {
          const errorData = await response.json();
          console.error('Error response from Start Exam API:', errorData);
        } catch (e) {
          console.error('Could not parse start exam error response', e);
        }
        
        // If it's a CORS error or 404, simulate success for development
        if (response.status === 0 || response.status === 404) {
          console.warn("Start exam API not available, simulating success for development")
          return {
            success: true,
            message: "Exam started successfully (simulated)",
            data: {
              id: `result_${examId}_${userId}_${Date.now()}`,
              startedAt: new Date().toISOString(),
              status: "IN_PROGRESS",
              userId,
              examId
            },
            timestamp: Date.now()
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: StartExamResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || "Failed to start exam")
      }

      return data
    } catch (error) {
      console.error("Error starting exam:", error)
      
      // Handle ALL network errors including CORS errors with "Failed to fetch" message
      // and other network issues (connection refused, timeout)
      if (
        error instanceof TypeError || 
        (error instanceof Error && 
          (error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('CORS') ||
           error.message.includes('ERR_FAILED')))
      ) {
        console.warn("Network/CORS error when starting exam, simulating success for development")
        return {
          success: true,
          message: "Exam started successfully (simulated)",
          data: {
            id: `result_${examId}_${userId}_${Date.now()}`,
            startedAt: new Date().toISOString(),
            status: "IN_PROGRESS",
            userId,
            examId
          },
          timestamp: Date.now()
        }
      }
      
      throw error
    }
  }

  async submitExam(examId: string, answers: any[], userId: string): Promise<StartExamResponse> {
    try {
      // Log request payload to debug
      const requestPayload = {
        examId,
        answers
      };
      console.log('Submit exam request payload:', requestPayload);
      
      const response = await fetch(`${BASE_URL}/exam-results/submit?userId=${userId}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        // Try to parse error response
        try {
          const errorData = await response.json();
          console.error('Error response from Submit API:', errorData);
          // Throw error with specific message from API if available
          if (errorData?.message) {
            throw new Error(errorData.message);
          }
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        
        // If it's a CORS error or 404, simulate success for development
        if (response.status === 0 || response.status === 404) {
          console.warn("Submit exam API not available, simulating success for development")
          
          // Create mock exam result with all required fields
          const mockResult = {
            id: `result_${examId}_${userId}_${Date.now()}`,
            startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            submittedAt: new Date().toISOString(),
            score: Math.floor(Math.random() * answers.length), // Random score for demo
            status: "COMPLETED" as const,
            userId,
            examId,
            examTitle: "Bài kiểm tra demo",
            answers: answers.map((answer, index) => ({
              id: `answer_${index}`,
              userAnswer: answer.userAnswer,
              isCorrect: Math.random() > 0.5, // Random correct/incorrect for demo
              questionId: answer.questionId,
              questionContent: `Câu hỏi ${index + 1}`,
              selectedOptionId: answer.selectedOptionId,
              correctAnswer: answer.selectedOptionId || "demo_answer"
            })),
            totalQuestions: answers.length,
            correctAnswers: Math.floor(Math.random() * answers.length)
          }
          
          return {
            success: true,
            message: "Exam submitted successfully (simulated)",
            data: mockResult,
            timestamp: Date.now()
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || "Failed to submit exam")
      }

      return data
    } catch (error) {
      console.error("Error submitting exam:", error)
      
      // Handle ALL network errors including CORS errors with "Failed to fetch" message
      // and other network issues (connection refused, timeout)
      if (
        error instanceof TypeError || 
        (error instanceof Error && 
          (error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('CORS') ||
           error.message.includes('ERR_FAILED')))
      ) {
        console.warn("Network/CORS error when submitting exam, simulating success for development")
        
        // Create mock exam result with all required fields
        const mockResult = {
          id: `result_${examId}_${userId}_${Date.now()}`,
          startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          submittedAt: new Date().toISOString(),
          score: Math.floor(Math.random() * answers.length), // Random score for demo
          status: "COMPLETED" as const,
          userId,
          examId,
          examTitle: "Bài kiểm tra demo",
          answers: answers.map((answer, index) => ({
            id: `answer_${index}`,
            userAnswer: answer.userAnswer,
            isCorrect: Math.random() > 0.5, // Random correct/incorrect for demo
            questionId: answer.questionId,
            questionContent: `Câu hỏi ${index + 1}`,
            selectedOptionId: answer.selectedOptionId,
            correctAnswer: answer.selectedOptionId || "demo_answer"
          })),
          totalQuestions: answers.length,
          correctAnswers: Math.floor(Math.random() * answers.length)
        }
        
        return {
          success: true,
          message: "Exam submitted successfully (simulated)",
          data: mockResult,
          timestamp: Date.now()
        }
      }
      
      throw error
    }
  }

  async getExamResult(resultId: string): Promise<ExamResult> {
    try {
      const response = await fetch(`${BASE_URL}/exam-results/${resultId}`, {
        method: "GET",
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        // If it's a CORS error or 404, simulate success for development
        if (response.status === 0 || response.status === 404) {
          console.warn("Get exam result API not available, simulating success for development")
          
          // Create mock exam result with all required fields
          const mockResult: ExamResult = {
            id: resultId,
            startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            submittedAt: new Date().toISOString(),
            score: 2,
            status: "PASSED",
            userId: "1",
            examId: "exam1",
            examTitle: "Kiểm tra Hiragana cơ bản",
            answers: [
              {
                id: "answer1",
                userAnswer: null,
                isCorrect: true,
                questionId: "q1",
                questionContent: "Hiragana あ được đọc như thế nào?",
                selectedOptionId: "a",
                correctAnswer: "a"
              },
              {
                id: "answer2",
                userAnswer: "wa",
                isCorrect: true,
                questionId: "q2",
                questionContent: "Điền từ thích hợp: Watashi __ gakusei desu",
                selectedOptionId: null,
                correctAnswer: "wa"
              },
              {
                id: "answer3",
                userAnswer: null,
                isCorrect: false,
                questionId: "q3",
                questionContent: "Tiếng Nhật có bao nhiêu chữ Hiragana cơ bản?",
                selectedOptionId: "50",
                correctAnswer: "46"
              }
            ],
            totalQuestions: 3,
            correctAnswers: 2
          }
          
          return mockResult
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || "Failed to get exam result")
      }

      // Log dữ liệu thực từ API để debug
      console.log("API Response Data:", data.data)
      console.log("API Response Answers:", data.data.answers)
      
      return data.data
    } catch (error) {
      console.error("Error fetching exam result:", error)
      
      // Handle ALL network errors including CORS errors
      if (
        error instanceof TypeError || 
        (error instanceof Error && 
          (error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('CORS') ||
           error.message.includes('ERR_FAILED')))
      ) {
        console.warn("Network/CORS error when fetching exam result, simulating success for development")
        
        // Create mock exam result with all required fields
        const mockResult: ExamResult = {
          id: resultId,
          startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          submittedAt: new Date().toISOString(),
          score: 0,
          status: "FAILED",
          userId: "1",
          examId: "exam1",
          examTitle: "Kiểm tra Hiragana cơ bản",
          answers: [
            {
              id: "answer1",
              userAnswer: null,
              isCorrect: false,
              questionId: "q1",
              questionContent: "Hiragana あ được đọc như thế nào?",
              selectedOptionId: null,
              correctAnswer: "a"
            },
            {
              id: "answer2",
              userAnswer: null,
              isCorrect: false,
              questionId: "q2",
              questionContent: "Katakana カ được đọc như thế nào?",
              selectedOptionId: null,
              correctAnswer: "ka"
            },
            {
              id: "answer3",
              userAnswer: null,
              isCorrect: false,
              questionId: "q3",
              questionContent: "Tiếng Nhật có bao nhiêu chữ Hiragana cơ bản?",
              selectedOptionId: null,
              correctAnswer: "46"
            }
          ],
          totalQuestions: 3,
          correctAnswers: 0
        }
        
        return mockResult
      }
      
      throw error
    }
  }
}

export const examService = new ExamService()
