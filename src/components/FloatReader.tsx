import { useEffect, useCallback, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import type { Chapter } from "../api/types";

/* ─── Props ─── */

interface FloatReaderProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  chapters: Chapter[];
  currentChapterId: string;
  onNavigateChapter: (chapterId: string) => void;
  onChapterRead: (chapterId: string) => void;
}

/* ─── Component ─── */

export default function FloatReader({
  isOpen,
  onClose,
  bookTitle,
  chapters,
  currentChapterId,
  onNavigateChapter,
  onChapterRead,
}: FloatReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  /* Delay entrance for a smooth mount feel */
  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const sorted = [...chapters].sort((a, b) => a.order - b.order);
  const currentIndex = sorted.findIndex((c) => c.id === currentChapterId);
  const current = sorted[currentIndex] ?? null;
  const prevChapter = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
  const progress = sorted.length > 0
    ? Math.round(((currentIndex + 1) / sorted.length) * 100)
    : 0;

  /* Mark as read when chapter changes */
  useEffect(() => {
    if (current) {
      onChapterRead(current.id);
    }
  }, [current?.id]);

  /* Keyboard navigation */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && prevChapter)
        onNavigateChapter(prevChapter.id);
      if (e.key === "ArrowRight" && nextChapter)
        onNavigateChapter(nextChapter.id);
    },
    [onClose, prevChapter, nextChapter, onNavigateChapter],
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  /* Prevent body scroll via touchmove on overlay */
  useEffect(() => {
    if (!isOpen) return;
    const prevent = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest("[data-reader-scroll]")) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, [isOpen]);

  if (!current) return null;

  const overlayClass = visible
    ? "opacity-100 pointer-events-auto"
    : "opacity-0 pointer-events-none";

  const cardClass = visible
    ? "opacity-100 scale-100 translate-y-0"
    : "opacity-0 scale-95 translate-y-4";

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-all duration-300 ease-out ${overlayClass}`}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Reading: ${current.title}`}
      >
        {/* Warm radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, oklch(0.62 0.13 50 / 0.06) 0%, transparent 70%)",
          }}
        />

        {/* Reader card */}
        <div
          className={`relative w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col transition-all duration-350 ease-[cubic-bezier(0.32,0.72,0,1)] ${cardClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Top Bar ── */}
          <div className="flex items-center justify-between px-2 pb-3">
            <div className="flex items-center gap-2 text-muted/60">
              <BookOpen size={14} />
              <span className="text-xs font-medium tracking-wide uppercase">
                {bookTitle}
              </span>
              <span className="text-xs text-muted/40">&middot;</span>
              <span className="text-xs">{progress}%</span>
            </div>

            <div className="flex items-center gap-2">
              <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded bg-surface/30 text-muted/40 border border-border/30">
                Esc
              </kbd>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted/60 hover:text-foreground hover:bg-surface/30 transition-all duration-150 active:scale-90 cursor-pointer"
                aria-label="Close reader"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          <div
            ref={contentRef}
            data-reader-scroll
            className="flex-1 overflow-y-auto rounded-2xl bg-gradient-to-b from-[oklch(0.13_0.02_50)] to-[oklch(0.10_0.02_50)] border border-border/40 p-8 md:p-12 shadow-2xl"
          >
            {/* Chapter title */}
            <h2 className="text-2xl md:text-3xl font-serif font-medium text-foreground leading-snug mb-6 text-balance">
              {current.title}
            </h2>

            {/* Decorative divider */}
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px flex-1 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
              <span className="h-px flex-1 bg-gradient-to-l from-primary/40 via-primary/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="font-serif text-base md:text-lg leading-[1.85] text-foreground/85 space-y-5">
              {current.content.split("\n").map((paragraph, i) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return <div key={i} className="h-4" />;

                // Detect if it's a numbered list item
                if (/^\d+\./.test(trimmed)) {
                  return (
                    <p key={i} className="flex gap-2">
                      <span className="text-primary font-medium shrink-0">
                        {trimmed.match(/^\d+\./)?.[0]}
                      </span>
                      <span>{trimmed.replace(/^\d+\.\s*/, "")}</span>
                    </p>
                  );
                }

                // Detect if it's a heading-like line (all caps short)
                if (
                  trimmed === trimmed.toUpperCase() &&
                  trimmed.length < 60 &&
                  trimmed.length > 3
                ) {
                  return (
                    <h3
                      key={i}
                      className="font-heading text-sm uppercase tracking-widest text-primary/80 font-semibold"
                    >
                      {trimmed}
                    </h3>
                  );
                }

                return (
                  <p key={i} className="text-balance">
                    {trimmed}
                  </p>
                );
              })}
            </div>

            {/* Bottom fade hint */}
            <div className="h-8 bg-gradient-to-t from-[oklch(0.10_0.02_50)] to-transparent sticky bottom-0 -mx-8 -mb-8 pointer-events-none" />
          </div>

          {/* ── Bottom Navigation ── */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {prevChapter ? (
                <button
                  onClick={() => onNavigateChapter(prevChapter.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface/20 transition-all duration-150 active:scale-95 cursor-pointer"
                  aria-label={`Previous: ${prevChapter.title}`}
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline truncate max-w-[160px]">
                    {prevChapter.title}
                  </span>
                </button>
              ) : (
                <div />
              )}
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {sorted.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => onNavigateChapter(ch.id)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentIndex
                      ? "bg-primary w-4"
                      : i < currentIndex
                        ? "bg-primary/40"
                        : "bg-border/40 hover:bg-border/60"
                  }`}
                  aria-label={`Go to chapter: ${ch.title}`}
                />
              ))}
            </div>

            <div>
              {nextChapter ? (
                <button
                  onClick={() => onNavigateChapter(nextChapter.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface/20 transition-all duration-150 active:scale-95 cursor-pointer"
                  aria-label={`Next: ${nextChapter.title}`}
                >
                  <span className="hidden sm:inline truncate max-w-[160px]">
                    {nextChapter.title}
                  </span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary hover:text-primary-hover hover:bg-primary/10 transition-all duration-150 active:scale-95 cursor-pointer"
                >
                  <span>Finish reading</span>
                  <BookOpen size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}