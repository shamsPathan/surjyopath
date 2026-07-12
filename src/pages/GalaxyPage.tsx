import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useJournalStore } from "../store/useJournalStore";
import { useGoalStore } from "../store/useGoalStore";
import { usePublicationStore } from "../store/usePublicationStore";
import { useLibraryStore } from "../store/useLibraryStore";
import { useFriendStore } from "../store/useFriendStore";
import { useThemeStore } from "../store/useThemeStore";
import {
  PenLine,
  FolderOpen,
  BookOpen,
  Newspaper,
  Users,
  User,
  Sun,
  ArrowRight,
} from "lucide-react";

/* ─── Celestial Bodies ─── */

interface CelestialBody {
  id: string;
  label: string;
  path: string;
  icon: typeof PenLine;
  color: string;
  emoji: string;
  orbitRadius: number; // percentage of container
  orbitDuration: number; // seconds
  initialAngle: number; // radians
  description: string;
}

const celestialBodies: CelestialBody[] = [
  {
    id: "journal",
    label: "Journal",
    path: "/journal",
    icon: PenLine,
    color: "oklch(0.6 0.15 250)", // tag-blue
    emoji: "✍️",
    orbitRadius: 18,
    orbitDuration: 28,
    initialAngle: 0,
    description: "Raw thoughts & AI analysis",
  },
  {
    id: "goals",
    label: "Goals",
    path: "/goals",
    icon: FolderOpen,
    color: "oklch(0.6 0.15 150)", // tag-green
    emoji: "🎯",
    orbitRadius: 26,
    orbitDuration: 36,
    initialAngle: Math.PI / 3,
    description: "Learning paths & courses",
  },
  {
    id: "library",
    label: "Library",
    path: "/library",
    icon: BookOpen,
    color: "oklch(0.6 0.12 190)", // tag-teal
    emoji: "📚",
    orbitRadius: 34,
    orbitDuration: 44,
    initialAngle: (2 * Math.PI) / 3,
    description: "Curated readings",
  },
  {
    id: "publications",
    label: "Publications",
    path: "/publications",
    icon: Newspaper,
    color: "oklch(0.65 0.15 70)", // tag-amber
    emoji: "📰",
    orbitRadius: 26,
    orbitDuration: 40,
    initialAngle: Math.PI,
    description: "Polished articles",
  },
  {
    id: "friends",
    label: "Friends",
    path: "/friends",
    icon: Users,
    color: "oklch(0.6 0.15 360)", // tag-rose
    emoji: "👥",
    orbitRadius: 20,
    orbitDuration: 32,
    initialAngle: (4 * Math.PI) / 3,
    description: "Connect with learners",
  },
  {
    id: "profile",
    label: "Profile",
    path: "/profile",
    icon: User,
    color: "oklch(0.6 0.15 290)", // tag-violet
    emoji: "🌟",
    orbitRadius: 14,
    orbitDuration: 24,
    initialAngle: (5 * Math.PI) / 3,
    description: "Your growth & stats",
  },
];

/* ─── Stars background (static + twinkling) ─── */

function StarField({ theme }: { theme: string }) {
  const stars = useMemo(() => {
    const arr: { x: number; y: number; size: number; delay: number; duration: number }[] = [];
    for (let i = 0; i < 200; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
      });
    }
    return arr;
  }, []);

  const isLight = theme === "light";

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: isLight
              ? `radial-gradient(circle, oklch(0.85 0.08 70 / 0.6), transparent 70%)`
              : `rgba(255,255,255,0.4)`,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Nebula Clouds ─── */

function NebulaClouds({ theme }: { theme: string }) {
  const isLight = theme === "light";

  if (isLight) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-[0.12]"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, oklch(0.85 0.08 70 / 0.5), transparent 70%)",
            animation: "drift1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-[10%] -right-[10%] w-[55%] h-[55%] rounded-full opacity-[0.10]"
          style={{
            background:
              "radial-gradient(ellipse at 70% 50%, oklch(0.8 0.08 280 / 0.35), transparent 70%)",
            animation: "drift2 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[40%] left-[30%] w-[50%] h-[40%] rounded-full opacity-[0.08]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, oklch(0.88 0.06 50 / 0.4), transparent 70%)",
            animation: "drift3 30s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Cloud 1 — drifting left-right */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, oklch(0.62 0.13 50 / 0.4), transparent 70%)",
          animation: "drift1 20s ease-in-out infinite",
        }}
      />
      {/* Cloud 2 — drifting up-down */}
      <div
        className="absolute -bottom-[10%] -right-[10%] w-[55%] h-[55%] rounded-full opacity-[0.05]"
        style={{
          background:
            "radial-gradient(ellipse at 70% 50%, oklch(0.55 0.15 280 / 0.35), transparent 70%)",
          animation: "drift2 25s ease-in-out infinite",
        }}
      />
      {/* Cloud 3 — slow diagonal */}
      <div
        className="absolute top-[40%] left-[30%] w-[50%] h-[40%] rounded-full opacity-[0.04]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, oklch(0.55 0.10 70 / 0.3), transparent 70%)",
          animation: "drift3 30s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/* ─── Central Sun ─── */

function CentralSun({ theme }: { theme: string }) {
  const isLight = theme === "light";

  const coreColor1 = isLight ? "oklch(0.72 0.14 50 / 0.4)" : "oklch(0.62 0.13 50 / 0.6)";
  const coreColor2 = isLight ? "oklch(0.72 0.14 50 / 0.05)" : "oklch(0.62 0.13 50 / 0.1)";
  const midColor1 = isLight ? "oklch(0.82 0.12 50 / 0.7)" : "oklch(0.7 0.13 50 / 0.8)";
  const midColor2 = isLight ? "oklch(0.72 0.14 50 / 0.3)" : "oklch(0.55 0.13 50 / 0.4)";
  const innerColor1 = isLight ? "oklch(0.92 0.08 50 / 1)" : "oklch(0.85 0.1 50 / 0.9)";
  const innerColor2 = isLight ? "oklch(0.82 0.12 50 / 0.7)" : "oklch(0.62 0.13 50 / 0.6)";
  const sunColor = isLight ? "oklch(0.65 0.14 50)" : "oklch(0.62 0.13 50)";
  const corona = isLight
    ? "oklch(0.72 0.14 50 / 0.35)"
    : "oklch(0.62 0.13 50 / 0.3)";
  const glowColor = isLight ? "oklch(0.72 0.14 50 / 0.15)" : "oklch(0.62 0.13 50 / 0.3)";

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {/* Corona ring — extra prominence in light mode */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: isLight ? 280 : 200,
          height: isLight ? 280 : 200,
          background: `radial-gradient(circle, ${corona}, transparent 70%)`,
          animation: "pulseGlow 5s ease-in-out infinite",
        }}
      />
      {/* Core */}
      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${coreColor1}, ${coreColor2} 60%, transparent 80%)`,
            animation: "pulseGlow 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 120,
            height: 120,
            background: `radial-gradient(circle, ${midColor1}, ${midColor2} 50%, transparent 70%)`,
            animation: "pulseGlow 4s ease-in-out 1s infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 60,
            height: 60,
            background: `radial-gradient(circle, ${innerColor1}, ${innerColor2})`,
            boxShadow: `0 0 80px ${glowColor}`,
          }}
        />
        {/* Sun icon in the center */}
        <Sun
          size={28}
          className={`relative z-10 ${isLight ? "text-amber-950/80" : "text-white/90"}`}
          style={{ filter: `drop-shadow(0 0 16px ${glowColor})` }}
        />
      </div>

      {/* Label */}
      <div className="text-center mt-4 sm:mt-5">
        <h2
          className={`font-heading font-bold text-xl tracking-wide ${
            isLight ? "text-amber-950/80" : "text-white/80"
          }`}
        >
          SurjyoPath
        </h2>
        <p
          className={`text-[11px] mt-0.5 tracking-widest uppercase ${
            isLight ? "text-amber-900/50" : "text-white/40"
          }`}
        >
          The Sun's Way
        </p>
      </div>
    </div>
  );
}

/* ─── Orbit Ring ─── */

function OrbitRing({ radius, theme }: { radius: number; theme: string }) {
  const isLight = theme === "light";
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border pointer-events-none"
      style={{
        width: `${radius * 2}%`,
        height: `${radius * 2}%`,
        paddingTop: `${radius * 2}%`,
        borderColor: isLight ? "oklch(0.5 0.06 70 / 0.15)" : "rgba(255,255,255,0.06)",
      }}
    />
  );
}

/* ─── Planet ─── */

function Planet({
  body,
  index,
  onHover,
  onLeave,
  isHovered,
  stats,
  theme,
}: {
  body: CelestialBody;
  index: number;
  onHover: (id: string) => void;
  onLeave: () => void;
  isHovered: boolean;
  stats: { count: number; label: string }[];
  theme: string;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="absolute left-1/2 top-1/2 pointer-events-auto"
      style={{
        animation: `orbit${index} ${body.orbitDuration}s linear infinite`,
        transformOrigin: "0 0",
      }}
    >
      <button
        onClick={() => navigate(body.path)}
        onMouseEnter={() => onHover(body.id)}
        onMouseLeave={onLeave}
        className="group relative flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer"
        style={{
          width: isHovered ? 110 : 80,
          height: isHovered ? 110 : 80,
          transform: `translate(calc(${body.orbitRadius}vw - 50%), calc(${body.orbitRadius}vw - 50%))`,
          transition: "width 0.3s ease, height 0.3s ease",
        }}
        aria-label={`Navigate to ${body.label}`}
      >
        {/* Orbit trail glow */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            background: isHovered
              ? `radial-gradient(circle, ${body.color} / 0.25, ${body.color} / 0.05)`
              : "transparent",
            transform: isHovered ? "scale(1.4)" : "scale(0.8)",
            transition: "transform 0.3s ease, background 0.3s ease",
          }}
        />

        {/* Planet body */}
        <div
          className="absolute inset-[6px] rounded-full flex items-center justify-center transition-all duration-300 border border-transparent"
          style={{
            background: `linear-gradient(135deg, ${body.color} / 0.5, ${body.color} / 0.15)`,
            borderColor: isHovered ? `${body.color} / 0.5` : "transparent",
            boxShadow: isHovered ? `0 0 30px ${body.color} / 0.2` : "none",
          }}
        >
          <span className="text-2xl transition-transform duration-300 group-hover:scale-110">
            {body.emoji}
          </span>
        </div>

        {/* Label */}
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300"
        >
          <p
            className="font-heading text-xs font-semibold text-center transition-all duration-300"
            style={{
              color: isHovered
                  ? `${body.color}`
                  : theme === "light"
                    ? "oklch(0.35 0.03 270)"
                    : "oklch(0.7 0.02 270)",
              opacity: isHovered ? 1 : 0.5,
              transform: isHovered ? "scale(1.1)" : "scale(1)",
            }}
          >
            {body.label}
          </p>
        </div>

        {/* Tooltip on hover */}
        {isHovered && (
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-50 w-48 px-3 py-2.5 rounded-xl bg-surface/90 backdrop-blur-md border border-border/80 shadow-xl shadow-black/30">
            <p
              className="text-sm font-heading font-semibold"
              style={{ color: body.color }}
            >
              {body.label}
            </p>
            <p className="text-[11px] text-muted mt-0.5">{body.description}</p>
            {stats.length > 0 && (
              <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-border/50">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xs font-semibold text-foreground">
                      {s.count}
                    </p>
                    <p className="text-[9px] text-muted/70 uppercase tracking-wider">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary/70">
              <span>Navigate</span>
              <ArrowRight size={10} />
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

/* ─── Main Component ─── */

export default function GalaxyPage() {
  const navigate = useNavigate();
  const [hoveredBody, setHoveredBody] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const theme = useThemeStore((s) => s.theme);
  const { profile, isAuthenticated } = useAuthStore();
  const thoughts = useJournalStore((s) => s.thoughts);
  const goals = useGoalStore((s) => s.goals);
  const publications = usePublicationStore((s) => s.publications);
  const friendsCount = useFriendStore((s) => s.friends.length);
  const booksCount = useLibraryStore((s) => s.books.length);

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const getStats = (bodyId: string) => {
    const map: Record<string, { count: number; label: string }[]> = {
      journal: [{ count: thoughts.length, label: "Thoughts" }],
      goals: [
        { count: goals.filter((g) => g.status === "active").length, label: "Active" },
        { count: goals.filter((g) => g.status === "completed").length, label: "Done" },
      ],
      library: [{ count: booksCount, label: "Books" }],
      publications: [
        { count: publications.filter((p) => p.status === "published").length, label: "Published" },
      ],
      friends: [{ count: friendsCount, label: "Friends" }],
      profile: [{ count: profile?.level ?? 1, label: "Level" }],
    };
    return map[bodyId] ?? [];
  };

  return (
    <div
      className="relative w-full h-[calc(100vh-4rem)] overflow-hidden"
      style={{
        background:
          theme === "light"
            ? `
          radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.82 0.08 50 / 0.12), transparent),
          radial-gradient(ellipse 60% 80% at 30% 60%, oklch(0.75 0.08 280 / 0.08), transparent),
          radial-gradient(ellipse 50% 50% at 70% 40%, oklch(0.80 0.06 70 / 0.06), transparent),
          oklch(0.96 0.01 80)
        `
            : `
          radial-gradient(ellipse 80% 60% at 50% 50%, oklch(0.62 0.13 50 / 0.04), transparent),
          radial-gradient(ellipse 60% 80% at 30% 60%, oklch(0.55 0.15 280 / 0.03), transparent),
          radial-gradient(ellipse 50% 50% at 70% 40%, oklch(0.55 0.10 70 / 0.02), transparent),
          oklch(0.13 0.025 260)
        `,
      }}
    >
      {/* Star field */}
      <StarField theme={theme} />
      <NebulaClouds theme={theme} />

      {/* Entrance fade */ }
      <div
        className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-1000"
        style={{
          opacity: mounted ? 0 : 1,
          background: theme === "light" ? "oklch(0.96 0.01 80)" : "oklch(0.13 0.025 260)",
        }}
      />

      {/* Content */}
      <div
        className={`relative z-10 w-full h-full flex flex-col items-center justify-center transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Central sun */}
        <CentralSun theme={theme} />

        {/* Orbit rings */}
        {[14, 18, 20, 26, 26, 34].map((r, i) => (
          <OrbitRing key={i} radius={r} theme={theme} />
        ))}

        {/* Planets */}
        {celestialBodies.map((body, i) => (
          <Planet
            key={body.id}
            body={body}
            index={i}
            onHover={setHoveredBody}
            onLeave={() => setHoveredBody(null)}
            isHovered={hoveredBody === body.id}
            stats={getStats(body.id)}
            theme={theme}
          />
        ))}

        {/* Bottom hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          {!isAuthenticated && (
            <button
              onClick={() => navigate("/auth")}
              className="text-xs text-primary/60 hover:text-primary transition-colors duration-200 cursor-pointer"
            >
              Sign in to unlock your full galaxy
            </button>
          )}
          {isAuthenticated && (
            <p
              className="text-[11px] tracking-wider"
              style={{
                color: theme === "light"
                  ? "oklch(0.4 0.02 70 / 0.5)"
                  : "rgba(255,255,255,0.2)",
              }}
            >
              Hover a planet · Click to explore
            </p>
          )}
        </div>
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }

        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }

        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(40px, -20px); }
        }

        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 30px); }
        }

        @keyframes drift3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 40px); }
        }

        ${celestialBodies
          .map(
            (_, i) => `
          @keyframes orbit${i} {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
          )
          .join("\n")}

        @media (prefers-reduced-motion: reduce) {
          @keyframes twinkle { 0%, 100% { opacity: 0.5; } }
          @keyframes pulseGlow { 0%, 100% { opacity: 0.8; } }
          @keyframes drift1 { 0%, 100% { transform: none; } }
          @keyframes drift2 { 0%, 100% { transform: none; } }
          @keyframes drift3 { 0%, 100% { transform: none; } }
          ${celestialBodies
            .map(
              (_, i) => `
            @keyframes orbit${i} { 0%, 100% { transform: rotate(0deg); } }
          `
            )
            .join("\n")}
        }
      `}</style>
    </div>
  );
}