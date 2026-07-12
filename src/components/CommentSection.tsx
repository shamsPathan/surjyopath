import { type FC, useState, useRef, useEffect } from "react";
import { usePublicationStore } from "../store/usePublicationStore";
import { useAuthStore } from "../store/useAuthStore";
import { MessageSquare, Trash2, Send, UserCircle } from "lucide-react";
import type { Comment } from "../types/publication";

interface CommentSectionProps {
  publicationId: string;
  comments: Comment[];
  commentsCount: number;
}

const CommentSection: FC<CommentSectionProps> = ({ publicationId, comments, commentsCount }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addComment = usePublicationStore((s) => s.addComment);
  const deleteComment = usePublicationStore((s) => s.deleteComment);
  const profile = useAuthStore((s) => s.profile);

  const isOwner = (c: Comment) => {
    const currentUser = profile?.nickname || useAuthStore.getState().user?.email?.split("@")[0];
    return c.author_name === currentUser;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment(publicationId, trimmed);
    setText("");
  };

  return (
    <div className="mt-3 border-t border-border/40 pt-3">
      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer"
        aria-expanded={open}
        aria-controls={`comments-${publicationId}`}
      >
        <MessageSquare size={14} />
        <span>
          {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
        </span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Comments list + form */}
      {open && (
        <div id={`comments-${publicationId}`} className="mt-2 space-y-2.5">
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 italic px-1">
              No comments yet. Be the first to share your thoughts.
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-2 bg-muted/20 rounded-lg px-3 py-2 group"
              >
                <UserCircle size={20} className="text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{c.author_name}</span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {formatTimestamp(c.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/85 mt-0.5 break-words">{c.content}</p>
                </div>
                {isOwner(c) && (
                  <button
                    onClick={() => deleteComment(publicationId, c.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-muted-foreground/40 hover:text-destructive cursor-pointer p-0.5"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))
          )}

          {/* Add comment form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
              maxLength={500}
              className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-3 py-1.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all duration-150"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-1.5 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 active:scale-95 cursor-pointer"
              aria-label="Send comment"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

function formatTimestamp(iso: string): string {
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

export default CommentSection;
