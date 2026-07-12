import {
  CheckCircle2, Circle, Trash2, Target, Calendar,
  TrendingUp, Sparkles, Mountain, Sunset, BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Goal, CompassDirection } from "../types/goal";
import { useGoalStore } from "../store/useGoalStore";
import GoalCourseSection from "./GoalCourseSection";

/* ── compass direction icon / label mapping ── */
const COMPASS_META: Record<CompassDirection, { icon: typeof TrendingUp; label: string; colorClass: string }> = {
  growth:    { icon: TrendingUp, label: "Growth",    colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  creation:  { icon: Sparkles,   label: "Creation",  colorClass: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  grounding: { icon: Mountain,   label: "Grounding", colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  release:   { icon: Sunset,     label: "Release",   colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

interface GoalCardProps {
  goal: Goal;
  onToggleStep: (goalId: string, stepIndex: number) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Human-readable "X ago" for recent timestamps */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function GoalCard({ goal, onToggleStep, onDelete }: GoalCardProps) {
  const navigate = useNavigate();
  const isComplete = goal.progress === 100;

  const handleViewDetail = () => {
    navigate(`/goals/${goal.id}`);
  };

  return (
    <div className="rounded-xl bg-surface border border-border p-5 shadow-sm transition-all duration-150 hover:border-primary/20">
      {/* Header row — clickable to view details */}
        <div
          className="flex items-start justify-between gap-3 mb-4 cursor-pointer"
          onClick={handleViewDetail}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleViewDetail(); }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-300 ${
                isComplete
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20"
                  : "bg-gradient-to-br from-primary to-accent/60 shadow-primary/10"
              }`}
            >
              <Target size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-heading font-semibold text-foreground truncate">
                {goal.title}
              </h3>
              {goal.description && (
                <p className="text-sm text-muted mt-0.5 line-clamp-2 leading-relaxed">
                  {goal.description}
                </p>
              )}
            </div>
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(goal.id);
            }}
            className="shrink-0 p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-surface-active transition-all duration-150 active:scale-90"
            aria-label="Delete goal"
          >
            <Trash2 size={15} />
          </button>
        </div>

      {/* Compass direction badge */}
      {goal.direction && COMPASS_META[goal.direction] && (
        (() => {
          const meta = COMPASS_META[goal.direction];
          const DirIcon = meta.icon;
          return (
            <div className="mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${meta.colorClass} transition-all duration-300`}
              >
                <DirIcon size={13} />
                {meta.label}
              </span>
            </div>
          );
        })()
      )}

      {/* Target date & status badge */}
      <div className="flex items-center gap-3 mb-4">
        {goal.target_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Calendar size={13} />
            <span>{formatDate(goal.target_date)}</span>
          </div>
        )}
        {isComplete && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} />
            Complete
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted">Progress</span>
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {goal.progress}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface-active border border-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isComplete
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : "bg-gradient-to-r from-primary to-accent"
            }`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {/* Last-touched pulse indicator */}
      {goal.last_touched_step_at && (
        <div className="flex items-center gap-2 mb-3 text-[11px] text-muted">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Touched {timeAgo(goal.last_touched_step_at)}
        </div>
      )}

      {/* Steps list */}
      {goal.steps.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted block mb-2">Learning path</span>
          {goal.steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => onToggleStep(goal.id, idx)}
              className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer ${
                step.completed
                  ? "bg-emerald-500/5 border border-emerald-500/10"
                  : "bg-surface-active/50 border border-transparent hover:bg-surface-active"
              }`}
            >
              <span className="mt-0.5 shrink-0 transition-all duration-200">
                {step.completed ? (
                  <CheckCircle2 size={17} className="text-emerald-400" />
                ) : (
                  <Circle size={17} className="text-muted group-hover:text-foreground transition-colors" />
                )}
              </span>
              <div className="min-w-0">
                <span
                  className={`text-sm transition-all duration-200 ${
                    step.completed
                      ? "text-muted line-through"
                      : "text-foreground font-medium"
                  }`}
                >
                  {step.title}
                </span>
                {step.description && (
                  <p
                    className={`text-xs mt-0.5 leading-relaxed ${
                      step.completed ? "text-muted/60" : "text-muted"
                    }`}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* AI Course generation */}
      {goal.aiCourseStatus === "generating" ? (
        <div className="mt-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-primary/5 border border-primary/10">
          <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-xs font-medium text-primary/70">Knock AI is building your learning path…</span>
        </div>
      ) : goal.aiCourseStatus === "failed" ? (
        <div className="mt-4 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
          <p className="text-xs text-rose-400/80 mb-2">
            AI generation didn't complete. Try again or use the manual path below.
          </p>
          <button
            onClick={() => useGoalStore.getState().generateCourse(goal.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all duration-150 active:scale-95 cursor-pointer"
          >
            Retry AI generation
          </button>
        </div>
      ) : !goal.course || goal.course.length === 0 ? (
        <button
          onClick={() => useGoalStore.getState().generateCourse(goal.id)}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium border border-dashed border-primary/20 text-primary/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 active:scale-[0.97] cursor-pointer"
        >
          <BookOpen size={14} />
          Generate AI learning path
        </button>
      ) : goal.course && goal.aiCourseStatus === "ready" ? (
        <GoalCourseSection
          course={goal.course}
          goalId={goal.id}
          onViewDetail={handleViewDetail}
        />
      ) : null}
    </div>
  );
}