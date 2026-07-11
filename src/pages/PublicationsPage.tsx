import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Newspaper,
  ArrowLeft,
  Heart,
  Check,
  Trash2,
  Eye,
  Clock,
  Tag,
  MessageCircle,
  Plus,
  LogIn,
  X,
  Link,
  BookOpen,
  Sparkles,
  Building2,
  Monitor,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PublicationCard from "../components/PublicationCard";
import { usePublicationStore } from "../store/usePublicationStore";
import { useJournalStore } from "../store/useJournalStore";
import { useAuthStore } from "../store/useAuthStore";
import type { Publication } from "../types/publication";

/* ─── Category config ─── */

const CATEGORIES = [
  "All",
  "Personal Growth",
  "Health & Wellness",
  "Creativity & Projects",
  "Relationships",
  "Daily Life",
  "Work & Career",
  "Tech & Science",
  "Learning & Reading",
  "Gratitude",
  "Reflections",
  "General",
] as const;

const categoryIcons: Record<string, React.ReactNode> = {
  "All": <List size={14} />,
  "Personal Growth": <Sparkles size={14} />,
  "Health & Wellness": <Heart size={14} />,
  "Creativity & Projects": <BookOpen size={14} />,
  "Relationships": <MessageCircle size={14} />,
  "Daily Life": <Clock size={14} />,
  "Work & Career": <Building2 size={14} />,
  "Tech & Science": <Monitor size={14} />,
  "Learning & Reading": <BookOpen size={14} />,
  "Gratitude": <Sparkles size={14} />,
  "Reflections": <Eye size={14} />,
  "General": <Tag size={14} />,
};

/* ─── Tag colour mapping ─── */

const tagColors: Record<string, string> = {
  mindfulness: "bg-tag-teal/20 text-tag-teal",
  routine: "bg-tag-blue/20 text-tag-blue",
  wellness: "bg-tag-green/20 text-tag-green",
  reading: "bg-tag-violet/20 text-tag-violet",
  growth: "bg-tag-amber/20 text-tag-amber",
  habits: "bg-tag-green/20 text-tag-green",
  creative: "bg-tag-rose/20 text-tag-rose",
  projects: "bg-tag-blue/20 text-tag-blue",
  tech: "bg-tag-violet/20 text-tag-violet",
  gratitude: "bg-tag-amber/20 text-tag-amber",
  reflection: "bg-tag-teal/20 text-tag-teal",
  friends: "bg-tag-rose/20 text-tag-rose",
  emotions: "bg-tag-rose/20 text-tag-rose",
  work: "bg-tag-blue/20 text-tag-blue",
  nature: "bg-tag-green/20 text-tag-green",
  adventure: "bg-tag-amber/20 text-tag-amber",
  weekend: "bg-tag-violet/20 text-tag-violet",
};

const defaultTagStyle = "bg-surface-hover text-muted";

function getTagStyle(tag: string): string {
  return tagColors[tag.toLowerCase()] || defaultTagStyle;
}

/* ─── Helpers ─── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ==============================================================
   ─── ARTICLE DETAIL VIEW ───
   ============================================================== */

function ArticleDetail({ publication }: { publication: Publication }) {
  const selectPublication = usePublicationStore((s) => s.selectPublication);
  const toggleLike = usePublicationStore((s) => s.toggleLike);
  const unpublish = usePublicationStore((s) => s.unpublish);
  const deletePublication = usePublicationStore((s) => s.deletePublication);

  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const shareUrl = `${window.location.origin}/publications/${publication.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => selectPublication(null);

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors duration-150 mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
        Back to publications
      </button>

      {/* Article header */}
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-foreground leading-tight mb-3">
          {publication.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted mb-3">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={12} />
            Published {timeAgo(publication.published_at || publication.created_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Heart size={12} />
            {publication.likes_count} {publication.likes_count === 1 ? "like" : "likes"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle size={12} />
            {publication.comments_count} {publication.comments_count === 1 ? "comment" : "comments"}
          </span>
          {publication.category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {publication.category}
            </span>
          )}
        </div>

        {/* Tags */}
        {publication.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {publication.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTagStyle(tag)}`}
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-primary/30 via-border to-transparent" />
      </div>

      {/* Article content */}
      <div className="mb-10">
        <p className="text-base text-foreground/85 leading-relaxed whitespace-pre-line">
          {publication.content}
        </p>
      </div>

      {/* Social actions bar */}
      <div className="sticky bottom-6">
        <div className="rounded-xl border border-border bg-surface/80 backdrop-blur-md p-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            {/* Like */}
            <button
              onClick={() => toggleLike(publication.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 ${
                publication.liked_by_user
                  ? "bg-rose-500/15 text-rose-400"
                  : "text-muted hover:text-rose-400 hover:bg-rose-500/10"
              }`}
              aria-label={publication.liked_by_user ? "Unlike" : "Like"}
            >
              <Heart size={14} fill={publication.liked_by_user ? "currentColor" : "none"} />
              {publication.likes_count > 0 && publication.likes_count}
            </button>

            {/* Share */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary hover:bg-primary/10 transition-all duration-150 active:scale-95"
              aria-label="Copy share link"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Link size={14} />
                  Copy Link
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
              aria-label="More actions"
            >
              <Trash2 size={14} />
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute bottom-full right-0 mb-2 z-20 w-44 rounded-lg border border-border bg-surface shadow-lg p-1.5">
                  <button
                    onClick={() => { unpublish(publication.id); handleBack(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-150"
                  >
                    <Eye size={14} />
                    Unpublish (set to draft)
                  </button>
                  <button
                    onClick={() => { deletePublication(publication.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-all duration-150"
                  >
                    <Trash2 size={14} />
                    Delete permanently
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==============================================================
   ─── PUBLISH FROM JOURNAL MODAL ───
   ============================================================== */

function PublishModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const thoughts = useJournalStore((s) => s.thoughts);
  const publishFromThought = usePublicationStore((s) => s.publishFromThought);
  const updateThought = useJournalStore((s) => s.updateThought);

  const publishableThoughts = thoughts.filter(
    (t) => !t.is_published && t.status === "ready" && t.analysis !== null,
  );

  const recentThoughts = thoughts.filter(
    (t) => !t.is_published && (t.status !== "ready" || !t.analysis),
  );

  const handlePublish = (thoughtId: string) => {
    const thought = thoughts.find((t) => t.id === thoughtId);
    if (!thought) return;

    const pubId = publishFromThought(thought);
    updateThought(thoughtId, { is_published: true, publication_id: pubId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-heading font-semibold text-foreground">
                Publish a Thought
              </h2>
              <p className="text-xs text-muted">
                Choose an AI-analysed thought to share with the community.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Publishable thoughts */}
        {publishableThoughts.length > 0 && (
          <div className="space-y-2 mb-5">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              Ready to publish
            </p>
            {publishableThoughts.map((thought) => (
              <button
                key={thought.id}
                onClick={() => handlePublish(thought.id)}
                className="w-full text-left p-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all duration-150 active:scale-[0.99]"
              >
                <p className="text-sm font-medium text-foreground">{thought.title}</p>
                <p className="text-xs text-muted mt-0.5 line-clamp-1">{thought.content}</p>
              </button>
            ))}
          </div>
        )}

        {/* Thoughts that need AI analysis first */}
        {recentThoughts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Needs AI analysis first
            </p>
            {recentThoughts.map((thought) => (
              <div
                key={thought.id}
                className="p-3 rounded-lg border border-border bg-surface-hover/50 opacity-60"
              >
                <p className="text-sm font-medium text-foreground">{thought.title}</p>
                <p className="text-xs text-muted mt-1">
                  Use Knock AI in the Journal to analyse this thought before publishing.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* No thoughts at all */}
        {publishableThoughts.length === 0 && recentThoughts.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-surface border border-border flex items-center justify-center">
              <BookOpen size={20} className="text-muted" />
            </div>
            <p className="text-sm text-foreground mb-1">No thoughts to publish yet</p>
            <p className="text-xs text-muted">
              Write and analyse a thought in your Journal first.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate("/journal");
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-hover transition-all duration-150 active:scale-95"
            >
              <Plus size={12} />
              Go to Journal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==============================================================
   ─── CATEGORY NAVIGATION ───
   ============================================================== */

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
    // Check again after animation
    setTimeout(checkScroll, 300);
  }, [checkScroll]);

  /* Re-check on mount and when categories change */
  useEffect(() => {
    requestAnimationFrame(checkScroll);
  }, [categories, checkScroll]);

  return (
    <div className="mb-6 relative group">
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-surface/90 backdrop-blur-sm border border-border shadow-md flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150 active:scale-90 opacity-0 group-hover:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {/* Scrollable chips */}
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
              {categoryIcons[cat]}
              <span>{cat}</span>
              {count > 0 && (
                <span
                  className={`ml-0.5 text-[10px] px-1.5 py-px rounded-full ${
                    isActive ? "bg-white/20" : "bg-surface-hover"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-surface/90 backdrop-blur-sm border border-border shadow-md flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150 active:scale-90 opacity-0 group-hover:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Fade edges to hint at more content */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-1 w-8 bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
    </div>
  );
}

/* ==============================================================
   ─── MAIN PAGE ───
   ============================================================== */

export default function PublicationsPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { publications, selectedId, selectPublication } = usePublicationStore();
  const publishModalOpen = usePublicationStore((s) => s.publishModalOpen);
  const setPublishModalOpen = usePublicationStore((s) => s.setPublishModalOpen);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(
    () => sessionStorage.getItem("pub_guest_banner_dismissed") === "true",
  );

  const dismissGuestBanner = () => {
    setGuestBannerDismissed(true);
    sessionStorage.setItem("pub_guest_banner_dismissed", "true");
  };

  const handleSignIn = () => {
    sessionStorage.setItem("auth_return_path", window.location.pathname);
    navigate("/auth");
  };

  /* ── Category counts & filtered list ── */
  const { categoryCounts, filteredPublications } = useMemo(() => {
    const counts: Record<string, number> = { All: 0 };
    for (const cat of CATEGORIES) {
      if (cat !== "All") counts[cat] = 0;
    }

    for (const pub of publications) {
      const cat = pub.category || "General";
      counts["All"] = (counts["All"] ?? 0) + 1;
      counts[cat] = (counts[cat] ?? 0) + 1;
    }

    const filtered =
      selectedCategory === "All"
        ? publications
        : publications.filter(
            (p) => (p.category || "General") === selectedCategory,
          );

    return { categoryCounts: counts, filteredPublications: filtered };
  }, [publications, selectedCategory]);

  const selectedPublication = selectedId
    ? publications.find((p) => p.id === selectedId)
    : null;

  /* If a publication is selected, show detail view */
  if (selectedPublication) {
    return <ArticleDetail publication={selectedPublication} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center shadow-lg shadow-primary/10">
              <Newspaper size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Publications
              </h1>
              <p className="text-sm text-muted">
                Polished thoughts shared with the community.
              </p>
            </div>
          </div>
          <button
            onClick={() => setPublishModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-150 active:scale-95"
          >
            <Plus size={16} />
            Publish
          </button>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-border via-border to-transparent" />
      </div>

      {/* Guest mode banner */}
      {!isAuthenticated && !guestBannerDismissed && (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">You're in guest mode</p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Sign in to share publications, build a following, and keep your
                articles safe in the cloud. Your current posts are saved locally.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={dismissGuestBanner}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150"
            >
              Dismiss
            </button>
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-150 active:scale-95"
            >
              <LogIn size={14} />
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Publish modal */}
      {publishModalOpen && <PublishModal onClose={() => setPublishModalOpen(false)} />}

      {/* Category navigation */}
      <CategoryNav
        categories={CATEGORIES}
        counts={categoryCounts}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Publications list or empty state */}
      {filteredPublications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface border border-border flex items-center justify-center">
            <Newspaper size={28} className="text-muted" />
          </div>
          {selectedCategory === "All" ? (
            <>
              <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
                No publications yet
              </h2>
              <p className="text-sm text-muted max-w-xs mx-auto mb-6">
                Refine a thought with AI analysis and publish it for others to read,
                like, and comment on. Your voice matters here.
              </p>
              <button
                onClick={() => setPublishModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-150 active:scale-95"
              >
                <Plus size={16} />
                Publish your first article
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
                Nothing in "{selectedCategory}"
              </h2>
              <p className="text-sm text-muted max-w-xs mx-auto mb-6">
                No publications in this category yet. Try another category or publish
                something new.
              </p>
              <button
                onClick={() => setSelectedCategory("All")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-surface text-foreground border border-border hover:bg-surface-hover transition-all duration-150 active:scale-95"
              >
                View all publications
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              {selectedCategory === "All"
                ? "All publications"
                : selectedCategory}
              <span className="ml-2 text-xs bg-surface-hover px-2 py-0.5 rounded-full">
                {filteredPublications.length}
              </span>
            </p>
            {selectedCategory !== "All" && (
              <button
                onClick={() => setSelectedCategory("All")}
                className="text-xs text-muted hover:text-foreground transition-colors duration-150"
              >
                Clear filter
              </button>
            )}
          </div>
          {filteredPublications.map((pub) => (
            <PublicationCard key={pub.id} publication={pub} />
          ))}
        </div>
      )}
    </div>
  );
}