import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Check,
  Trash2,
  Clock,
  Tag,
  MessageCircle,
  Sparkles,
  Link as LinkIcon,
  LogIn,
} from "lucide-react";
import { usePublicationStore } from "../store/usePublicationStore";
import { useAuthStore } from "../store/useAuthStore";
import type { Publication } from "../types/publication";

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

/* ─── Time helper ─── */
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

/* ─── Article Detail ─── */
function ArticleDetail({ publication, onBack, isOwner, isAuthenticated }: { publication: Publication; onBack: () => void; isOwner: boolean; isAuthenticated: boolean }) {
  const toggleLike = usePublicationStore((s) => s.toggleLike);
  const unpublish = usePublicationStore((s) => s.unpublish);
  const deletePublication = usePublicationStore((s) => s.deletePublication);
  const polishPublication = usePublicationStore((s) => s.polishPublication);
  const polishingId = usePublicationStore((s) => s.polishingId);

  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const isPolishing = polishingId === publication.id;

  const displayContent = publication.is_polished && showOriginal
    ? publication.content
    : publication.polished_content || publication.content;

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Back button */}
      <button
        onClick={onBack}
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
        </div>

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

        {/* Author */}
        <p className="text-xs text-muted">
          By <span className="font-medium text-foreground">{isOwner ? "You" : publication.author_name}</span>
        </p>

        <div className="mt-4 h-px bg-gradient-to-r from-primary/30 via-border to-transparent" />
      </div>

      {/* Article content */}
      <div className="mb-10">
        {publication.is_polished && (
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/20">
              <Sparkles size={12} />
              Polished by AI
            </span>
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="text-xs font-medium text-muted hover:text-foreground underline underline-offset-2 transition-colors duration-150"
            >
              {showOriginal ? "Show polished ✨" : "Show original"}
            </button>
          </div>
        )}

        {isPolishing ? (
          <div className="flex items-center gap-3 py-8 text-muted">
            <Sparkles size={18} className="animate-pulse text-amber-400" />
            <span className="text-sm">Polishing your thoughts with AI&hellip;</span>
          </div>
        ) : (
          <p className="text-base text-foreground/85 leading-relaxed whitespace-pre-line">
            {displayContent}
          </p>
        )}
      </div>

      {/* Social actions bar */}
      <div className="sticky bottom-6">
        <div className="rounded-xl border border-border bg-surface/80 backdrop-blur-md p-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
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

            {isOwner && !publication.is_polished && (
              <button
                onClick={() => polishPublication(publication.id)}
                disabled={isPolishing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Polish with AI"
              >
                <Sparkles size={14} className={isPolishing ? "animate-pulse" : ""} />
                {isPolishing ? "Polishing…" : "Polish with AI"}
              </button>
            )}

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
                  <LinkIcon size={14} />
                  Copy Link
                </>
              )}
            </button>
          </div>

          {!isAuthenticated && (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 border border-primary/20 transition-all duration-150 active:scale-95"
            >
              <LogIn size={14} />
              Sign in to interact
            </Link>
          )}

          {isOwner && (
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
                    onClick={() => {
                      unpublish(publication.id);
                      onBack();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-150"
                  >
                    <Trash2 size={14} />
                    Unpublish (set to draft)
                  </button>
                  <button
                    onClick={() => {
                      deletePublication(publication.id);
                      onBack();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-all duration-150"
                  >
                    <Trash2 size={14} />
                    Delete permanently
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

/* ─── ArticleView page (standalone detail at /publications/:id) ─── */
export default function ArticleView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const publications = usePublicationStore((s) => s.publications);
  const fetchPublicationById = usePublicationStore((s) => s.fetchPublicationById);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [notFound, setNotFound] = useState(false);

  const publication = publications.find((p) => p.id === id);

  useEffect(() => {
    if (!publication && id) {
      // Try fetching from the server before showing 404
      fetchPublicationById(id).then((result) => {
        if (!result) {
          setTimeout(() => setNotFound(true), 1000);
        }
      });
    }
  }, [publication, id, fetchPublicationById]);

  const handleBack = () => navigate("/publications");
  const isOwner = user ? publication?.user_id === user.id : false;

  if (publication) {
    return <ArticleDetail publication={publication} onBack={handleBack} isOwner={isOwner} isAuthenticated={isAuthenticated} />;
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface border border-border flex items-center justify-center">
          <Trash2 size={28} className="text-muted" />
        </div>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
          Article not found
        </h2>
        <p className="text-sm text-muted max-w-xs mx-auto mb-6">
          This publication may have been removed or the link is incorrect.
        </p>
        <Link
          to="/publications"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-150 active:scale-95"
        >
          <ArrowLeft size={16} />
          Back to publications
        </Link>
      </div>
    );
  }

  return null;
}