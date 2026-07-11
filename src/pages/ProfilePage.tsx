import { useNavigate } from "react-router-dom";
import { User, PenLine, FolderOpen, Newspaper, Target, TrendingUp, Timer, Award, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useJournalStore } from "../store/useJournalStore";
import { useGoalStore } from "../store/useGoalStore";
import { usePublicationStore } from "../store/usePublicationStore";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const thoughts = useJournalStore((s) => s.thoughts);
  const goals = useGoalStore((s) => s.goals);
  const publications = usePublicationStore((s) => s.publications);

  const totalThoughts = thoughts.length;
  const analysedThoughts = thoughts.filter((t) => t.status === "ready").length;
  const activeGoals = goals.filter((g) => g.status === "active").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const totalPublications = publications.filter((p) => p.status === "published").length;
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;

  /* XP to next level — simple formula */
  const xpForCurrentLevel = (level - 1) * 150;
  const xpForNextLevel = level * 150;
  const xpProgress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
  const xpToNextLevel = xpForNextLevel - xp;

  /* Build a combined activity feed sorted by time */
  const activityItems: {
    id: string;
    type: "thought" | "goal" | "publication";
    title: string;
    subtitle: string;
    timestamp: string;
    icon: React.ReactNode;
  }[] = [];

  thoughts.slice(0, 10).forEach((t) => {
    activityItems.push({
      id: `thought-${t.id}`,
      type: "thought",
      title: t.title,
      subtitle: t.status === "ready" ? "Analysed by AI" : "Saved as thought",
      timestamp: t.created_at,
      icon: <PenLine size={14} className="text-primary" />,
    });
  });

  goals.slice(0, 10).forEach((g) => {
    activityItems.push({
      id: `goal-${g.id}`,
      type: "goal",
      title: g.title,
      subtitle: g.status === "completed" ? "Goal completed!" : `${g.progress}% complete`,
      timestamp: g.updated_at,
      icon: <Target size={14} className="text-accent" />,
    });
  });

  publications.slice(0, 10).forEach((p) => {
    if (p.published_at) {
      activityItems.push({
        id: `pub-${p.id}`,
        type: "publication",
        title: p.title,
        subtitle: `${p.likes_count} likes · ${p.comments_count} comments`,
        timestamp: p.published_at,
        icon: <Newspaper size={14} className="text-secondary" />,
      });
    }
  });

  activityItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const displayActivity = activityItems.slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent/60 flex items-center justify-center shadow-lg shadow-primary/10">
            <User size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Profile
            </h1>
            <p className="text-sm text-muted">
              Your growth, your story.
            </p>
          </div>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-border via-border to-transparent" />
      </div>

      {profile ? (
        <div className="space-y-6">
          {/* Profile card */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl">{profile.avatar_emoji}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-heading font-bold text-foreground truncate">
                  {profile.nickname}
                </h2>
                <p className="text-sm text-muted truncate">{profile.email}</p>
              </div>
            </div>

            {/* Level & XP progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Level {level}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  {xp} / {xpForNextLevel} XP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-bg/50 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(xpProgress, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted mt-1">
                {xpToNextLevel > 0
                  ? `${xpToNextLevel} XP to next level`
                  : "Maximum level reached!"}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-4">
                <p className="text-xs text-muted mb-1">Bio</p>
                <p className="text-sm text-foreground/80">{profile.bio}</p>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <Timer size={12} className="text-muted" />
              <p className="text-xs text-muted">
                Joined {new Date(profile.joined_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Activity Stats */}
          <div>
            <h2 className="text-sm font-heading font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              Your Vault Stats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatItem
                icon={PenLine}
                label="Thoughts"
                value={totalThoughts}
                sub={`${analysedThoughts} analysed`}
                color="text-primary"
                bgColor="bg-primary/10"
              />
              <StatItem
                icon={Target}
                label="Active Goals"
                value={activeGoals}
                sub={`${completedGoals} completed`}
                color="text-accent"
                bgColor="bg-accent/10"
              />
              <StatItem
                icon={Newspaper}
                label="Publications"
                value={totalPublications}
                color="text-secondary"
                bgColor="bg-secondary/10"
              />
              <StatItem
                icon={TrendingUp}
                label="XP Earned"
                value={xp}
                color="text-primary"
                bgColor="bg-primary/10"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-heading font-semibold text-muted uppercase tracking-wider">
                Recent Activity
              </h2>
            </div>
            {displayActivity.length > 0 ? (
              <div className="space-y-1">
                {displayActivity.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.type === "thought") navigate("/journal");
                      else if (item.type === "goal") navigate("/goals");
                      else navigate("/publications");
                    }}
                    className="w-full flex items-center gap-3 rounded-lg border border-border/50 bg-surface/50 px-4 py-3 hover:bg-surface-hover transition-all duration-200 active:scale-[0.98] cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-bg/50 border border-border/50 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors duration-200">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-200">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted">{item.subtitle}</p>
                    </div>
                    <span className="text-[10px] text-muted/60 shrink-0">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-6 text-center">
                <Sparkles size={24} className="mx-auto text-muted/40 mb-2" />
                <p className="text-sm text-muted">No activity yet</p>
                <p className="text-xs text-muted/60 mt-1">
                  Start writing thoughts or setting goals to see your journey here
                </p>
              </div>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut()}
            className="w-full py-2.5 rounded-lg border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted">Loading profile...</p>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function StatItem({
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
      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center mb-2`}>
        <Icon size={16} className={color} />
      </div>
      <p className="text-xl font-heading font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
      {sub && <p className="text-[10px] text-muted/60 mt-0.5">{sub}</p>}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}