import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Target, BookOpen, Brain, CheckCircle2, Circle,
  ChevronDown, ChevronRight, FileText, Calendar, Sparkles,
} from "lucide-react";
import type { CompassDirection } from "../types/goal";
import { useGoalStore } from "../store/useGoalStore";
import TopicTestQuiz from "../components/TopicTestQuiz";
import FloatReader from "../components/FloatReader";

/* ─── Compass meta ─── */
const COMPASS_META: Record<CompassDirection, { icon: typeof Target; label: string; colorClass: string }> = {
  growth:    { icon: Target, label: "Growth",    colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  creation:  { icon: Target, label: "Creation",  colorClass: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  grounding: { icon: Target, label: "Grounding", colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  release:   { icon: Target, label: "Release",   colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, toggleStep, generateCourse } = useGoalStore();
  const goal = goals.find((g) => g.id === id);

  /* ─── Reading state ─── */
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerBook, setReaderBook] = useState<{ title: string; chapters: { title: string; content: string }[] } | null>(null);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);

  /* ─── Quiz state ─── */
  const [activeQuiz, setActiveQuiz] = useState<{ title: string; questions: { question: string; options: string[]; correctIndex: number }[] } | null>(null);

  /* ─── Expanded modules ─── */
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});

  if (!goal) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface border border-border flex items-center justify-center">
          <Target size={28} className="text-muted" />
        </div>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-1">Goal not found</h2>
        <p className="text-sm text-muted mb-4">This goal doesn't exist or has been deleted.</p>
        <button
          onClick={() => navigate("/goals")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-all duration-150 active:scale-[0.97] cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Goals
        </button>
      </div>
    );
  }

  const isComplete = goal.progress === 100;

  /* ─── Handlers ─── */

  const toggleModule = (idx: number) => {
    setExpandedModules((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const openReader = (book: { title: string; chapters: { title: string; content: string }[] }) => {
    setReaderBook(book);
    setCurrentChapterIdx(0);
    setReaderOpen(true);
  };

  const closeReader = () => {
    setReaderOpen(false);
    setReaderBook(null);
    setCurrentChapterIdx(0);
  };

  const navigateChapter = (chapterId: string) => {
    const idx = readerBook?.chapters.findIndex((_, i) => `ch-${i}` === chapterId) ?? -1;
    if (idx >= 0) setCurrentChapterIdx(idx);
  };

  const handleChapterRead = (_chapterId: string) => {
    // Could track read progress here
  };

  return (
    <>
      <div className="max-w-3xl mx-auto">
        {/* ── Back button ── */}
        <button
          onClick={() => navigate("/goals")}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-6 transition-all duration-150 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Goals
        </button>

        {/* ── Goal Header ── */}
        <div className="rounded-xl bg-surface border border-border p-6 shadow-sm mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${
                isComplete
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20"
                  : "bg-gradient-to-br from-primary to-accent/60 shadow-primary/10"
              }`}
            >
              <Target size={22} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">
                {goal.title}
              </h1>
              {goal.description && (
                <p className="text-sm text-muted mt-1 leading-relaxed">{goal.description}</p>
              )}
            </div>
          </div>

          {/* Badges row */}
          <div className="flex items-center flex-wrap gap-2 mb-4">
            {goal.direction && COMPASS_META[goal.direction] && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${COMPASS_META[goal.direction].colorClass}`}>
                {COMPASS_META[goal.direction].label}
              </span>
            )}
            {goal.target_date && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-active border border-border text-muted">
                <Calendar size={12} />
                {formatDate(goal.target_date)}
              </span>
            )}
            {isComplete && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={12} />
                Complete
              </span>
            )}
            {goal.aiCourseStatus === "generating" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                <Sparkles size={12} className="animate-pulse" />
                Generating course…
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted">Progress</span>
              <span className="text-xs font-semibold tabular-nums text-foreground">{goal.progress}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-active border border-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isComplete
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    : "bg-gradient-to-r from-primary to-accent"
                }`}
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          {goal.steps.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/40">
              <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">Learning Path Steps</h3>
              <div className="space-y-1.5">
                {goal.steps.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => toggleStep(goal.id, idx)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${
                      step.completed
                        ? "bg-emerald-500/5 border border-emerald-500/10"
                        : "bg-surface-active/50 border border-transparent hover:bg-surface-active"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {step.completed ? (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      ) : (
                        <Circle size={18} className="text-muted" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className={`text-sm font-medium ${step.completed ? "text-muted line-through" : "text-foreground"}`}>
                        {step.title}
                      </span>
                      {step.description && (
                        <p className={`text-xs mt-0.5 leading-relaxed ${step.completed ? "text-muted/60" : "text-muted"}`}>
                          {step.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── AI Course ── */}
        {goal.aiCourseStatus === "generating" && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 mb-6">
            <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span className="text-sm font-medium text-primary/70">Knock AI is building your learning path…</span>
          </div>
        )}

        {goal.aiCourseStatus === "failed" && (
          <div className="rounded-xl bg-rose-500/5 border border-rose-500/10 p-4 mb-6">
            <p className="text-sm text-rose-400/80 mb-2">AI generation didn't complete.</p>
            <button
              onClick={() => generateCourse(goal.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all duration-150 active:scale-95 cursor-pointer"
            >
              Retry AI generation
            </button>
          </div>
        )}

        {goal.course && goal.course.length > 0 && goal.aiCourseStatus === "ready" && (
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
              <Brain size={20} className="text-primary" />
              AI-Generated Course
            </h2>

            {goal.course.map((mod, mi) => {
              const isExpanded = expandedModules[mi] ?? false;
              return (
                <div
                  key={mi}
                  className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm transition-all duration-200"
                >
                  {/* Module header */}
                  <button
                    onClick={() => toggleModule(mi)}
                    className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-surface-active/50 transition-all duration-150"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {mi + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{mod.title}</h3>
                        {mod.description && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">{mod.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-muted">
                        {mod.books?.length ?? 0} book{(mod.books?.length ?? 0) !== 1 ? "s" : ""}
                      </span>
                      {isExpanded ? <ChevronDown size={16} className="text-muted" /> : <ChevronRight size={16} className="text-muted" />}
                    </div>
                  </button>

                  {/* Module content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                      {mod.description && (
                        <p className="text-xs text-muted leading-relaxed">{mod.description}</p>
                      )}

                      {/* Books */}
                      {mod.books && mod.books.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-medium text-foreground/60 uppercase tracking-wide flex items-center gap-1.5">
                            <BookOpen size={12} /> Books
                          </h4>
                          {mod.books.map((book, bi) => (
                            <div
                              key={bi}
                              className="rounded-lg border border-border/50 bg-surface-active/30 p-3 transition-all duration-150 hover:border-primary/20"
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-foreground">{book.title}</span>
                                  <span className="text-xs text-muted block mt-0.5">by {book.author}</span>
                                </div>
                                <button
                                  onClick={() => openReader(book)}
                                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-150 active:scale-95 cursor-pointer"
                                >
                                  <BookOpen size={12} />
                                  Read
                                </button>
                              </div>
                              {book.description && (
                                <p className="text-xs text-muted leading-relaxed mb-2">{book.description}</p>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {book.chapters.map((ch, ci) => (
                                  <span
                                    key={ci}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border/30 text-muted"
                                  >
                                    {ch.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Topic test */}
                      {mod.topicTest && (
                        <div className="pt-1">
                          {activeQuiz ? (
                            <TopicTestQuiz
                              title={activeQuiz.title}
                              questions={activeQuiz.questions}
                              onClose={() => setActiveQuiz(null)}
                            />
                          ) : (
                            <button
                              onClick={() =>
                                setActiveQuiz({
                                  title: mod.topicTest!.title,
                                  questions: mod.topicTest!.questions,
                                })
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.05] transition-all duration-150 active:scale-[0.99] cursor-pointer group"
                            >
                              <Brain size={18} className="text-amber-400 shrink-0" />
                              <div className="text-left min-w-0">
                                <span className="text-sm font-medium text-amber-300/90 group-hover:text-amber-300 transition-colors">
                                  {mod.topicTest.title}
                                </span>
                                <span className="text-xs text-muted block mt-0.5">
                                  {mod.topicTest.questions.length} questions — test what you've learned
                                </span>
                              </div>
                              <ChevronRight size={16} className="text-amber-400/60 ml-auto shrink-0" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No course yet — prompt to generate */}
        {goal.aiCourseStatus === "idle" && (!goal.course || goal.course.length === 0) && (
          <div className="rounded-xl border border-dashed border-primary/20 bg-primary/[0.02] p-6 text-center">
            <Brain size={32} className="text-primary/40 mx-auto mb-3" />
            <h3 className="text-base font-heading font-semibold text-foreground mb-1">
              No AI learning path yet
            </h3>
            <p className="text-sm text-muted max-w-sm mx-auto leading-relaxed mb-4">
              Let Knock AI build a structured course with modules, books, and topic tests
              tailored to this goal.
            </p>
            <button
              onClick={() => generateCourse(goal.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-all duration-150 active:scale-[0.97] cursor-pointer shadow-lg shadow-primary/20"
            >
              <Sparkles size={16} />
              Generate AI Learning Path
            </button>
          </div>
        )}
      </div>

      {/* ── FloatReader ── */}
      {readerBook && (
        <FloatReader
          isOpen={readerOpen}
          onClose={closeReader}
          bookTitle={readerBook.title}
          chapters={readerBook.chapters.map((ch, i) => ({
            id: `ch-${i}`,
            book_id: readerBook.title,
            title: ch.title,
            content: ch.content,
            order: i,
            created_at: new Date().toISOString(),
          }))}
          currentChapterId={`ch-${currentChapterIdx}`}
          onNavigateChapter={navigateChapter}
          onChapterRead={handleChapterRead}
        />
      )}
    </>
  );
}