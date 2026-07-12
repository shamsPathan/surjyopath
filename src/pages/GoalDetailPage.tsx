import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Circle, Sparkles, Loader2 } from "lucide-react";
import { useGoalStore } from "../store/useGoalStore";
import { computeAlignment } from "../types/goal";
import { COMPASS_LABELS } from "../types/goal";
import GoalCourseSection from "../components/GoalCourseSection";

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { goals, toggleStep, processGoalWithAI, loading } = useGoalStore();

  const goal = goals.find((g) => g.id === id);

  if (!goal) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted">Goal not found.</p>
        <button
          onClick={() => navigate("/goals")}
          className="mt-4 text-sm text-primary hover:text-primary-hover transition-colors"
        >
          ← Back to goals
        </button>
      </div>
    );
  }

  const alignment = computeAlignment(goal);
  const compass = goal.direction ? COMPASS_LABELS[goal.direction] : null;

  // Derive completed quizzes from steps: step-{mi+1} → module index mi
  const completedQuizzes = new Set<number>();
  if (goal.course) {
    goal.course.forEach((_, mi) => {
      const stepId = `step-${mi + 1}`;
      const step = goal.steps.find((s) => s.id === stepId);
      if (step?.completed) completedQuizzes.add(mi);
    });
  }

  const handleCompleteQuiz = (moduleIndex: number) => {
    const stepId = `step-${moduleIndex + 1}`;
    toggleStep(goal.id, stepId);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/goals")}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to goals
      </button>

      {/* Goal header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{goal.emoji}</span>
            <div>
              <h1 className="text-2xl font-heading font-semibold text-foreground">
                {goal.title}
              </h1>
              {compass && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-muted bg-surface px-2 py-0.5 rounded-full">
                  {compass.label}
                </span>
              )}
            </div>
          </div>

          {/* Alignment badge */}
          <div className="flex flex-col items-center gap-0.5">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                alignment >= 70
                  ? "bg-primary/20 text-primary"
                  : alignment >= 40
                  ? "bg-tag-amber/20 text-tag-amber"
                  : "bg-muted/20 text-muted"
              }`}
            >
              {alignment}
            </div>
            <span className="text-[10px] text-muted uppercase tracking-wider">
              Align
            </span>
          </div>
        </div>

        <p className="text-sm text-muted leading-relaxed">{goal.description}</p>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted">
            <span>Progress</span>
            <span>{goal.progress}%</span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>

        {/* AI course button */}
        {goal.aiCourseStatus !== "ready" && (
          <button
            onClick={() => processGoalWithAI(goal.id)}
            disabled={loading || goal.aiCourseStatus === "generating"}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {goal.aiCourseStatus === "generating" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating course…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate AI Course
              </>
            )}
          </button>
        )}
      </div>

      {/* Steps section — only show non-quiz-tracking steps */}
      {goal.steps.filter((s) => !/^step-\d+$/.test(s.id)).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider">
            Steps
          </h2>
          <div className="space-y-2">
            {goal.steps
              .filter((s) => !/^step-\d+$/.test(s.id))
              .sort((a, b) => a.order - b.order)
              .map((step) => (
                <button
                  key={step.id}
                  onClick={() => toggleStep(goal.id, step.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors text-left group"
                >
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted group-hover:text-foreground transition-colors shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-sm ${
                        step.completed
                          ? "line-through text-muted"
                          : "text-foreground"
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-muted mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* AI Course section */}
      {goal.course && goal.course.length > 0 && (
        <GoalCourseSection
          course={goal.course}
          goalId={goal.id}
          onViewDetail={(id) => navigate(`/goals/${id}`)}
          completedQuizzes={completedQuizzes}
          onCompleteQuiz={handleCompleteQuiz}
        />
      )}
    </div>
  );
}