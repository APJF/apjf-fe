import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamDoing } from '../../components/exam/ExamDoing';
import { ExamService } from '../../services/examService';
import { examOverviewService } from '../../services/examOverviewService';
import type { QuestionDetail } from '../../types/exam';

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

        // Start exam and get basic info
        const examResponse = await ExamService.startExam(examId);
        
        // Get exam questions to get options and question details
        const questionsResponse = await ExamService.getExamQuestions(examId);
        const optionsMap: Record<string, ExamQuestionOption[]> = {};
        const transformedQuestions: ExamQuestion[] = [];
        
        questionsResponse.forEach((question: QuestionDetail) => {
          // Transform question to match ExamDoing component expectations
          transformedQuestions.push({
            questionId: question.id,
            questionContent: question.content,
            type: question.type,
            scope: question.scope
          });

          if (question.options) {
            // Transform options to match ExamDoing component expectations
            optionsMap[question.id] = question.options.map(opt => ({
              optionId: opt.id,
              content: opt.content,
              isCorrect: opt.isCorrect
            }));
          }
        });
        
        // Transform data to match ExamDoing component expectations
        const transformedData = {
          examTitle: examResponse.examTitle,
          examId: examResponse.examId,
          questionResults: transformedQuestions,
          remainingTime: 60 * 60, // 60 minutes in seconds
          totalTime: 60 * 60
        };
        
        setExamData(transformedData);
        setQuestionOptions(optionsMap);

      } catch (err) {
        console.error('Error loading exam:', err);
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
