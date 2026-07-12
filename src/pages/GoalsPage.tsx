import { Target, LogIn, Sparkles, Plus, X, TrendingUp, Sparkles as CreateIcon, Mountain, Sunset } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useGoalStore } from "../store/useGoalStore";
import type { CompassDirection } from "../types/goal";
import GoalCard from "../components/GoalCard";

const COMPASS_OPTIONS: { value: CompassDirection; label: string; description: string; icon: typeof TrendingUp; colorClass: string }[] = [
  { value: "growth",    label: "Growth",    description: "Expand skills, knowledge, or capability",  icon: TrendingUp,  colorClass: "border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10" },
  { value: "creation",  label: "Creation",  description: "Build, make, or bring something new",      icon: CreateIcon,  colorClass: "border-violet-500/20 bg-violet-500/5 text-violet-400 hover:bg-violet-500/10" },
  { value: "grounding", label: "Grounding", description: "Find stability, health, or inner peace",  icon: Mountain,    colorClass: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10" },
  { value: "release",   label: "Release",   description: "Let go, heal, or break a pattern",        icon: Sunset,      colorClass: "border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10" },
];

export default function GoalsPage() {
  const { isAuthenticated } = useAuthStore();
  const { goals, creating, setCreating, addGoal, deleteGoal, toggleStep, initialize } = useGoalStore();
  const navigate = useNavigate();
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(
    () => sessionStorage.getItem("guest_banner_dismissed") === "true",
  );

  /* Form state */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [direction, setDirection] = useState<CompassDirection | "">("");

  useEffect(() => {
    initialize(isAuthenticated);
  }, [isAuthenticated, initialize]);

  const dismissGuestBanner = () => {
    setGuestBannerDismissed(true);
    sessionStorage.setItem("guest_banner_dismissed", "true");
  };

  const handleSignIn = () => {
    sessionStorage.setItem("return_path", window.location.pathname);
    navigate("/auth");
  };

  const handleCreateGoal = () => {
    if (!title.trim()) return;
    addGoal({
      title: title.trim(),
      description: description.trim(),
      target_date: targetDate,
      direction: direction || null,
      user_id: isAuthenticated ? "user" : "guest",
      status: "active",
    });
    setTitle("");
    setDescription("");
    setTargetDate("");
    setDirection("");
    setCreating(false);
  };

  const handleCancelCreate = () => {
    setTitle("");
    setDescription("");
    setTargetDate("");
    setDirection("");
    setCreating(false);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center shadow-lg shadow-primary/10">
            <Target size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Goals
            </h1>
            <p className="text-sm text-muted">
              Set goals and let AI craft a learning path for you.
            </p>
          </div>
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
                Sign in to unlock AI-powered goal planning, save your progress, and
                turn your ambitions into structured learning paths.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={dismissGuestBanner}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150 cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <LogIn size={14} />
              Sign In
            </button>
          </div>
        </div>
      )}

      {/* Create goal form */}
      {creating ? (
        <div className="mb-8 rounded-xl bg-surface border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-heading font-semibold text-foreground">New goal</h2>
            <button
              onClick={handleCancelCreate}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150 cursor-pointer"
              aria-label="Cancel"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="goal-title" className="block text-sm font-medium text-foreground mb-1.5">
                What do you want to achieve?
              </label>
              <input
                id="goal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Learn React in 30 days"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-active border border-border text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="goal-desc" className="block text-sm font-medium text-foreground mb-1.5">
                Why is this important? (optional)
              </label>
              <textarea
                id="goal-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your goal and what success looks like..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-active border border-border text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all duration-200 resize-none"
              />
            </div>

            {/* Target date */}
            <div>
              <label htmlFor="goal-date" className="block text-sm font-medium text-foreground mb-1.5">
                Target date (optional)
              </label>
              <input
                id="goal-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={today}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-active border border-border text-sm text-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
              />
            </div>

            {/* Compass direction */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-foreground/60 tracking-wide uppercase">
                Compass Direction{" "}
                <span className="text-foreground/30 font-normal normal-case">
                  (optional — what arc does this goal travel along?)
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COMPASS_OPTIONS.map(({ value, label, description, icon: Icon, colorClass }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDirection(direction === value ? "" : value)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer ${
                      direction === value
                        ? `${colorClass} border-primary/40 ring-1 ring-primary/20`
                        : "border-border bg-surface-active text-foreground/50 hover:border-border/60 hover:text-foreground/70"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    <span className="text-[10px] text-foreground/30 leading-tight text-center hidden sm:block">
                      {description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCancelCreate}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface-active transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGoal}
                disabled={!title.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20 transition-all duration-150 active:scale-[0.97] cursor-pointer"
              >
                <Target size={15} />
                Generate learning path
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Create button (when form is closed) */
        <button
          onClick={() => setCreating(true)}
          className="mb-8 w-full rounded-xl border-2 border-dashed border-border hover:border-primary/30 bg-surface/30 hover:bg-surface/60 p-5 flex items-center justify-center gap-2.5 text-sm font-medium text-muted hover:text-foreground transition-all duration-200 active:scale-[0.99] cursor-pointer group"
        >
          <Plus size={18} className="transition-transform duration-200 group-hover:rotate-90" />
          Create a new goal
        </button>
      )}

      {/* Goal list or empty state */}
      {goals.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface border border-border flex items-center justify-center">
            <Target size={28} className="text-muted" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-1">
            No goals yet
          </h2>
          <p className="text-sm text-muted max-w-xs mx-auto leading-relaxed">
            Turn your aspirations into a structured journey. Write a goal and let AI
            build a custom learning path for you.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover active:scale-[0.97] transition-all duration-150 cursor-pointer"
          >
            <Target size={16} />
            Create your first goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleStep={toggleStep}
              onDelete={deleteGoal}
            />
          ))}
        </div>
      )}
    </div>
  );
}