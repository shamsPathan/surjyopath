import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Plus, X, Tag, Loader2, Sparkles, LogIn } from "lucide-react";
import ThoughtCard from "../components/ThoughtCard";
import { useJournalStore } from "../store/useJournalStore";
import { useAuthStore } from "../store/useAuthStore";

export default function JournalPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const {
    thoughts,
    editingThoughtId,
    setEditingThought,
    updateThought,
    cancelEditing,
    addThought,
  } = useJournalStore();

  const [showComposer, setShowComposer] = useState(false);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(
    () => sessionStorage.getItem("guest_banner_dismissed") === "true"
  );
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [composing, setComposing] = useState(false);

  const handleCreate = () => {
    const title = newTitle.trim();
    const content = newContent.trim();
    if (!title || !content) return;

    const tags = newTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    setComposing(true);
    addThought({
      title,
      content,
      tags,
      user_id: "mock-user-1",
      source: "manual",
      status: "pending",
      analysis: null,
      ai_feedback: null,
      goal_id: null,
      is_published: false,
      publication_id: null,
      is_new: true,
      processed_at: null,
    });

    // Reset form
    setNewTitle("");
    setNewContent("");
    setNewTags("");
    setShowComposer(false);
    setComposing(false);
  };

  const dismissGuestBanner = () => {
    setGuestBannerDismissed(true);
    sessionStorage.setItem("guest_banner_dismissed", "true");
  };

  const handleSignIn = () => {
    sessionStorage.setItem("return_path", window.location.pathname);
    navigate("/auth");
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center shadow-lg shadow-primary/10">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">
                Journal
              </h1>
              <p className="text-sm text-muted">Capture your thoughts, watch them grow.</p>
            </div>
          </div>
          {!showComposer && (
            <button
              onClick={() => setShowComposer(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-150 active:scale-95"
            >
              <Plus size={16} />
              New Thought
            </button>
          )}
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-border via-border to-transparent" />
      </div>

      {/* Guest mode banner — visible for unauthenticated users */}
      {!isAuthenticated && !guestBannerDismissed && (
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">You're in guest mode</p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Sign in to save your thoughts to the cloud, unlock AI analysis, and never lose a
                reflection. Your current entries are saved locally for now.
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

      {/* New Thought Composer */}
      {showComposer && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-surface shadow-md shadow-primary/5 p-5 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-heading font-semibold text-foreground">New Thought</h2>
            <button
              onClick={() => setShowComposer(false)}
              className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150"
              aria-label="Close composer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-transparent text-lg font-heading font-semibold text-foreground outline-none border-b border-border/60 pb-1.5 focus:border-primary transition-colors duration-150 placeholder:text-muted/40"
              placeholder="What's on your mind?"
              autoFocus
            />

            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              className="w-full bg-transparent text-sm text-foreground/90 leading-relaxed outline-none resize-none border border-border/50 rounded-lg p-3 focus:border-primary/40 transition-colors duration-150 placeholder:text-muted/40"
              placeholder="Write your thoughts freely..."
            />

            <div className="flex items-center gap-2">
              <Tag size={14} className="text-muted shrink-0" />
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="flex-1 bg-transparent text-xs text-muted outline-none border-none placeholder:text-muted/30"
                placeholder="Tags (comma-separated, e.g. mindfulness, growth)"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowComposer(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || !newContent.trim() || composing}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-hover transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {composing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Plus size={12} />
                )}
                Save Thought
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {thoughts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface border border-border flex items-center justify-center">
            <Brain size={28} className="text-muted" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
            No thoughts yet
          </h2>
          <p className="text-sm text-muted max-w-xs mx-auto">
            Your journal is a quiet space waiting for words. Write your first
            thought — even a sentence counts.
          </p>
          <button
            onClick={() => setShowComposer(true)}
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-150 active:scale-95"
          >
            <Plus size={16} />
            Write your first thought
          </button>
        </div>
      )}

      {/* Thought list */}
      {thoughts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Recent thoughts
              <span className="ml-2 text-xs bg-surface-hover px-2 py-0.5 rounded-full">
                {thoughts.length}
              </span>
            </p>
          </div>

          {thoughts.map((thought) => (
            <ThoughtCard
              key={thought.id}
              thought={thought}
              isEditing={editingThoughtId === thought.id}
              onEdit={() => setEditingThought(thought.id)}
              onCancel={cancelEditing}
              onSave={(partial) => updateThought(thought.id, partial)}
            />
          ))}
        </div>
      )}
    </div>
  );
}