import { Heart, MessageCircle, Clock, Tag, Eye, Check, Link as LinkIcon, User } from "lucide-react";
import { useState } from "react";
import type { Publication } from "../types/publication";
import { usePublicationStore } from "../store/usePublicationStore";
import CommentSection from "./CommentSection";

/* ─── Tag colour mapping (same as ThoughtCard) ─── */

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

/* ─── Props ─── */

interface PublicationCardProps {
  publication: Publication;
}

export default function PublicationCard({ publication }: PublicationCardProps) {
  const selectPublication = usePublicationStore((s) => s.selectPublication);
  const toggleLike = usePublicationStore((s) => s.toggleLike);
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    selectPublication(publication.id);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(publication.id);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/publications/${publication.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      onClick={handleClick}
      className="group relative rounded-xl border border-border bg-surface hover:border-border/80 hover:bg-surface-hover transition-all duration-200 cursor-pointer active:scale-[0.99]"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-heading font-semibold text-foreground leading-tight group-hover:text-primary transition-colors duration-150">
            {publication.title}
          </h3>
          <button
            onClick={handleLike}
            className={`p-1.5 rounded-md transition-all duration-150 active:scale-90 shrink-0 ${
              publication.liked_by_user
                ? "text-rose-400 bg-rose-500/10"
                : "text-muted hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100"
            }`}
            aria-label={publication.liked_by_user ? "Unlike" : "Like"}
          >
            <Heart size={16} fill={publication.liked_by_user ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Author row */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <User size={12} className="text-muted" />
          <span className="text-xs font-medium text-foreground/80">
            {publication.author_name || "You"}
          </span>
        </div>

        {/* Excerpt */}
        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2 mb-3">
          {publication.excerpt}
        </p>

        {/* Category badge */}
        {publication.category && (
          <div className="mb-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary">
              {publication.category}
            </span>
          </div>
        )}

        {/* Tags */}
        {publication.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
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

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{timeAgo(publication.published_at || publication.created_at)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Heart size={12} />
              {publication.likes_count}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={12} />
              {publication.comments_count}
            </span>
            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 text-muted hover:text-primary transition-colors duration-150 active:scale-90"
              aria-label="Copy share link"
            >
              {copied ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <LinkIcon size={12} />
              )}
            </button>
            <span className="inline-flex items-center gap-1 text-primary/60 group-hover:text-primary transition-colors duration-150">
              <Eye size={12} />
              Read
            </span>
          </div>
        </div>
      </div>

      {/* Inline comment section — stop click propagation to avoid opening detail view */}
      <div onClick={(e) => e.stopPropagation()} className="px-5 pb-3">
        <CommentSection
          publicationId={publication.id}
          comments={publication.comments}
          commentsCount={publication.comments_count}
        />
      </div>
    </article>
  );
}