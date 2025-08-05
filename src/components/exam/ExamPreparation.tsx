import { useState, useEffect } from "react";
import { Clock, FileText, CheckCircle, AlertCircle, ArrowLeft, Play, Loader2 } from "lucide-react";
import { ExamService } from "../../services/examService";
import type { Exam } from "../../types/exam";

interface ExamPreparationProps {
  examId: string;
  onStart: () => void;
  onBack?: () => void;
}

export function ExamPreparation({ examId, onStart, onBack }: Readonly<ExamPreparationProps>) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExamDetail = async () => {
    if (!examId) {
      setError("Không tìm thấy ID bài kiểm tra");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await ExamService.getExamDetail(examId);
      
      if (!response.success) {
        throw new Error(response.message || "Không thể tải thông tin bài kiểm tra");
      }

      setExam(response.data);
    } catch (err) {
      console.error("Error fetching exam details:", err);
      setError(err instanceof Error ? err.message : "Không thể tải thông tin bài kiểm tra");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExamDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const handleStartExam = async () => {
    if (!exam) return;

    try {
      setIsStarting(true);
      setError(null);
      
      const response = await ExamService.startExam(exam.id);
      if (!response.success) {
        throw new Error(response.message || "Không thể bắt đầu bài kiểm tra");
      }
      
      console.log("Exam started successfully:", response.data);
      onStart();
    } catch (apiError) {
      console.error("Error starting exam:", apiError);
      setError("Không thể bắt đầu bài kiểm tra. Vui lòng thử lại.");
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Đang tải thông tin bài kiểm tra...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Có lỗi xảy ra</h2>
              <p className="text-gray-600">{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={fetchExamDetail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Quay lại
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Không tìm thấy bài kiểm tra</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-0">
        {/* Header với nút back */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>
        )}

        {/* Exam Info Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{exam.title}</h1>
            <p className="text-blue-100">{exam.description}</p>
          </div>

          <div className="p-8">
            {/* Exam Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Thời gian</h3>
                  <p className="text-gray-600">{exam.duration} phút</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Số câu hỏi</h3>
                  <p className="text-gray-600">{exam.totalQuestions} câu</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Loại bài thi</h3>
                  <p className="text-gray-600">{exam.examScopeType}</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-yellow-800 mb-3">Hướng dẫn làm bài:</h3>
              <ul className="space-y-2 text-yellow-700">
                <li>• Bạn có {exam.duration} phút để hoàn thành {exam.totalQuestions} câu hỏi</li>
                <li>• Thời gian sẽ được tính ngay khi bạn bắt đầu làm bài</li>
                <li>• Bài thi sẽ tự động nộp khi hết thời gian</li>
                <li>• Bạn có thể nộp bài sớm nếu hoàn thành trước thời hạn</li>
                <li>• Đảm bảo kết nối internet ổn định trong suốt quá trình làm bài</li>
              </ul>
            </div>

            {/* Start Button */}
            <div className="text-center">
              <button
                onClick={handleStartExam}
                disabled={isStarting}
                className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 text-white font-semibold text-lg rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Đang bắt đầu...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    <span>Bắt đầu làm bài</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
