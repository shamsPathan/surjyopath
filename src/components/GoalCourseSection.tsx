import { useState, useCallback, useMemo } from "react";
import { ChevronDown, ChevronRight, BookOpen, FileText, Brain, CheckCircle2, BookMarked } from "lucide-react";
import type { GoalCourseModule } from "../types/goal";
import type { Chapter } from "../api/types";
import TopicTestQuiz from "./TopicTestQuiz";
import FloatReader from "./FloatReader";

interface GoalCourseSectionProps {
  course: GoalCourseModule[];
  goalId: string;
  onViewDetail: (goalId: string) => void;
  completedQuizzes: Set<number>;
  onCompleteQuiz: (moduleIndex: number) => void;
}

/* ─── Helpers ─── */

/** Map a course book's inline chapters (title + content only) to Chapter[] with synthetic IDs */
function courseToChapters(
  moduleIndex: number,
  bookIndex: number,
  chapters: { title: string; content: string }[],
): Chapter[] {
  return chapters.map((ch, ci) => ({
    id: `course-${moduleIndex}-${bookIndex}-${ci}`,
    book_id: `course-book-${moduleIndex}-${bookIndex}`,
    title: ch.title,
    content: ch.content,
    order: ci,
    created_at: "",
  }));
}

export default function GoalCourseSection({
  course,
  goalId,
  onViewDetail,
  completedQuizzes,
  onCompleteQuiz,
}: GoalCourseSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [quizModule, setQuizModule] = useState<number | null>(null);

  /* FloatReader state for course books */
  const [readerBook, setReaderBook] = useState<{
    moduleIndex: number;
    bookIndex: number;
    title: string;
    chapters: Chapter[];
  } | null>(null);
  const [readerChapterId, setReaderChapterId] = useState<string>("");

  if (!course || course.length === 0) return null;

  const totalBooks = course.reduce((sum, m) => sum + (m.books?.length ?? 0), 0);
  const totalQuizzes = course.filter((m) => m.topicTest).length;

  /* Flatten all chapters for keyboard efficiency */
  const allReaderChapters = useMemo(() => {
    if (!readerBook) return [];
    return readerBook.chapters;
  }, [readerBook]);

  const handleOpenBook = useCallback(
    (mi: number, bi: number, book: GoalCourseModule["books"][number]) => {
      const chapters = courseToChapters(mi, bi, book.chapters ?? []);
      setReaderBook({
        moduleIndex: mi,
        bookIndex: bi,
        title: book.title,
        chapters,
      });
      setReaderChapterId(chapters[0]?.id ?? "");
    },
    [],
  );

  const handleCloseReader = useCallback(() => {
    setReaderBook(null);
    setReaderChapterId("");
  }, []);

  const handleNavigateChapter = useCallback((chapterId: string) => {
    setReaderChapterId(chapterId);
  }, []);

  const handleChapterRead = useCallback((_chapterId: string) => {
    // Course book reading progress could be stored in local state if desired
  }, []);

  return (
    <>
      <div className="mt-4 rounded-xl border border-primary/10 bg-primary/[0.03] overflow-hidden transition-all duration-200">
        {/* Header bar */}
        <div className="w-full flex items-center justify-between px-4 py-3 gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2.5 text-left transition-all duration-150 hover:bg-primary/[0.03] rounded-lg cursor-pointer grow min-w-0"
            aria-expanded={expanded}
            aria-controls="course-content"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center shrink-0">
              <Brain size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-foreground">AI Learning Path</span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="text-[11px] text-muted">
                  {course.length} {course.length === 1 ? "module" : "modules"}
                </span>
                <span className="text-[10px] text-muted/40">&middot;</span>
                <span className="text-[11px] text-muted">{totalBooks} books</span>
                {totalQuizzes > 0 && (
                  <>
                    <span className="text-[10px] text-muted/40">&middot;</span>
                    <span className="text-[11px] text-muted">{totalQuizzes} quiz{totalQuizzes > 1 ? "zes" : ""}</span>
                  </>
                )}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(goalId);
              }}
              className="text-[11px] font-medium text-primary hover:text-primary-hover px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-all duration-150 active:scale-95 cursor-pointer"
            >
              View full course
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-0.5 rounded-md hover:bg-surface-active transition-all duration-150 cursor-pointer"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronDown size={16} className="text-muted" />
              ) : (
                <ChevronRight size={16} className="text-muted" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div id="course-content" className="px-4 pb-4 space-y-2 border-t border-border/40 pt-3">
            {course.map((mod, mi) => {
              const quizCompleted = completedQuizzes.has(mi);
              return (
                <div
                  key={mi}
                  className="rounded-lg border border-border/50 bg-surface/40 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setExpandedModule(expandedModule === mi ? null : mi)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-left cursor-pointer hover:bg-surface-active/50 transition-all duration-150"
                    aria-expanded={expandedModule === mi}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-semibold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-md shrink-0">
                        {mi + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate">
                        {mod.title}
                      </span>
                      {quizCompleted && (
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-muted">
                        {mod.books?.length ?? 0} {(mod.books?.length ?? 0) === 1 ? "book" : "books"}
                      </span>
                      {quizCompleted ? (
                        <span className="text-[10px] text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Done
                        </span>
                      ) : mod.topicTest && (
                        <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium">
                          Quiz
                        </span>
                      )}
                      {expandedModule === mi ? (
                        <ChevronDown size={14} className="text-muted" />
                      ) : (
                        <ChevronRight size={14} className="text-muted" />
                      )}
                    </div>
                  </button>

                  {/* Module detail */}
                  {expandedModule === mi && (
                    <div className="px-3.5 pb-3 space-y-2 border-t border-border/30 pt-2">
                      {mod.description && (
                        <p className="text-xs text-muted leading-relaxed">{mod.description}</p>
                      )}

                      {/* Books — now with Read buttons */}
                      {mod.books && mod.books.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-medium text-foreground/70 flex items-center gap-1.5">
                            <BookOpen size={12} />
                            Books
                          </span>
                          {mod.books.map((book, bi) => {
                            const chapterCount = book.chapters?.length ?? 0;
                            return (
                              <div
                                key={bi}
                                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface-active/40 border border-border/30"
                              >
                                <FileText size={13} className="text-primary/60 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-medium text-foreground block truncate">
                                    {book.title}
                                  </span>
                                  <span className="text-[10px] text-muted block">
                                    {book.author} &middot; {chapterCount} chapter{chapterCount !== 1 ? "s" : ""}
                                  </span>
                                </div>
                                {chapterCount > 0 && (
                                  <button
                                    onClick={() => handleOpenBook(mi, bi, book)}
                                    className="shrink-0 flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-150 active:scale-95 cursor-pointer"
                                  >
                                    <BookMarked size={12} />
                                    Read
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Quiz section — interactive */}
                      {mod.topicTest && (
                        <div>
                          {quizCompleted ? (
                            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                              <span className="text-xs text-tag-green">
                                {mod.topicTest.title} &middot; Quiz completed
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                              <div className="flex items-center gap-2 min-w-0">
                                <Brain size={13} className="text-amber-400 shrink-0" />
                                <span className="text-xs text-tag-amber truncate">
                                  {mod.topicTest.title} &middot; {mod.topicTest.questions?.length ?? 0} questions
                                </span>
                              </div>
                              <button
                                onClick={() => setQuizModule(mi)}
                                className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-amber-500/20 text-tag-amber hover:bg-amber-500/30 transition-all duration-150 active:scale-95 cursor-pointer"
                              >
                                Take Quiz
                              </button>
                            </div>
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
      </div>

      {/* Quiz modal — rendered outside the card for clean stacking */}
      {quizModule !== null && course[quizModule]?.topicTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <TopicTestQuiz
              title={course[quizModule].topicTest!.title}
              questions={course[quizModule].topicTest!.questions}
              onClose={() => setQuizModule(null)}
              onPass={() => {
                onCompleteQuiz(quizModule);
                setQuizModule(null);
              }}
            />
          </div>
        </div>
      )}

      {/* FloatReader for course books */}
      {readerBook && (
        <FloatReader
          isOpen={true}
          onClose={handleCloseReader}
          bookTitle={readerBook.title}
          chapters={allReaderChapters}
          currentChapterId={readerChapterId}
          onNavigateChapter={handleNavigateChapter}
          onChapterRead={handleChapterRead}
        />
      )}
    </>
  );
}