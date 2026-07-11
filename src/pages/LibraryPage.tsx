import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Sparkles,
  Library,
  Loader2,
  Lightbulb,
  BookMarked,
  BookOpenText,
  ChevronLeft,
  List,
} from "lucide-react";
import { useLibraryStore } from "../store/useLibraryStore";
import { useAuthStore } from "../store/useAuthStore";
import FloatReader from "../components/FloatReader";

/* ─── Progress Bar ─── */

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary to-accent/70 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

/* ─── Suggested Book Chip ─── */

function SuggestedBookChip({ title }: { title: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border/60 hover:border-primary/30 hover:bg-surface-hover transition-all duration-200 text-sm text-foreground">
      <span className="text-base">📖</span>
      <span className="font-medium truncate">{title}</span>
    </div>
  );
}

/* ─── Book Card ─── */

function BookCard({
  book,
  isExpanded,
  onToggle,
  onChapterRead,
  onReadChapter,
}: {
  book: {
    id: string;
    title: string;
    author: string;
    cover_emoji: string;
    description: string;
    category: string | null;
    progress: number;
    chapters?: { id: string; title: string; order: number }[];
    readChapterIds: Set<string>;
  };
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onChapterRead: (bookId: string, chapterId: string) => void;
  onReadChapter: (bookId: string, chapterId: string) => void;
}) {
  const { profile } = useAuthStore();

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden transition-all duration-200 hover:border-primary/20 hover:shadow-sm hover:shadow-primary/5">
      {/* Header */}
      <button
        onClick={() => onToggle(book.id)}
        className="w-full flex items-start gap-4 p-4 text-left transition-all duration-150 active:scale-[0.99]"
        aria-expanded={isExpanded}
        aria-controls={`book-content-${book.id}`}
      >
        <span className="text-2xl flex-shrink-0 mt-0.5">
          {book.cover_emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-heading font-semibold text-foreground truncate">
                {book.title}
              </h3>
              <p className="text-xs text-muted mt-0.5">{book.author}</p>
            </div>
            <span
              className={`flex-shrink-0 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            >
              <ChevronDown size={18} className="text-muted" />
            </span>
          </div>

          {/* Category tag & progress */}
          <div className="flex items-center gap-2 mt-2">
            {book.category && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/8 text-primary font-medium">
                {book.category}
              </span>
            )}
            {book.progress > 0 && (
              <span className="text-[11px] text-muted font-medium">
                {book.progress}% complete
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <ProgressBar value={book.progress} />
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          id={`book-content-${book.id}`}
          className="border-t border-border px-4 py-3 space-y-3"
        >
          {/* Description */}
          {book.description && (
            <p className="text-xs text-muted leading-relaxed">
              {book.description}
            </p>
          )}

          {/* Chapters */}
          {book.chapters && book.chapters.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-muted/60 font-medium">
                Chapters
              </p>
              {book.chapters
                .sort((a, b) => a.order - b.order)
                .map((ch) => {
                  const isRead = book.readChapterIds.has(ch.id);
                  return (
                    <div
                      key={ch.id}
                      className="flex items-center gap-2 group"
                    >
                      <button
                        onClick={() => onChapterRead(book.id, ch.id)}
                        disabled={!profile}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150 hover:bg-surface-hover active:scale-[0.98] disabled:opacity-60 flex-1 min-w-0 cursor-pointer"
                        aria-label={`${isRead ? "Mark unread" : "Mark read"}: ${ch.title}`}
                      >
                        {isRead ? (
                          <CheckCircle2
                            size={16}
                            className="text-primary flex-shrink-0"
                          />
                        ) : (
                          <Circle
                            size={16}
                            className="text-muted/40 flex-shrink-0"
                          />
                        )}
                        <span
                          className={`text-xs truncate ${
                            isRead
                              ? "text-foreground/70 line-through"
                              : "text-foreground"
                          }`}
                        >
                          {ch.title}
                        </span>
                      </button>

                      <button
                        onClick={() => onReadChapter(book.id, ch.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all duration-150 active:scale-95 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
                        aria-label={`Read: ${ch.title}`}
                      >
                        <BookOpenText size={13} />
                        <span>Read</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-xs text-muted/60 italic">
              {profile
                ? "No chapters loaded yet."
                : "Sign in to track reading progress."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Category Navigation ─── */

const bookCategoryIcons: Record<string, React.ReactNode> = {
  "All": <Library size={14} />,
};

function CategoryNav({
  categories,
  counts,
  selected,
  onSelect,
}: {
  categories: readonly string[];
  counts: Record<string, number>;
  selected: string;
  onSelect: (cat: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollBy = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -220 : 220;
    el.scrollBy({ left: amount, behavior: "smooth" });
    setTimeout(checkScroll, 300);
  }, [checkScroll]);

  useEffect(() => {
    requestAnimationFrame(checkScroll);
  }, [categories, checkScroll]);

  return (
    <div className="mb-6 relative group">
      {canScrollLeft && (
        <button
          onClick={() => scrollBy("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-surface/90 backdrop-blur-sm border border-border shadow-md flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150 active:scale-90 opacity-0 group-hover:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth"
      >
        {categories.map((cat) => {
          const isActive = selected === cat;
          const count = counts[cat] ?? 0;
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 active:scale-95 border shrink-0 ${
                isActive
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface text-muted border-border hover:border-primary/30 hover:text-foreground"
              }`}
              aria-pressed={isActive}
            >
              {bookCategoryIcons[cat] ?? <BookOpen size={14} />}
              <span>{cat}</span>
              {count > 0 && (
                <span className={`ml-0.5 text-[10px] px-1.5 py-px rounded-full ${isActive ? "bg-white/20" : "bg-surface-hover"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scrollBy("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-surface/90 backdrop-blur-sm border border-border shadow-md flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150 active:scale-90 opacity-0 group-hover:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight size={16} />
        </button>
      )}
      <div className="pointer-events-none absolute left-0 top-0 bottom-1 w-8 bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
    </div>
  );
}

/* ─── Main Component ─── */

export default function LibraryPage() {
  const {
    books,
    suggestedBooks,
    isLoading,
    expandedBookId,
    initialize,
    toggleBookExpanded,
    markChapterRead,
  } = useLibraryStore();

  const { profile } = useAuthStore();

  /* Float Reader state */
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerBookId, setReaderBookId] = useState<string | null>(null);
  const [readerChapterId, setReaderChapterId] = useState<string | null>(null);

  // Category filter — placed BEFORE early return to uphold hook order
  const [selectedCategory, setSelectedCategory] = useState("All");

  const activeBook = readerBookId
    ? books.find((b) => b.id === readerBookId) ?? null
    : null;

  const openReader = useCallback(
    (bookId: string, chapterId: string) => {
      setReaderBookId(bookId);
      setReaderChapterId(chapterId);
      setReaderOpen(true);
    },
    [],
  );

  const handleNavigateChapter = useCallback((chapterId: string) => {
    setReaderChapterId(chapterId);
  }, []);

  const handleCloseReader = useCallback(() => {
    setReaderOpen(false);
    setReaderBookId(null);
    setReaderChapterId(null);
  }, []);

  /* Derive categories from books — before early return to keep hook order stable */
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    books.forEach((b) => { if (b.category) cats.add(b.category); });
    return ["All", ...Array.from(cats).sort()];
  }, [books]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: books.length };
    books.forEach((b) => {
      if (b.category) counts[b.category] = (counts[b.category] ?? 0) + 1;
    });
    return counts;
  }, [books]);

  useEffect(() => {
    initialize();
  }, [profile, initialize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="text-primary animate-spin" />
      </div>
    );
  }

  // Separate course books (with module_id) from general books
  const allCourseBooks = books.filter((b) => b.module_id != null);
  const allGeneralBooks = books.filter((b) => b.module_id == null);

  const courseBooks = selectedCategory === "All"
    ? allCourseBooks
    : allCourseBooks.filter((b) => b.category === selectedCategory);

  const generalBooks = selectedCategory === "All"
    ? allGeneralBooks
    : allGeneralBooks.filter((b) => b.category === selectedCategory);

  const hasContent =
    books.length > 0 || suggestedBooks.length > 0 || allCourseBooks.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-accent/50 to-accent/30 flex items-center justify-center shadow-lg shadow-primary/10">
            <Library size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Library
            </h1>
            <p className="text-sm text-muted">
              Readings curated from your thoughts and goals.
            </p>
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-border via-border to-transparent" />
      </div>

      {/* Category filter bar */}
      {books.length > 0 && (
        <CategoryNav
          categories={allCategories}
          counts={categoryCounts}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}

      {!hasContent ? (
        <EmptyState
          icon={BookOpen}
          title="Your library is empty"
          description="Books appear here when your thoughts are analysed or when a goal suggests learning material. Start journaling to fill your shelves!"
        />
      ) : (
        <div className="space-y-8">
          {/* AI Suggested Books */}
          {suggestedBooks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-primary" />
                <h2 className="text-sm font-heading font-semibold text-foreground">
                  AI Suggested Reading
                </h2>
                <span className="text-[11px] text-muted/60">
                  &middot; from your thoughts
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedBooks.map((title, i) => (
                  <SuggestedBookChip key={`suggested-${i}`} title={title} />
                ))}
              </div>
            </section>
          )}

          {/* Course books */}
          {courseBooks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <BookMarked size={16} className="text-accent" />
                <h2 className="text-sm font-heading font-semibold text-foreground">
                  Course Readings
                </h2>
                <span className="text-[11px] text-muted/60">
                  &middot; from your goals
                </span>
              </div>
              <div className="space-y-3">
                {courseBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isExpanded={expandedBookId === book.id}
                    onToggle={toggleBookExpanded}
                    onChapterRead={markChapterRead}
                    onReadChapter={openReader}
                  />
                ))}
              </div>
            </section>
          )}

          {/* General books */}
          {generalBooks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-primary" />
                <h2 className="text-sm font-heading font-semibold text-foreground">
                  All Books
                </h2>
              </div>
              <div className="space-y-3">
                {generalBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isExpanded={expandedBookId === book.id}
                    onToggle={toggleBookExpanded}
                    onChapterRead={markChapterRead}
                    onReadChapter={openReader}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Float Reader */}
      {activeBook && (
        <FloatReader
          isOpen={readerOpen}
          onClose={handleCloseReader}
          bookTitle={activeBook.title}
          chapters={activeBook.chapters ?? []}
          currentChapterId={readerChapterId ?? ""}
          onNavigateChapter={handleNavigateChapter}
          onChapterRead={(chapterId) => {
            markChapterRead(activeBook.id, chapterId);
          }}
        />
      )}
    </div>
  );
}

/* ─── Empty State ─── */

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface border border-border flex items-center justify-center">
        <Icon size={28} className="text-muted" />
      </div>
      <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
        {title}
      </h2>
      <p className="text-sm text-muted max-w-xs mx-auto">{description}</p>
    </div>
  );
}