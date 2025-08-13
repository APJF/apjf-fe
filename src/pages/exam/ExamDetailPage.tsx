import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Clock3,
  ClipboardList,
  ClipboardCheck,
  BadgeCheck,
  BookOpen,
  Info,
  AlertTriangle,
  Play,
  Loader2,
} from "lucide-react";
import { ExamService } from "../../services/examService";
import type { ExamOverview } from "../../types/exam";

// ===== Types matching your API response =====
interface ExamDetailApi {
  success: boolean;
  message: string;
  data: Exam;
  timestamp: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  type: string;
  examScopeType: string;
  gradingMethod: string;
  courseId: string;
  chapterId: string | null;
  unitId: string | null;
  createdAt: string; // ISO
  totalQuestions: number;
}

// ===== Props =====
interface ExamDetailPageProps {
  examId?: string;
  fetchUrl?: string; // e.g. "/api/exams/:id"
  onBack?: () => void;
  onStart?: (exam: Exam) => void;
}

// ===== Helpers =====
const fmtMinutes = (mins: number) => {
  if (!Number.isFinite(mins)) return "--";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h <= 0) return `${m} phút`;
  return `${h} giờ ${m > 0 ? m + " phút" : ""}`.trim();
};

const typeLabel: Record<string, string> = { 
  MULTIPLE_CHOICE: "Trắc nghiệm",
  ESSAY: "Tự luận",
  MIXED: "Trắc nghiệm + Tự luận"
};

// ===== UI Bits =====
function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-28 rounded-3xl bg-gradient-to-br from-slate-100 to-white mb-5" />
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
      </div>
      <div className="mt-5 h-40 rounded-2xl bg-slate-100" />
      <div className="mt-5 h-12 rounded-xl bg-slate-100" />
    </div>
  );
}

function StatCard({ icon, label, value }: Readonly<{ icon: React.ReactNode; label: string; value: string | number }>) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 p-4 flex items-center gap-3">
      <span className="inline-flex items-center justify-center size-10 rounded-xl bg-slate-50 border border-slate-200">
        {icon}
      </span>
      <div>
        <div className="text-xs text-gray-600">{label}</div>
        <div className="text-xl font-semibold text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function Instructions() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 font-medium text-amber-900 mb-2">
        <Info className="size-4" /> Hướng dẫn làm bài
      </div>
      <ul className="list-disc list-inside text-sm text-amber-900/90 space-y-1">
        <li>Bạn có thời lượng quy định để hoàn thành toàn bộ câu hỏi.</li>
        <li>Thời gian tính từ lúc bạn nhấn <strong>Bắt đầu làm bài</strong>.</li>
        <li>Bài thi sẽ tự động nộp khi hết thời gian.</li>
        <li>Có thể nộp sớm nếu hoàn thành trước hạn.</li>
        <li>Đảm bảo kết nối internet ổn định trong suốt quá trình.</li>
      </ul>
    </div>
  );
}

// ===== Main Page =====
export default function ExamDetailPage({ examId: propExamId, fetchUrl, onBack: propOnBack, onStart: propOnStart }: Readonly<ExamDetailPageProps>) {
  const navigate = useNavigate();
  const { examId: paramExamId } = useParams<{ examId: string }>();
  
  // Use prop examId or param examId
  const examId = propExamId || paramExamId;
  
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<ExamOverview | null>(null);

  // Navigation handlers
  const handleBack = propOnBack || (() => navigate(-1));
  
  const handleStart = async (examData: ExamOverview) => {
    if (propOnStart) {
      // Convert ExamOverview to Exam format for prop callback
      const examForCallback: Exam = {
        id: examData.examId,
        title: examData.title,
        description: examData.description,
        duration: examData.duration,
        type: examData.type,
        examScopeType: "COURSE", // Default fallback
        gradingMethod: "AUTO", // Default fallback
        courseId: "", // Default fallback
        chapterId: null,
        unitId: null,
        createdAt: new Date().toISOString(), // Default fallback
        totalQuestions: examData.totalQuestions,
      };
      propOnStart(examForCallback);
      return;
    }

    // Default navigation logic from ExamPreparation
    try {
      setIsStarting(true);
      setError(null);
      
      // Call API start exam and save data to localStorage for ExamDoing to use
      const startResponse = await ExamService.startExam(examData.examId);
      console.log("Exam started successfully:", startResponse);
      
      // Save start time and exam data to localStorage
      const startTime = new Date().toISOString();
      localStorage.setItem('examStartedAt', startTime);
      localStorage.setItem('currentExamData', JSON.stringify(startResponse));
      
      // Navigate to exam taking page
      navigate(`/exam/${examId}/take`);
    } catch (apiError) {
      console.error("Error starting exam:", apiError);
      setError("Không thể bắt đầu bài kiểm tra. Vui lòng thử lại.");
    } finally {
      setIsStarting(false);
    }
  };

  const fetchExamDetail = async () => {
    if (!examId) {
      setError("Không tìm thấy ID bài kiểm tra");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (fetchUrl) {
        // Custom fetch logic for prop-based usage
        const url = fetchUrl.includes(":id") ? fetchUrl.replace(":id", encodeURIComponent(examId)) : fetchUrl;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ExamDetailApi = await res.json();
        if (!json?.success || !json?.data) throw new Error(json?.message || "Dữ liệu không hợp lệ");
        
        // Convert API response to ExamOverview format
        const examOverview: ExamOverview = {
          examId: json.data.id,
          title: json.data.title,
          description: json.data.description,
          duration: json.data.duration,
          type: json.data.type as 'MULTIPLE_CHOICE' | 'ESSAY' | 'MIXED',
          totalQuestions: json.data.totalQuestions,
        };
        setExam(examOverview);
      } else {
        // Use existing ExamService
        const examData = await ExamService.getExamOverview(examId);
        setExam(examData);
      }
    } catch (e: unknown) {
      console.error("Error fetching exam detail:", e);
      setError(
        e instanceof Error 
          ? e.message 
          : "Không thể tải thông tin bài kiểm tra"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meta = useMemo(() => {
    if (!exam) return null;
    return [
      { icon: <Clock3 className="size-5 text-blue-700" />, label: "Thời gian", value: fmtMinutes(exam.duration) },
      { icon: <ClipboardList className="size-5 text-emerald-700" />, label: "Số câu hỏi", value: `${exam.totalQuestions} câu` },
      { icon: <BadgeCheck className="size-5 text-violet-700" />, label: "Loại bài thi", value: typeLabel[exam.type] || exam.type },
    ];
  }, [exam]);

  if (!examId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Không tìm thấy bài kiểm tra</h2>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <button onClick={handleBack} className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800">
          <ChevronLeft className="size-4" /> Quay lại
        </button>
      </div>

      {/* Header */}
      <header className="max-w-6xl mx-auto px-4 mt-3">
        <div className="rounded-3xl overflow-hidden shadow-sm border border-slate-200">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-6">
            <h1 className="text-2xl sm:text-3xl font-semibold">{exam?.title || "Đang tải..."}</h1>
            <p className="mt-1 text-white/90 text-sm">{exam?.description || " "}</p>
          </div>
          <div className="bg-white px-6 py-5">
            {loading && <Skeleton />}
            {!loading && error && (
              <div className="space-y-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-900 px-4 py-3 flex items-center gap-2">
                  <AlertTriangle className="size-4" /> {error}
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={fetchExamDetail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Thử lại
                  </button>
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Quay lại
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && exam && (
              <>
                {/* Meta cards */}
                <div className="grid sm:grid-cols-3 gap-4">
                  {meta!.map((m) => (
                    <StatCard key={m.label} icon={m.icon} label={m.label} value={m.value} />
                  ))}
                </div>

                {/* Combined info card */}
                <div className="mt-5">
                  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm ring-1 ring-slate-100">
                    <div className="text-xs text-gray-500 mb-3">Phạm vi & Cách chấm</div>
                    <div className="grid gap-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center size-9 rounded-xl bg-slate-50 border border-slate-200">
                          <BookOpen className="size-4 text-slate-700" />
                        </span>
                        <div className="leading-tight">
                          <div className="text-sm text-gray-600">Phạm vi</div>
                          <div className="text-gray-900 font-medium">
                            Toàn khoá
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-100" />

                      <div className="flex items-start gap-3">
                        <span className="inline-flex items-center justify-center size-9 rounded-xl bg-slate-50 border border-slate-200">
                          <ClipboardCheck className="size-4 text-slate-700" />
                        </span>
                        <div className="leading-tight">
                          <div className="text-sm text-gray-600">Cách chấm</div>
                          <div className="text-gray-900 font-medium">Tự động</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-5">
                  <Instructions />
                </div>

                {/* Start button */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">* Khi nhấn bắt đầu, đồng hồ sẽ đếm ngược và không thể tạm dừng.</div>
                  <button
                    onClick={() => handleStart(exam)}
                    disabled={isStarting}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        Đang bắt đầu...
                      </>
                    ) : (
                      <>
                        <Play className="size-5" />
                        Bắt đầu làm bài
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
