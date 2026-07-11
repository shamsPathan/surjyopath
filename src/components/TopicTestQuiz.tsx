import { useState } from "react";
import { Brain, CheckCircle2, XCircle, ArrowLeft, RotateCcw } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface TopicTestQuizProps {
  title: string;
  questions: QuizQuestion[];
  onClose: () => void;
  onPass: () => void;
}

type QuizPhase = "intro" | "taking" | "result";

export default function TopicTestQuiz({ title, questions, onClose, onPass }: TopicTestQuizProps) {
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const current = questions[currentIndex];
  const isComplete = answers.every((a) => a !== null);

  const handleSelect = (optionIndex: number) => {
    if (submitted) return;
    const next = [...answers];
    next[currentIndex] = optionIndex;
    setAnswers(next);
  };

  const handleSubmitQuiz = () => {
    const allCorrect = questions.every((q, i) => answers[i] === q.correctIndex);
    if (allCorrect) {
      onPass();
      onClose();
      return;
    }
    setSubmitted(true);
    setPhase("result");
  };

  const handleRetry = () => {
    setAnswers(new Array(questions.length).fill(null));
    setCurrentIndex(0);
    setSubmitted(false);
    setPhase("taking");
  };

  const score = submitted
    ? questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0)
    : 0;

  const percentage = submitted ? Math.round((score / questions.length) * 100) : 0;

  /* ─── Intro Phase ─── */
  if (phase === "intro") {
    return (
      <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-amber-500/20 shadow-sm">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted mt-0.5">
              {questions.length} question{questions.length > 1 ? "s" : ""} &middot; Test your understanding
            </p>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed mb-4">
          Ready to test what you've learned? Answer all questions to see your score.
          You can retake the quiz anytime.
        </p>
        <button
          onClick={() => setPhase("taking")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-all duration-150 active:scale-[0.97] cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <Brain size={16} />
          Start Quiz
        </button>
      </div>
    );
  }

  /* ─── Result Phase ─── */
  if (phase === "result") {
    const passed = percentage >= 70;
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <div className="mb-4">
          <div
            className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              passed
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
          </div>
        </div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
          {passed ? "Well done!" : "Keep learning"}
        </h3>
        <p className="text-sm text-muted mb-4">
          You scored <span className="text-foreground font-semibold">{score}</span> out of{" "}
          <span className="text-foreground font-semibold">{questions.length}</span> (
          <span className="text-foreground font-semibold">{percentage}%</span>)
        </p>

        {/* Progress ring */}
        <div className="w-24 h-24 mx-auto mb-6 relative">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(0.2 0.02 50)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={passed ? "oklch(0.65 0.15 150)" : "oklch(0.6 0.15 25)"}
              strokeWidth="8"
              strokeDasharray={`${percentage * 2.64} ${264 - percentage * 2.64}`}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-foreground">{percentage}%</span>
          </div>
        </div>

        {/* Review answers */}
        <div className="space-y-1.5 text-left mb-6">
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctIndex;
            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 px-3 py-2 rounded-lg text-sm ${
                  isCorrect
                    ? "bg-emerald-500/5 border border-emerald-500/10"
                    : "bg-rose-500/5 border border-rose-500/10"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={15} className="text-rose-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-xs text-foreground">{q.question}</p>
                  {!isCorrect && (
                    <p className="text-[11px] text-muted mt-0.5">
                      Correct answer: <span className="text-emerald-400">{q.options[q.correctIndex]}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-surface-active transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <RotateCcw size={14} />
            Retry Quiz
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            Back to Goal
          </button>
        </div>
      </div>
    );
  }

  /* ─── Taking Phase ─── */
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
            }}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-active disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
            aria-label="Previous question"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-medium text-muted">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
                i === currentIndex
                  ? "bg-primary w-4"
                  : answers[i] !== null
                    ? "bg-primary/50"
                    : "bg-border/40 hover:bg-border/60"
              }`}
              aria-label={`Go to question ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="mb-6" role="radiogroup" aria-label={current?.question}>
        <h4 className="text-sm font-heading font-semibold text-foreground mb-4">
          {current?.question}
        </h4>
        <div className="space-y-2">
          {current?.options.map((option, oi) => {
            const selected = answers[currentIndex] === oi;
            const showCorrect = submitted && oi === current.correctIndex;
            const showWrong = submitted && selected && oi !== current.correctIndex;
            return (
              <button
                key={oi}
                onClick={() => handleSelect(oi)}
                disabled={submitted}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-left transition-all duration-150 cursor-pointer ${
                  showCorrect
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    : showWrong
                      ? "bg-rose-500/10 border border-rose-500/30 text-rose-300"
                      : selected
                        ? "bg-primary/10 border border-primary/30 text-foreground"
                        : "bg-surface-active/50 border border-border/50 text-muted hover:border-border hover:text-foreground"
                } ${submitted ? "cursor-default" : ""}`}
                role="radio"
                aria-checked={selected}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
                    showCorrect
                      ? "border-emerald-400 bg-emerald-400/20"
                      : showWrong
                        ? "border-rose-400 bg-rose-400/20"
                        : selected
                          ? "border-primary bg-primary/20"
                          : "border-border"
                  }`}
                >
                  {(showCorrect || showWrong || selected) && (
                    <span className={`w-2 h-2 rounded-full ${
                      showCorrect ? "bg-emerald-400" : showWrong ? "bg-rose-400" : "bg-primary"
                    }`} />
                  )}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation / Submit */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <span className="text-[11px] text-muted">
          {isComplete
            ? "All questions answered"
            : `${answers.filter((a) => a !== null).length} of ${questions.length} answered`}
        </span>
        <div className="flex items-center gap-2">
          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-150 active:scale-95 cursor-pointer"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              disabled={!isComplete}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97] cursor-pointer"
            >
              <CheckCircle2 size={13} />
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}