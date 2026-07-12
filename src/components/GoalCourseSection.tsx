import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, FileText, Brain } from "lucide-react";
import type { GoalCourseModule } from "../types/goal";

interface GoalCourseSectionProps {
  course: GoalCourseModule[];
  goalId: string;
  onViewDetail: (goalId: string) => void;
}

export default function GoalCourseSection({ course, goalId, onViewDetail }: GoalCourseSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  if (!course || course.length === 0) return null;

  const totalBooks = course.reduce((sum, m) => sum + (m.books?.length ?? 0), 0);
  const totalQuizzes = course.filter((m) => m.topicTest).length;

  return (
    <div className="mt-4 rounded-xl border border-primary/10 bg-primary/[0.03] overflow-hidden transition-all duration-200">
      {/* Header bar — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-all duration-150 hover:bg-primary/[0.03] cursor-pointer"
        aria-expanded={expanded}
        aria-controls="course-content"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center">
            <Brain size={14} className="text-white" />
          </div>
          <div>
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
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail(goalId);
            }}
            className="text-[11px] font-medium text-primary hover:text-primary-hover px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            View full course
          </button>
          {expanded ? (
            <ChevronDown size={16} className="text-muted shrink-0" />
          ) : (
            <ChevronRight size={16} className="text-muted shrink-0" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div id="course-content" className="px-4 pb-4 space-y-2 border-t border-border/40 pt-3">
          {course.map((mod, mi) => (
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
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted">
                    {mod.books?.length ?? 0} {(mod.books?.length ?? 0) === 1 ? "book" : "books"}
                  </span>
                  {mod.topicTest && (
                    <span className="text-[10px] text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded font-medium">
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

                  {/* Books */}
                  {mod.books && mod.books.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-foreground/70 flex items-center gap-1.5">
                        <BookOpen size={12} />
                        Books
                      </span>
                      {mod.books.map((book, bi) => (
                        <div
                          key={bi}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface-active/40 border border-border/30"
                        >
                          <FileText size={13} className="text-primary/60 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-foreground block truncate">
                              {book.title}
                            </span>
                            <span className="text-[10px] text-muted block">
                              {book.author} &middot; {book.chapters?.length ?? 0} chapters
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Topic test badge */}
                  {mod.topicTest && (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <Brain size={13} className="text-amber-400 shrink-0" />
                      <span className="text-xs text-amber-300/80">
                        {mod.topicTest.title} &middot; {mod.topicTest.questions?.length ?? 0} questions
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}