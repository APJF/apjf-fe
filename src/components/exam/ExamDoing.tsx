import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Check, ChevronLeft, ChevronRight, AlarmClock } from 'lucide-react';

// ---- Types (matching the reference design)
interface ExamQuestion {
  questionId: string
  questionContent: string
  type: 'MULTIPLE_CHOICE' | 'WRITING' | 'ESSAY'
  scope?: string
}

interface ExamQuestionOption {
  optionId: string
  content: string
  isCorrect?: boolean
}

// Export for use in other components
export type { ExamQuestionOption }

// ---- Progress Bar (used inside the right navigator)
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
      <div
        className="h-full bg-blue-600 transition-[width] duration-300 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ---- Exam Header (trimmed: details only, progress/time moved to right panel)
function ExamHeader({ title, total, answered }: { title: string; total: number; answered: number }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-gray-600 mt-1">{answered} / {total} answered</p>
          </div>
        </div>
      </div>
    </header>
  );
}

// ---- Question Card
function QuestionCard({
  q,
  questionOptions,
  selected,
  onSelect,
  onToggleFlag,
  flagged,
}: {
  q: ExamQuestion;
  questionOptions: ExamQuestionOption[];
  selected: string | null;
  onSelect: (optionId: string) => void;
  onToggleFlag: () => void;
  flagged: boolean;
}) {
  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* Flag icon top-left */}
      <button
        onClick={onToggleFlag}
        className={[
          "absolute -top-3 -left-3 size-9 rounded-xl border shadow-sm flex items-center justify-center",
          flagged ? "border-rose-600 bg-rose-600 text-white" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
        ].join(" ")}
        aria-label={flagged ? "Unflag" : "Flag for review"}
        title={flagged ? "Unflag" : "Flag for review"}
      >
        <Flag className="size-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 font-semibold">
            {q.questionId}
          </span>
        </div>
        <div className="flex-1">
          <h2 className="text-base sm:text-lg font-medium leading-snug">{q.questionContent}</h2>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {questionOptions.map((option, idx) => {
          const isSelected = selected === option.optionId;
          return (
            <button
              key={option.optionId}
              onClick={() => onSelect(option.optionId)}
              className={[
                "group w-full text-left px-4 py-3 border rounded-xl transition",
                isSelected
                  ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "inline-flex size-6 items-center justify-center rounded-full border text-xs",
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-600 group-hover:border-gray-400",
                  ].join(" ")}
                >
                  {isSelected ? <Check className="size-4" /> : String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm sm:text-base">{option.content}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Navigator (right side) now hosts progress, time, and Prev/Next
function QuestionNavigator({
  total,
  currentIndex,
  answeredSet,
  flaggedSet,
  onJump,
  onPrev,
  onNext,
  timeLeft,
}: {
  total: number;
  currentIndex: number;
  answeredSet: Set<string>;
  flaggedSet: Set<string>;
  onJump: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  timeLeft: string;
}) {
  const pct = total === 0 ? 0 : Math.round((answeredSet.size / total) * 100);
  
  return (
    <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 sticky top-[84px]">
      {/* Top: time + progress */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <AlarmClock className="size-5" />
          <span className="font-medium">{timeLeft}</span>
        </div>
        <div className="text-sm text-gray-600">{answeredSet.size}/{total}</div>
      </div>
      <ProgressBar value={pct} />
      <div className="mt-1 text-xs text-gray-500">{pct}% completed</div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-blue-600 inline-block" /> Answered</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-rose-600 inline-block" /> Flag</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-emerald-600 inline-block" /> Current</span>
      </div>

      {/* Grid of square question buttons */}
      <div className="mt-4 grid grid-cols-5 sm:grid-cols-6 gap-2">
        {Array.from({ length: total }, (_, i) => {
          const idx = i; // 0-based
          const n = i + 1;
          const isCurrent = idx === currentIndex;
          const questionId = `${n}`; // Convert to string for Set lookup
          const isAnswered = answeredSet.has(questionId);
          const isFlagged = flaggedSet.has(questionId);
          return (
            <button
              key={n}
              onClick={() => onJump(idx)}
              className={[
                "relative aspect-square rounded-xl border text-sm font-semibold transition flex items-center justify-center",
                isCurrent ? "border-emerald-700 ring-2 ring-emerald-700/20" : "border-gray-300 hover:border-gray-400",
                isAnswered ? "bg-blue-600 text-white" : "bg-white text-gray-800",
              ].join(" ")}
              title={`Go to question ${n}`}
            >
              {n}
              {isFlagged && (
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-rose-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Prev / Next controls inside navigator */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={onPrev} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50">
          <ChevronLeft className="size-4" /> Prev
        </button>
        <button onClick={onNext} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50">
          Next <ChevronRight className="size-4" />
        </button>
      </div>
    </aside>
  );
}

interface ExamDoingProps {
  examData: {
    examTitle: string
    examId: string
    questionResults: ExamQuestion[]
    remainingTime: number
    totalTime: number
  }
  questionOptions: Record<string, ExamQuestionOption[]>
  onSubmit: (answers: Array<{
    questionId: string
    selectedOptionId?: string | null
    userAnswer?: string | null
  }>) => void
}

export const ExamDoing: React.FC<ExamDoingProps> = ({ examData, questionOptions, onSubmit }) => {
  const navigate = useNavigate()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { questionId: string; selectedOptionId?: string; userAnswer?: string }>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(examData.remainingTime)

  const questions = examData.questionResults
  const total = questions.length
  const currentQ = questions[currentQuestion]

  // Calculate answered questions set
  const answeredSet = useMemo(() => {
    const s = new Set<string>();
    for (const q of questions) {
      if (answers[q.questionId]?.selectedOptionId) {
        s.add(q.questionId);
      }
    }
    return s;
  }, [answers, questions]);

  const handleSubmit = useCallback(() => {
    console.log('🔥 ExamDoing: handleSubmit called')
    console.log('🔥 ExamDoing: isSubmitting =', isSubmitting)
    
    if (isSubmitting) return

    console.log('🔥 ExamDoing: Setting isSubmitting to true')
    setIsSubmitting(true)
    
    // Convert answers to the expected format
    const submitAnswers = Object.values(answers).map(answer => ({
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId || null,
      userAnswer: answer.userAnswer || null
    }))

    console.log('🔥 ExamDoing: answers state =', answers)
    console.log('🔥 ExamDoing: submitAnswers =', submitAnswers)
    console.log('🔥 ExamDoing: Calling onSubmit with submitAnswers')

    onSubmit(submitAnswers)
  }, [answers, onSubmit, isSubmitting])

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, handleSubmit])

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Handlers
  const selectAnswer = (optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.questionId]: {
        questionId: currentQ.questionId,
        selectedOptionId: optionId
      }
    }))
  }

  const toggleFlag = () => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(currentQ.questionId)) {
        next.delete(currentQ.questionId)
      } else {
        next.add(currentQ.questionId)
      }
      return next
    })
  }

  const goPrev = useCallback(() => {
    setCurrentQuestion(i => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setCurrentQuestion(i => Math.min(total - 1, i + 1))
  }, [total])

  const jumpTo = useCallback((idx: number) => {
    setCurrentQuestion(idx)
  }, [])

  // Keyboard navigation
  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") goPrev()
    if (e.key === "ArrowRight") goNext()
  }, [goPrev, goNext])

  useEffect(() => {
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onKey])

  const handleConfirmSubmit = () => {
    setShowConfirmSubmit(false)
    handleSubmit()
  }

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No questions available</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ExamHeader 
        title={examData.examTitle} 
        total={total} 
        answered={answeredSet.size} 
      />

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Question */}
        <section className="lg:col-span-8 space-y-4">
          <QuestionCard
            q={currentQ}
            questionOptions={questionOptions[currentQ.questionId] || []}
            selected={answers[currentQ.questionId]?.selectedOptionId || null}
            onSelect={selectAnswer}
            onToggleFlag={toggleFlag}
            flagged={flaggedQuestions.has(currentQ.questionId)}
          />

          <div className="flex items-center justify-between gap-3">
            <button 
              onClick={goPrev} 
              disabled={currentQuestion === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>
            <div className="text-sm text-gray-600">Question {currentQuestion + 1} of {total}</div>
            <button 
              onClick={goNext}
              disabled={currentQuestion === total - 1}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        </section>

        {/* Right: Navigator */}
        <aside className="lg:col-span-4">
          <QuestionNavigator
            total={total}
            currentIndex={currentQuestion}
            answeredSet={answeredSet}
            flaggedSet={flaggedQuestions}
            onJump={jumpTo}
            onPrev={goPrev}
            onNext={goNext}
            timeLeft={formatTime(timeLeft)}
          />
          <div className="mt-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <button 
              onClick={() => setShowConfirmSubmit(true)}
              disabled={isSubmitting}
              className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
            <p className="mt-2 text-xs text-gray-500">You can submit anytime. Unanswered questions will be saved as blank.</p>
          </div>
        </aside>
      </main>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Submit Exam</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your exam? You have answered {answeredSet.size} out of {total} questions.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
