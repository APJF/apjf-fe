import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamDoing } from '../../components/exam/ExamDoing';
import { ExamService } from '../../services/examService';
import { examOverviewService } from '../../services/examOverviewService';
import { authService } from '../../services/authService';
import type { ExamStartResponse, ExamStartQuestion } from '../../types/exam';

// Define interface for question options to match ExamDoing component
interface ExamQuestionOption {
  optionId: string;
  content: string;
  isCorrect?: boolean;
}

// Define interface for ExamQuestion to match ExamDoing component
interface ExamQuestion {
  questionId: string;
  questionContent: string;
  type: 'MULTIPLE_CHOICE' | 'WRITING' | 'ESSAY';
  scope?: string;
}

export const ExamDoingPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const [examData, setExamData] = useState<{
    examTitle: string;
    examId: string;
    questionResults: ExamQuestion[];
    remainingTime: number;
    totalTime: number;
  } | null>(null);
  const [questionOptions, setQuestionOptions] = useState<Record<string, ExamQuestionOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExamData = async () => {
      if (!examId) {
        setError('Exam ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Chỉ cần gọi API start exam để lấy TẤT CẢ thông tin cần thiết
        console.log('🚀 Starting exam and loading data from single API call...');
        const startResponse: ExamStartResponse = await ExamService.startExam(examId);
        console.log('📋 Start exam response:', startResponse);
        
        // Kiểm tra response structure
        if (!startResponse.questions || !Array.isArray(startResponse.questions)) {
          throw new Error('Invalid exam data: questions not found');
        }

        // Transform questions và options từ response
        const optionsMap: Record<string, ExamQuestionOption[]> = {};
        const transformedQuestions: ExamQuestion[] = [];
        
        startResponse.questions.forEach((question: ExamStartQuestion) => {
          // Transform question để match ExamDoing component
          transformedQuestions.push({
            questionId: question.id,
            questionContent: question.content,
            type: question.type,
            scope: question.scope
          });

          // Transform options (không có isCorrect nhưng không ảnh hưởng submit)
          if (question.options && Array.isArray(question.options)) {
            optionsMap[question.id] = question.options.map(opt => ({
              optionId: opt.id,
              content: opt.content,
              // isCorrect không có trong response mới nhưng không cần thiết cho ExamDoing
            }));
          }
        });
        
        // Transform data để match ExamDoing component expectations
        const examDuration = startResponse.duration || 60; // fallback to 60 minutes
        const transformedData = {
          examTitle: startResponse.title,
          examId: startResponse.id,
          questionResults: transformedQuestions,
          remainingTime: examDuration * 60, // Convert minutes to seconds
          totalTime: examDuration * 60
        };
        
        console.log('✅ Transformed exam data:', transformedData);
        console.log('✅ Options map keys:', Object.keys(optionsMap));
        
        setExamData(transformedData);
        setQuestionOptions(optionsMap);

      } catch (err) {
        console.error('❌ Error loading exam:', err);
        setError('Failed to load exam. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadExamData();
  }, [examId]);

  const handleSubmit = async (answers: Array<{
    questionId: string;
    selectedOptionId?: string | null;
    userAnswer?: string | null;
  }>) => {
    console.log('🚀 ExamDoingPage: handleSubmit called')
    console.log('🚀 ExamDoingPage: examId =', examId)
    console.log('🚀 ExamDoingPage: received answers =', answers)
    
    if (!examId) {
      console.log('❌ ExamDoingPage: No examId, returning early')
      return;
    }

    try {
      // Ensure token is valid before critical operation
      console.log('🔒 Ensuring valid token before exam submission...');
      const tokenValid = await authService.ensureValidTokenForCriticalOperation();
      if (!tokenValid) {
        console.error('❌ Failed to ensure valid token for exam submission');
        // Show more specific error and allow retry
        setError('Không thể xác thực phiên đăng nhập. Đang thử lại...');
        
        // Retry once more after a short delay
        setTimeout(async () => {
          try {
            const retryTokenValid = await authService.ensureValidTokenForCriticalOperation();
            if (retryTokenValid) {
              console.log('✅ Token validation successful on retry');
              setError(''); // Clear error
              // Recursively call handleSubmit again
              handleSubmit(answers);
              return;
            } else {
              setError('Phiên đăng nhập đã hết hạn. Vui lòng lưu bài và đăng nhập lại.');
              // Don't navigate away - let user save their progress
              return;
            }
          } catch (retryError) {
            console.error('❌ Retry token validation failed:', retryError);
            setError('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.');
            return;
          }
        }, 2000);
        return;
      }

      // Transform answers to match submitExam method signature
      const submitAnswers = answers.map(answer => ({
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId ?? null,
        userAnswer: answer.userAnswer ?? null
      }));

      console.log('🚀 ExamDoingPage: transformed submitAnswers =', submitAnswers)

      const currentTime = new Date().toISOString();
      console.log('🚀 ExamDoingPage: currentTime =', currentTime)
      console.log('🚀 ExamDoingPage: Calling ExamService.submitExam with:', {
        examId,
        startedAt: currentTime,
        submittedAt: currentTime,
        answers: submitAnswers
      })

      const submitResult = await ExamService.submitExam(examId, currentTime, currentTime, submitAnswers);
      console.log('✅ ExamDoingPage: submitExam successful, result =', submitResult)
      
      // Always call AI overview API after successful submit
      if (submitResult?.examResultId) {
        const resultId = submitResult.examResultId;
        console.log('🤖 ExamDoingPage: Calling AI overview for result ID:', resultId);
        
        const aiOverview = await examOverviewService.getOverview(resultId.toString());
        console.log('✅ ExamDoingPage: AI overview successful:', aiOverview);
        
        // Navigate to ExamOverviewPage with AI data
        navigate(`/exam/${examId}/overview`, {
          state: { 
            aiOverview,
            examResult: submitResult 
          }
        });
      } else {
        console.error('❌ ExamDoingPage: No examResultId found in submit response');
        setError('Exam submitted but could not get result ID. Please contact support.');
      }
    } catch (err) {
      console.error('❌ ExamDoingPage: Error submitting exam:', err);
      setError('Failed to submit exam. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No exam data available</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <ExamDoing
      examData={examData}
      questionOptions={questionOptions}
      onSubmit={handleSubmit}
    />
  );
};
