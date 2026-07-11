import { useState, useRef, useEffect, useCallback } from "react";
import {
  Edit3,
  X,
  Check,
  Plus,
  Tag,
  Clock,
  Brain,
  Sparkles,
  Send,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  MessageSquareQuote,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import type { Thought } from "../types/thought";
import { useJournalStore } from "../store/useJournalStore";
import { usePublicationStore } from "../store/usePublicationStore";

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

const defaultTagColor = "bg-surface-hover text-muted";

function getTagStyle(tag: string): string {
  return tagColors[tag.toLowerCase()] || defaultTagColor;
}

/* ─── Tag input sub-component ─── */

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(() => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }, [input, tags, onChange]);

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag));
    },
    [tags, onChange],
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-150 ${getTagStyle(tag)}`}
        >
          <Tag size={10} />
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="hover:opacity-70 transition-opacity"
            aria-label={`Remove tag "${tag}"`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
            if (e.key === "Backspace" && !input && tags.length > 0) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          placeholder="Add tag..."
          className="w-20 bg-transparent text-xs text-muted placeholder:text-muted/40 outline-none border-none p-0"
        />
        {input.trim() && (
          <button
            onClick={addTag}
            className="text-primary hover:text-primary-hover transition-colors"
            aria-label="Add tag"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
    </div>
  );
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

/* ─── Analysis section ─── */

function AnalysisSection({ thought }: { thought: Thought }) {
  const [expanded, setExpanded] = useState(true);
  const analysis = thought.analysis;
  if (!analysis) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/60">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
          <Sparkles size={14} className="text-emerald-400" />
        </div>
        <span className="text-sm font-heading font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
          AI Analysis
        </span>
        {expanded ? (
          <ChevronUp size={14} className="text-muted ml-auto" />
        ) : (
          <ChevronDown size={14} className="text-muted ml-auto" />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Summary */}
          <div className="flex gap-2.5">
            <MessageSquareQuote size={14} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Click moment — a small story or reframe tailored to the thought's flaw */}
          {analysis.clickMoment && (
            <div className="p-3 rounded-lg bg-surface-hover border border-primary/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
              <div className="flex gap-2.5 relative z-10">
                <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-xs leading-none">💡</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">A thought to sit with</p>
                  <p className="text-sm text-foreground/75 leading-relaxed italic">{analysis.clickMoment}</p>
                </div>
              </div>
            </div>
          )}

          {/* Publish eligibility indicator */}
          {analysis.publishEligibility !== null && (
            <div className="flex gap-2.5">
              {analysis.publishEligibility === "high" ? (
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : analysis.publishEligibility === "medium" ? (
                <Lightbulb size={14} className="text-primary shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-foreground/80">
                {analysis.publishEligibility === "high"
                  ? "This thought has real depth — it reads well and could resonate with others."
                  : analysis.publishEligibility === "medium"
                    ? "This reflection has good bones but could use more detail before it shines. Try expanding on what you felt and why — that personal lens is what makes it worth sharing."
                    : "This entry is too brief or surface-level to publish as-is. Add your personal experience, context, or what led you here to give it substance."}
              </p>
            </div>
          )}

          {/* Misleading */}
          {analysis.isMisleading && analysis.misleadingReason && (
            <div className="flex gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-0.5">Careful — possible distortion</p>
                <p className="text-sm text-foreground/70">{analysis.misleadingReason}</p>
              </div>
            </div>
          )}

          {/* Improvements */}
          {analysis.improvements.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Lightbulb size={12} /> Improvements
              </p>
              <ul className="space-y-1">
                {analysis.improvements.map((imp, i) => (
                  <li key={i} className="text-sm text-foreground/70 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary">
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hidden questions */}
          {analysis.hiddenQuestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <MessageSquareQuote size={12} /> Hidden questions uncovered
              </p>
              {analysis.hiddenQuestions.map((hq, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-surface-hover border border-border/40"
                >
                  <p className="text-sm font-medium text-foreground mb-1">{hq.question}</p>
                  <p className="text-sm text-foreground/60">{hq.answer}</p>
                </div>
              ))}
            </div>
          )}

          {/* Suggested reading with reasons */}
          {analysis.bookSuggestions && analysis.bookSuggestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <BookOpen size={12} /> Suggested reading
              </p>
              <ul className="space-y-2">
                {analysis.bookSuggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm text-foreground/70 pl-4 relative before:content-['📖'] before:absolute before:left-0 before:text-xs">
                    <span className="font-medium text-foreground/80">{suggestion.book}</span>
                    <br />
                    <span className="text-xs text-muted">{suggestion.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Known unknowns — what the analysis identified as missing context */}
          {analysis.knownUnknowns.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted flex items-center gap-1.5">
                <MessageSquareQuote size={12} /> Known unknowns
              </p>
              <ul className="space-y-1">
                {analysis.knownUnknowns.map((unk, i) => (
                  <li key={i} className="text-sm text-muted pl-4 relative before:content-['?'] before:absolute before:left-0 before:text-xs before:font-bold before:text-primary/60">
                    {unk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Lightbulb size={12} /> Suggestions
              </p>
              <ul className="space-y-1">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-foreground/70 pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-primary">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main ThoughtCard component ─── */

interface ThoughtCardProps {
  thought: Thought;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (partial: Partial<Thought>) => void;
}

export default function ThoughtCard({
  thought,
  isEditing,
  onEdit,
  onCancel,
  onSave,
}: ThoughtCardProps) {
  const [title, setTitle] = useState(thought.title);
  const [content, setContent] = useState(thought.content);
  const [tags, setTags] = useState(thought.tags);

  const knockingThoughtId = useJournalStore((s) => s.knockingThoughtId);
  const knockThought = useJournalStore((s) => s.knockThought);
  const updateThought = useJournalStore((s) => s.updateThought);
  const publishFromThought = usePublicationStore((s) => s.publishFromThought);

  const isKnocking = knockingThoughtId === thought.id;

  // Sync state when switching thoughts
  useEffect(() => {
    setTitle(thought.title);
    setContent(thought.content);
    setTags(thought.tags);
  }, [thought]);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) return;
    onSave({ title: trimmedTitle, content: trimmedContent, tags });
    onCancel();
  };

  const handleCancel = () => {
    setTitle(thought.title);
    setContent(thought.content);
    setTags(thought.tags);
    onCancel();
  };

  const handleKnockAI = () => {
    knockThought(thought.id);
  };

  const handlePublish = () => {
    // Create a publication from this thought, then mark it as published
    const pub = publishFromThought(thought);
    if (pub) {
      updateThought(thought.id, { is_published: true });
    }
  };

  // Determine button state
  const aiReady = thought.status === "ready" && thought.analysis !== null;
  const aiPending = thought.status === "pending";

  return (
    <div
      className={`
        group relative rounded-xl border transition-all duration-200
        ${
          isEditing
            ? "border-primary/40 bg-surface shadow-md shadow-primary/5 scale-[1.01]"
            : "border-border bg-surface hover:border-border/80 hover:bg-surface-hover"
        }
      `}
    >
      <div className="p-5">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-transparent text-lg font-heading font-semibold text-foreground outline-none border-b border-primary/30 pb-1 focus:border-primary transition-colors duration-150"
              placeholder="Thought title..."
              autoFocus
            />
          ) : (
            <h3 className="text-lg font-heading font-semibold text-foreground leading-tight">
              {thought.title}
            </h3>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || !content.trim()}
                  className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-all duration-150 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Save changes"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150 active:scale-90"
                  aria-label="Cancel editing"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={onEdit}
                className="p-1.5 rounded-md text-muted opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10 transition-all duration-200 active:scale-90"
                aria-label="Edit thought"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full bg-transparent text-sm text-foreground/90 leading-relaxed outline-none resize-none border border-border/50 rounded-lg p-3 focus:border-primary/40 transition-colors duration-150"
            placeholder="Write your thoughts..."
          />
        ) : (
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line line-clamp-4">
            {thought.content}
          </p>
        )}

        {/* ── Tags ── */}
        <div className="mt-3">
          {isEditing ? (
            <TagInput tags={tags} onChange={setTags} />
          ) : thought.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {thought.tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTagStyle(tag)}`}
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* ── Footer row ── */}
        <div className="flex items-center justify-between mt-4">
          {/* Timestamp */}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock size={12} />
            <span>{timeAgo(isEditing ? thought.updated_at : thought.updated_at)}</span>
            {thought.updated_at !== thought.created_at && (
              <span className="text-muted/50">· edited</span>
            )}
          </div>

          {/* Action buttons row */}
          <div className="flex items-center gap-2">
            {/* Published badge */}
            {thought.is_published && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
                <Globe size={10} />
                Published
              </span>
            )}

            {/* Publish button (only for high eligibility) */}
            {aiReady && !thought.is_published && thought.analysis?.publishEligibility === "high" && (
              <button
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/15 text-primary hover:bg-primary/25 transition-all duration-150 active:scale-95"
              >
                <Send size={12} />
                Review to Publish
              </button>
            )}

            {/* Publish eligibility: Low — too brief or shallow */}
            {aiReady && !thought.is_published && thought.analysis?.publishEligibility === "low" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Still forming
              </span>
            )}

            {/* Publish eligibility: Medium — some substance, needs more */}
            {aiReady && !thought.is_published && thought.analysis?.publishEligibility === "medium" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/15 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Gathering light
              </span>
            )}

            {/* Knock AI button */}
            {aiPending && !isKnocking && (
              <button
                onClick={handleKnockAI}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-150 active:scale-95"
              >
                <Brain size={12} />
                Knock AI
              </button>
            )}

            {/* Knocking in progress */}
            {isKnocking && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary/70">
                <Loader2 size={12} className="animate-spin" />
                Analysing...
              </span>
            )}

            {/* Analysed badge */}
            {aiReady && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 size={10} />
                Analysed
              </span>
            )}
          </div>
        </div>

        {/* ── AI Analysis section (attached when ready) ── */}
        {aiReady && <AnalysisSection thought={thought} />}
      </div>
    </div>
  );
}