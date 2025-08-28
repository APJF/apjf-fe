import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Percent,
  BookOpen,
  Repeat,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  StickyNote,
  Languages,
  ScrollText,
  FileText,
  Headphones,
} from "lucide-react";
import type { AIOverviewResponse, ExamSection } from "../../services/examOverviewService";
import { examOverviewService } from "../../services/examOverviewService";
import type { ExamSubmitResponse } from "../../types/exam";

// Japanese Exam Review – AI Overview Only
// Premium styling: unified cards, gradient accents, soft rings, consistent typography.

type Section = "kanji" | "vocab" | "grammar" | "reading" | "listening";

// ---- Helpers
const pct = (correct: number, total: number) => (total === 0 ? 0 : Math.round((correct / total) * 100));
const apiToSectionKey = (s: ExamSection): Section => s.toLowerCase() as Section;
const apiLabel = (s: ExamSection) => ({
  GRAMMAR: "Ngữ pháp",
  KANJI: "Kanji",
  VOCAB: "Từ vựng",
  READING: "Đọc hiểu",
  LISTENING: "Nghe",
}[s]);

const sectionTheme: Record<Section, { grad: string; ring: string; icon: string; chip: string; text: string }> = {
  grammar:   { grad: "from-amber-50 to-white",    ring: "ring-amber-200",   icon: "text-amber-700",   chip: "bg-amber-100 text-amber-800",   text: "text-amber-900" },
  kanji:     { grad: "from-violet-50 to-white",   ring: "ring-violet-200",  icon: "text-violet-700",  chip: "bg-violet-100 text-violet-800",  text: "text-violet-900" },
  vocab:     { grad: "from-sky-50 to-white",      ring: "ring-sky-200",     icon: "text-sky-700",     chip: "bg-sky-100 text-sky-800",       text: "text-sky-900" },
  reading:   { grad: "from-teal-50 to-white",     ring: "ring-teal-200",    icon: "text-teal-700",    chip: "bg-teal-100 text-teal-800",     text: "text-teal-900" },
  listening: { grad: "from-fuchsia-50 to-white",  ring: "ring-fuchsia-200", icon: "text-fuchsia-700", chip: "bg-fuchsia-100 text-fuchsia-800", text: "text-fuchsia-900" },
};

const sectionLabel: Record<Section, string> = {
  grammar: "Ngữ pháp",
  kanji: "Kanji",
  vocab: "Từ vựng",
  reading: "Đọc hiểu",
  listening: "Nghe",
};

// ---- Summary cards (Score shows pass/fail inline)
function SummaryHighlight({ summary, threshold = 60 }: Readonly<{ summary: AIOverviewResponse["advice"]["summary"]; threshold?: number }>) {
  const score = Math.round(summary.accuracy_percent);
  const pass = score >= threshold;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Score */}
      <div className={`rounded-2xl border bg-white p-5 shadow-sm ring-1 ${pass ? "border-emerald-200 ring-emerald-200" : "border-rose-200 ring-rose-200"}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-1 rounded-lg ${pass ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>Điểm</span>
          <Percent className={`size-5 ${pass ? "text-emerald-700" : "text-rose-700"}`} />
        </div>
        <div className={`mt-3 text-3xl font-semibold ${pass ? "text-emerald-900" : "text-rose-900"}`}>{score}</div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-md border ${pass ? "border-emerald-200 text-emerald-800" : "border-rose-200 text-rose-800"}`}>{pass ? "Đậu" : "Trượt"}</span>
          <span className="text-xs text-gray-500">ngưỡng {threshold}%</span>
        </div>
      </div>

      {/* Correct */}
      <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm ring-1 ring-emerald-200">
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">Đúng</span>
          <CheckCircle2 className="size-5 text-emerald-700" />
        </div>
        <div className="mt-3 text-3xl font-semibold text-emerald-900">{summary.correct}</div>
        <div className="mt-1 text-xs text-gray-500">trên {summary.total_questions}</div>
      </div>

      {/* Wrong */}
      <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm ring-1 ring-rose-200">
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-1 rounded-lg bg-rose-50 text-rose-700">Sai</span>
          <XCircle className="size-5 text-rose-700" />
        </div>
        <div className="mt-3 text-3xl font-semibold text-rose-900">{summary.wrong}</div>
        <div className="mt-1 text-xs text-gray-500">trên {summary.total_questions}</div>
      </div>

      {/* Total */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-1 rounded-lg bg-slate-50 text-slate-700">Tổng câu</span>
          <StickyNote className="size-5 text-slate-700" />
        </div>
        <div className="mt-3 text-3xl font-semibold text-slate-900">{summary.total_questions}</div>
        <div className="mt-1 text-xs text-gray-500">đã chấm</div>
      </div>
    </div>
  );
}

// ---- Skill card (always sits in one row with 5 cols on >=sm)
function SkillCard({ section, total, correct }: Readonly<{ section: Section; total: number; correct: number }>) {
  const theme = sectionTheme[section];
  const percent = pct(correct, total);
  
  // Extract icon selection to separate function
  const getIcon = (sectionType: Section) => {
    if (sectionType === "kanji") return ScrollText;
    if (sectionType === "vocab") return Languages;
    if (sectionType === "reading") return BookOpen;
    if (sectionType === "listening") return Headphones;
    return FileText;
  };
  
  const Icon = getIcon(section);
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm ring-1 ${theme.ring} transition-transform hover:-translate-y-0.5`}
      title={sectionLabel[section]}
      aria-label={sectionLabel[section]}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center size-10 rounded-xl bg-white border ${theme.ring}`}>
            <Icon className={`size-5 ${theme.icon}`} />
          </span>
          <div>
            <div className={`text-sm font-medium ${theme.text}`}>{sectionLabel[section]}</div>
            <div className="text-[11px] text-gray-600">{correct}/{total} đúng</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xl font-semibold ${theme.text}`}>{percent}%</div>
          <span className={`mt-0.5 inline-block text-[11px] px-2 py-0.5 rounded-md ${theme.chip}`}>điểm phần</span>
        </div>
      </div>
    </div>
  );
}

function StrengthWeakness({ strengths, weaknesses }: Readonly<{ strengths: ExamSection[]; weaknesses: ExamSection[] }>) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm ring-1 ring-emerald-200">
        <div className="flex items-center gap-2 font-semibold text-emerald-900 mb-3"><ShieldCheck className="size-4" /> Thế mạnh</div>
        <div className="flex flex-wrap gap-2">
          {strengths.length ? strengths.map(s => (
            <span key={s} className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">{apiLabel(s)}</span>
          )) : <span className="text-sm text-emerald-800/70">Chưa xác định</span>}
        </div>
      </div>
      <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm ring-1 ring-rose-200">
        <div className="flex items-center gap-2 font-semibold text-rose-900 mb-3"><AlertTriangle className="size-4" /> Điểm yếu</div>
        <div className="flex flex-wrap gap-2">
          {weaknesses.map(s => (
            <span key={s} className="px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-sm text-rose-800">{apiLabel(s)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExamOverviewPage() {
  const location = useLocation();
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [aiOverview, setAiOverview] = useState<AIOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get data from navigation state if available
  const stateData = location.state as { aiOverview?: AIOverviewResponse; examResult?: ExamSubmitResponse } | null;

  // Demo data for fallback - memoized to avoid recreating on every render
  const demoAI = useMemo((): AIOverviewResponse => ({
    exam_result_id: "8",
    advice: {
      summary: { total_questions: 55, correct: 13, wrong: 42, accuracy_percent: 23.64 },
      by_section: [
        { section: "GRAMMAR", total: 20, correct: 5, wrong: 15, accuracy_percent: 25 },
        { section: "KANJI", total: 20, correct: 4, wrong: 16, accuracy_percent: 20 },
        { section: "VOCAB", total: 15, correct: 4, wrong: 11, accuracy_percent: 26.67 },
        { section: "READING", total: 10, correct: 3, wrong: 7, accuracy_percent: 30 },
        { section: "LISTENING", total: 10, correct: 6, wrong: 4, accuracy_percent: 60 },
      ],
      strengths: ["LISTENING"],
      weaknesses: ["GRAMMAR", "KANJI", "VOCAB"],
      notes: [
        "Ngữ pháp yếu: luyện trợ từ, cấu trúc N cấp; làm đề theo chủ điểm.",
        "Kanji yếu: ôn bảng Kanji N cấp, tập trung chữ hay nhầm; luyện đọc ghép âm, on-kun.",
        "Từ vựng yếu: mở rộng chủ điểm tần suất cao, áp dụng flashcard SRS.",
      ],
    },
  }), []);

  useEffect(() => {
    const loadAiOverview = async () => {
      try {
        setLoading(true);
        setError(null);

        // If we have AI overview from navigation state, use it
        if (stateData?.aiOverview) {
          console.log('✅ ExamOverviewPage: Using AI overview from navigation state');
          setAiOverview(stateData.aiOverview);
          setLoading(false);
          return;
        }

        // Otherwise, try to load from API
        const examResultId = stateData?.examResult?.examResultId;
        if (examResultId) {
          console.log('🤖 ExamOverviewPage: Loading AI overview for result ID:', examResultId);
          const overview = await examOverviewService.getOverview(examResultId.toString());
          setAiOverview(overview);
        } else {
          console.warn('⚠️ ExamOverviewPage: No exam result data available');
          setError('No exam result data available');
        }
      } catch (err) {
        console.error('❌ ExamOverviewPage: Failed to load AI overview:', err);
        setError('Failed to load AI analysis. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAiOverview();
  }, [stateData, demoAI]);

  const handleViewDetails = () => {
    // Navigate to exam history or answer review page
    if (stateData?.examResult?.examResultId) {
      navigate(`/exam-result/${stateData.examResult.examResultId}/review`, {
        state: { examResult: stateData.examResult }
      });
    } else {
      navigate('/exam-history');
    }
  };

  const handleRetake = () => {
  navigate(`/exam/${examId}/detail`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang phân tích kết quả bài thi...</p>
          <p className="mt-2 text-sm text-gray-500">AI đang xem xét bài làm của bạn</p>
        </div>
      </div>
    );
  }

  if (error || !aiOverview) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h2>
            <p className="text-red-600 mb-4">{error || 'Không thể tải dữ liệu phân tích AI'}</p>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate(`/exam/${examId}/result`, { 
                  state: stateData?.examResult ? { result: stateData.examResult } : null 
                })}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Xem kết quả cơ bản
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const threshold = 60;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Sparkles className="size-5 text-indigo-600" />Tổng quan bài thi</h1>
          <span className="text-xs text-gray-500">ID Kết Quả: {aiOverview.exam_result_id}</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <SummaryHighlight summary={aiOverview.advice.summary} threshold={threshold} />

        {/* Skills row: ALWAYS one row with 5 columns on >= sm */}
        <section>
          <div className="mb-2 text-sm text-gray-600">Kỹ năng</div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {aiOverview.advice.by_section.map((s) => (
              <SkillCard key={s.section} section={apiToSectionKey(s.section)} total={s.total} correct={s.correct} />
            ))}
          </div>
        </section>

        <StrengthWeakness strengths={aiOverview.advice.strengths} weaknesses={aiOverview.advice.weaknesses} />

        {aiOverview.advice.notes.length > 0 && (
          <section className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm ring-1 ring-indigo-100">
            <div className="font-semibold text-indigo-900 mb-2">Gợi ý từ AI</div>
            <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
              {aiOverview.advice.notes.map((note) => (
                <li key={note.substring(0, 50)}>{note}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex gap-3 pt-2">
          <button 
            onClick={handleViewDetails}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50"
          >
            <BookOpen className="size-5" /> Xem chi tiết
          </button>
          <button 
            onClick={handleRetake}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white hover:opacity-90"
          >
            <Repeat className="size-5" /> Thi lại
          </button>
        </div>
      </main>
    </div>
  );
}
