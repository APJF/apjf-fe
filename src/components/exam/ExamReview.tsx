import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { CheckCircle2, XCircle, MinusCircle, ChevronLeft, ChevronRight, Info, ArrowLeft } from "lucide-react";
import type { ExamResult } from "../../types/exam";

// ===================== Types (100% Design Inheritance) =====================
export type ChoiceKey = "A" | "B" | "C" | "D";

type QuestionState = "correct" | "wrong" | "unanswered";

export interface AnswerOption {
  key: ChoiceKey;
  text: string;
}

export interface ReviewQuestion {
  id: number; // 1..N (display index)
  content: string;
  userAnswer?: ChoiceKey | null; // null/undefined = chưa trả lời
  correctAnswer: ChoiceKey;
  explanation?: string;
  answers: AnswerOption[]; // 4 options A-D
}

interface QuestionDetail {
  id: string;
  content: string;
  scope: string;
  type: string;
  explanation: string;
  options: Array<{
    id: string;
    content: string;
    isCorrect: boolean;
  }>;
}

interface ExamReviewProps {
  examResult: ExamResult;
  onBack: () => void;
}

// ===================== Tokens (calm, readable) =====================
const UI = {
  header: "text-xl sm:text-2xl font-semibold tracking-tight",
  card: "bg-white rounded-2xl shadow-sm border border-gray-200",
  chip: "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border",
  numBadge: "inline-flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-semibold",
  // calm pastel states
  state: {
    correct: {
      chip: "text-emerald-800 bg-emerald-50 border-emerald-200",
      row: "border-emerald-300 bg-emerald-50",
      line: "bg-emerald-400",
      nav: "border border-emerald-300 bg-emerald-50 text-emerald-800",
    },
    wrong: {
      chip: "text-rose-800 bg-rose-50 border-rose-200",
      row: "border-rose-300 bg-rose-50",
      line: "bg-rose-400",
      nav: "border border-rose-300 bg-rose-50 text-rose-800",
    },
    unanswered: {
      chip: "text-amber-800 bg-amber-50 border-amber-200",
      row: "border-amber-300 bg-amber-50",
      line: "bg-amber-400",
      nav: "border border-amber-300 bg-amber-50 text-amber-800",
    },
  },
} as const;

// ===================== Helper Functions =====================
function resolveState(q: ReviewQuestion): QuestionState {
  if (!q.userAnswer) return "unanswered";
  return q.userAnswer === q.correctAnswer ? "correct" : "wrong";
}

// Convert ExamResult to ReviewQuestion format
function convertToReviewQuestions(examResult: ExamResult, questionDetails: Record<string, QuestionDetail>): ReviewQuestion[] {
  return examResult.questionResults.map((q, index) => {
    const detail = questionDetails[q.questionId];
    const correctOption = detail?.options?.find(opt => opt.isCorrect);
    const userSelectedOption = detail?.options?.find(opt => opt.id === q.selectedOptionId);
    
    // Map options to A, B, C, D format
    const answers: AnswerOption[] = detail?.options?.map((opt, idx) => ({
      key: String.fromCharCode(65 + idx) as ChoiceKey, // A, B, C, D
      text: opt.content
    })) || [];

    const correctAnswer = correctOption ? String.fromCharCode(65 + detail.options.indexOf(correctOption)) as ChoiceKey : "A";
    const userAnswer = userSelectedOption ? String.fromCharCode(65 + detail.options.indexOf(userSelectedOption)) as ChoiceKey : null;

    return {
      id: index + 1,
      content: q.questionContent,
      userAnswer: userAnswer,
      correctAnswer: correctAnswer,
      explanation: detail?.explanation || q.explanation || "",
      answers: answers
    };
  });
}

// ===================== Explanation Component =====================
function Explanation({ text }: Readonly<{ text?: string }>) {
  if (!text) return null;
  return (
    <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
      <div className="flex items-start gap-2">
        <Info className="size-4 mt-0.5 text-indigo-700" />
        <p className="leading-relaxed"><span className="font-medium">Giải thích:</span> {text}</p>
      </div>
    </div>
  );
}

// ===================== Answer Row (dashed for correct) =====================
function AnswerRow({
  option,
  isUser,
  isCorrectKey,
  state,
}: Readonly<{
  option: AnswerOption;
  isUser: boolean;
  isCorrectKey: boolean;
  state: QuestionState;
}>) {
  const base = "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition";
  const dashed = isCorrectKey ? "border-dashed" : "border-solid";
  let style = `border-gray-200 bg-white hover:bg-gray-50 ${dashed}`;

  if (state === "correct" && isUser) style = `${UI.state.correct.row} ${dashed}`;
  else if (state === "wrong" && isCorrectKey) style = `${UI.state.correct.row} ${dashed}`;
  else if (state === "wrong" && isUser && !isCorrectKey) style = `${UI.state.wrong.row} ${dashed}`;

  let badge: string;
  if (state === "correct" && isUser) {
    badge = "border-emerald-300 bg-emerald-600 text-white";
  } else if (state === "wrong" && isCorrectKey) {
    badge = "border-emerald-300 bg-emerald-600 text-white";
  } else if (state === "wrong" && isUser) {
    badge = "border-rose-300 bg-rose-600 text-white";
  } else {
    badge = "border-gray-300 bg-white text-gray-600";
  }

  return (
    <div className={`${base} ${style}`}>
      <span className={`inline-flex size-6 items-center justify-center rounded-full border text-xs ${badge}`}>
        {option.key}
      </span>
      <div className="leading-relaxed text-gray-800">{option.text || <span className="text-gray-400 italic">(không có nội dung)</span>}</div>
    </div>
  );
}

// ===================== Main Component =====================
export function ExamReview({ examResult, onBack }: Readonly<ExamReviewProps>) {
  const [questionDetails, setQuestionDetails] = useState<Record<string, QuestionDetail>>({});
  const [loadingQuestionDetails, setLoadingQuestionDetails] = useState<Set<string>>(new Set());
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Convert examResult to ReviewQuestion format after question details are loaded
  const data = useMemo<ReviewQuestion[]>(() => {
    if (!examResult.questionResults?.length || Object.keys(questionDetails).length === 0) return [];
    return convertToReviewQuestions(examResult, questionDetails);
  }, [examResult, questionDetails]);

  const total = data.length;
  const correctCount = useMemo(() => data.filter((q) => resolveState(q) === "correct").length, [data]);
  const wrongCount = useMemo(() => data.filter((q) => resolveState(q) === "wrong").length, [data]);
  const unansweredCount = total - correctCount - wrongCount;

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(1);

  // Load question details for all questions
  const loadAllQuestionDetails = useCallback(async () => {
    setIsLoadingDetails(true);
    
    // Check if questionResults exists and is an array
    if (!examResult.questionResults || !Array.isArray(examResult.questionResults)) {
      console.error('examResult.questionResults is not available or not an array:', examResult.questionResults);
      setIsLoadingDetails(false);
      return;
    }
    
    const questionsToLoad = examResult.questionResults.filter(
      question => !questionDetails[question.questionId] && !loadingQuestionDetails.has(question.questionId)
    );

    if (questionsToLoad.length === 0) {
      setIsLoadingDetails(false);
      return;
    }
    
    const loadingPromises = questionsToLoad.map(async (question) => {
      setLoadingQuestionDetails(prev => new Set([...prev, question.questionId]));
      
      try {
        const response = await fetch(`http://localhost:8080/api/questions/${question.questionId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch question details');
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          setQuestionDetails(prev => ({
            ...prev,
            [question.questionId]: data.data
          }));
        }
      } catch (error) {
        console.error('Error loading question details:', error);
      } finally {
        setLoadingQuestionDetails(prev => {
          const newSet = new Set(prev);
          newSet.delete(question.questionId);
          return newSet;
        });
      }
    });

    await Promise.all(loadingPromises);
    setIsLoadingDetails(false);
  }, [examResult.questionResults, questionDetails, loadingQuestionDetails]);

  useEffect(() => {
    loadAllQuestionDetails();
  }, [loadAllQuestionDetails]);

  // Intersection Observer for active question
  useEffect(() => {
    if (data.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) {
          const id = Number((vis.target as HTMLElement).dataset.qid);
          if (id) setActive(id);
        }
      },
      { root: null, rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    cardRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [data.length]);

  // Navigation functions
  const scrollToIdx = (idx: number) => {
    const clamped = Math.min(Math.max(idx, 1), total) - 1;
    cardRefs.current[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(clamped + 1);
  };

  if (isLoadingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Đang tải chi tiết câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (!examResult.questionResults?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Không có dữ liệu câu trả lời</h2>
          <p className="text-gray-600">Không tìm thấy chi tiết câu trả lời cho bài thi này.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Quay lại
            </button>
            <div>
              <h1 className={UI.header}>{examResult.examTitle || "Review kết quả bài thi"}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Đúng: {correctCount} • Sai: {wrongCount} • Bỏ trống: {unansweredCount} • Điểm: {examResult.score.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Questions */}
        <section className="lg:col-span-8 space-y-4">
          {data.map((q, idx) => {
            const state = resolveState(q);
            const stateChip =
              state === "correct" ? (
                <span className={`${UI.chip} ${UI.state.correct.chip}`}><CheckCircle2 className="size-3"/> Đúng</span>
              ) : state === "wrong" ? (
                <span className={`${UI.chip} ${UI.state.wrong.chip}`}><XCircle className="size-3"/> Sai</span>
              ) : (
                <span className={`${UI.chip} ${UI.state.unanswered.chip}`}><MinusCircle className="size-3"/> Chưa trả lời</span>
              );

            return (
              <div
                key={q.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                data-qid={q.id}
                id={`q-${q.id}`}
                className={`${UI.card} overflow-hidden`}
              >
                {/* softer accent line */}
                <div className={`h-1 ${state === "correct" ? UI.state.correct.line : state === "wrong" ? UI.state.wrong.line : UI.state.unanswered.line}`} />
                <div className="p-4 sm:p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={UI.numBadge}>{q.id}</span>
                      <h2 className="text-base sm:text-lg font-medium leading-snug text-gray-900">{q.content}</h2>
                    </div>
                    {stateChip}
                  </div>

                  {/* Status notice */}
                  <div className={`mt-3 rounded-xl px-3 py-2 text-sm border ${
                    state === "correct"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : state === "wrong"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}>
                    {state === "correct" && (
                      <div>
                        Bạn làm <b>Đúng</b>. Đáp án chọn: <b>{q.userAnswer}</b>.
                      </div>
                    )}
                    {state === "wrong" && (
                      <div>
                        Bạn làm <b>Sai</b>. Bạn chọn <b className="text-rose-800">{q.userAnswer}</b> • Đáp án đúng là <b className="text-emerald-800">{q.correctAnswer}</b>.
                      </div>
                    )}
                    {state === "unanswered" && <div>Bạn <b>chưa trả lời</b> câu hỏi này.</div>}
                  </div>

                  {/* Answers */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.answers.map((opt) => (
                      <AnswerRow
                        key={opt.key}
                        option={opt}
                        isUser={q.userAnswer === opt.key}
                        isCorrectKey={q.correctAnswer === opt.key}
                        state={state}
                      />
                    ))}
                  </div>

                  <Explanation text={q.explanation} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Right: Sticky Navigator */}
        <aside className="lg:col-span-4">
          <div className={`${UI.card} p-4 sticky top-[84px]`}>
            {/* Scrollable 5x5 viewport for question numbers */}
            <div className="h-72 overflow-y-auto overscroll-contain pr-1">
              <div className="grid grid-cols-5 gap-2 place-items-center">
                {data.map((q) => {
                  const s = resolveState(q);
                  const isActive = active === q.id;
                  const base = "relative rounded-xl border text-sm font-semibold transition flex items-center justify-center h-12 w-12"; // bigger squares
                  const color = s === "correct" ? UI.state.correct.nav : s === "wrong" ? UI.state.wrong.nav : UI.state.unanswered.nav;
                  const outline = isActive ? "ring-2 ring-emerald-400/30 border-emerald-400" : "border-gray-300 hover:border-gray-400";
                  return (
                    <button
                      key={q.id}
                      onClick={() => scrollToIdx(q.id)}
                      className={[base, color, outline].join(" ")}
                      aria-label={`Đi tới ${q.id}`}
                    >
                      {q.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 h-px bg-gray-100" />

            {/* Controls below grid */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => scrollToIdx(active - 1)}
                disabled={active <= 1}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="size-4" /> Trước
              </button>
              <div className="text-sm text-gray-600">{active}/{total}</div>
              <button
                onClick={() => scrollToIdx(active + 1)}
                disabled={active >= total}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sau <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
