import { useNavigate } from "react-router-dom";
import { PenLine, FolderOpen, Newspaper, Sparkles, ArrowRight, Target, TrendingUp } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useJournalStore } from "../store/useJournalStore";
import { useGoalStore } from "../store/useGoalStore";
import { usePublicationStore } from "../store/usePublicationStore";

export default function HomePage() {
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuthStore();
  const thoughts = useJournalStore((s) => s.thoughts);
  const goals = useGoalStore((s) => s.goals);
  const publications = usePublicationStore((s) => s.publications);

  const totalThoughts = thoughts.length;
  const activeGoals = goals.filter((g) => g.status === "active").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const totalPublications = publications.filter((p) => p.status === "published").length;
  const xp = profile?.xp ?? 0;

  const recentThoughts = [...thoughts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const activeGoalList = goals
    .filter((g) => g.status === "active")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  const greeting = profile?.nickname
    ? `Welcome back, ${profile.nickname}`
    : "Welcome to Vital Vault";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center shadow-lg shadow-primary/10">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              {greeting}
            </h1>
            <p className="text-sm text-muted">
              Your inner sanctuary — thoughts, goals, and growth.
            </p>
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-border via-border to-transparent" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={PenLine}
          label="Thoughts"
          value={totalThoughts}
          color="text-primary"
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={Target}
          label="Active Goals"
          value={activeGoals}
          sub={completedGoals > 0 ? `${completedGoals} completed` : undefined}
          color="text-accent"
          bgColor="bg-accent/10"
        />
        <StatCard
          icon={Newspaper}
          label="Publications"
          value={totalPublications}
          color="text-secondary"
          bgColor="bg-secondary/10"
        />
        <StatCard
          icon={TrendingUp}
          label="XP"
          value={xp}
          color="text-primary"
          bgColor="bg-primary/10"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-sm font-heading font-semibold text-muted uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickActionButton
            icon={PenLine}
            label="Write a Thought"
            description="Capture what's on your mind"
            onClick={() => navigate("/journal")}
            color="text-primary"
          />
          <QuickActionButton
            icon={FolderOpen}
            label="Create a Goal"
            description="Set a new learning path"
            onClick={() => navigate("/goals")}
            color="text-accent"
          />
          <QuickActionButton
            icon={Newspaper}
            label="Browse Publications"
            description="Read published articles"
            onClick={() => navigate("/publications")}
            color="text-secondary"
          />
        </div>
      </div>

      {/* Two-column: Recent thoughts + Active goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent thoughts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-heading font-semibold text-muted uppercase tracking-wider">
              Recent Thoughts
            </h2>
            <button
              onClick={() => navigate("/journal")}
              className="text-xs text-primary hover:text-primary-hover font-medium transition-colors duration-200 flex items-center gap-1 cursor-pointer"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentThoughts.length > 0 ? (
            <div className="space-y-2.5">
              {recentThoughts.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate("/journal")}
                  className="w-full text-left rounded-xl border border-border bg-surface p-4 hover:bg-surface-hover transition-all duration-200 active:scale-[0.98] cursor-pointer group"
                >
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
                    {t.title}
                  </p>
                  <p className="text-xs text-muted mt-1 line-clamp-2">
                    {t.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {t.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-bg/50 border border-border/50 text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                    {t.status === "ready" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary ml-auto">
                        Analysed
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-6 text-center">
              <PenLine size={24} className="mx-auto text-muted/40 mb-2" />
              <p className="text-sm text-muted">No thoughts yet</p>
              <button
                onClick={() => navigate("/journal")}
                className="mt-3 text-xs text-primary hover:text-primary-hover font-medium transition-colors duration-200 cursor-pointer"
              >
                Write your first thought
              </button>
            </div>
          )}
        </section>

        {/* Active goals */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-heading font-semibold text-muted uppercase tracking-wider">
              Active Goals
            </h2>
            <button
              onClick={() => navigate("/goals")}
              className="text-xs text-primary hover:text-primary-hover font-medium transition-colors duration-200 flex items-center gap-1 cursor-pointer"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          {activeGoalList.length > 0 ? (
            <div className="space-y-2.5">
              {activeGoalList.map((g) => (
                <button
                  key={g.id}
                  onClick={() => navigate("/goals")}
                  className="w-full text-left rounded-xl border border-border bg-surface p-4 hover:bg-surface-hover transition-all duration-200 active:scale-[0.98] cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
                      {g.title}
                    </p>
                    <span className="text-xs font-medium text-primary">
                      {g.progress}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-bg/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  {g.target_date && (
                    <p className="text-[10px] text-muted mt-1.5">
                      Target: {new Date(g.target_date).toLocaleDateString()}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-6 text-center">
              <FolderOpen size={24} className="mx-auto text-muted/40 mb-2" />
              <p className="text-sm text-muted">No active goals</p>
              <button
                onClick={() => navigate("/goals")}
                className="mt-3 text-xs text-primary hover:text-primary-hover font-medium transition-colors duration-200 cursor-pointer"
              >
                Create your first goal
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      <div className={`w-9 h-9 rounded-lg ${bgColor} flex items-center justify-center mb-3`}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-accent mt-0.5">{sub}</p>}
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  color,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 hover:bg-surface-hover hover:border-primary/30 transition-all duration-200 active:scale-[0.98] cursor-pointer group w-full text-left"
    >
      <div className={`w-10 h-10 rounded-lg bg-bg/50 border border-border/50 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors duration-200`}>
        <Icon size={20} className={`${color} group-hover:scale-110 transition-transform duration-200`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
          {label}
        </p>
        <p className="text-xs text-muted truncate">{description}</p>
      </div>
    </button>
  );
}