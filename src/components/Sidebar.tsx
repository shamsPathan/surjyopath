import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  PenLine,
  BookOpen,
  FolderOpen,
  Newspaper,
  Users,
  User,
  Sun,
  Menu,
  X,
  LogOut,
  LogIn,
  Lock,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { path: "/", label: "Galaxy", icon: Sun, protected: false },
  { path: "/home", label: "Dashboard", icon: PenLine, protected: false },
  { path: "/journal", label: "Journal", icon: PenLine, protected: false },
  { path: "/goals", label: "Goals", icon: FolderOpen, protected: true },
  { path: "/library", label: "Library", icon: BookOpen, protected: true },
  { path: "/publications", label: "Publications", icon: Newspaper, protected: true },
  { path: "/friends", label: "Friends", icon: Users, protected: true },
  { path: "/profile", label: "Profile", icon: User, protected: true },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, isAuthenticated, signOut } = useAuthStore();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-surface border border-border text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-200 active:scale-95"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay on mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-surface border-r border-border
          transform transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col
        `}
      >
        <div className="flex flex-col h-full p-6">
          {/* Brand */}
          <div className="mb-8 mt-8 lg:mt-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sun size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-semibold text-foreground">
                  SurjyoPath
                </h1>
                <p className="text-xs text-muted">The Sun's Way</p>
              </div>
            </div>
          </div>

          {/* Profile pill */}
          {profile && (
            <button
              onClick={() => {
                navigate("/profile");
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2 mb-6 rounded-lg bg-bg/50 border border-border/50 hover:bg-surface-hover transition-all duration-200 active:scale-[0.98]"
            >
              <span className="text-lg">{profile.avatar_emoji}</span>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile.nickname}
                </p>
                <p className="text-xs text-muted">
                  Lvl {profile.level} &middot; {profile.xp} XP
                </p>
              </div>
            </button>
          )}

          {/* Nav */}
          <nav className="flex-1 space-y-1.5" role="navigation" aria-label="Main navigation">
            {navItems.map(({ path, label, icon: Icon, protected: isProtected }) => {
              const isActive = location.pathname === path;
              const isLocked = !isAuthenticated && isProtected;
              return (
                <button
                  key={path}
                  onClick={() => {
                    if (isLocked) {
                      sessionStorage.setItem("auth_return_path", path);
                      navigate("/auth");
                    } else {
                      navigate(path);
                    }
                    setMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 active:scale-[0.98]
                    ${
                      isActive
                        ? "bg-primary/15 text-primary shadow-sm"
                        : isLocked
                          ? "text-muted/50 cursor-not-allowed"
                          : "text-muted hover:text-foreground hover:bg-surface-hover"
                    }
                  `}
                  aria-current={isActive ? "page" : undefined}
                  aria-disabled={isLocked}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{label}</span>
                  {isLocked && <Lock size={14} className="text-muted/40" />}
                </button>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <div className="mb-2">
            <ThemeToggle />
          </div>

          {/* Sign out / Sign in */}
          <div className="pt-4 border-t border-border">
            {isAuthenticated ? (
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-[0.98]"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  sessionStorage.setItem("auth_return_path", location.pathname);
                  navigate("/auth");
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-200 active:scale-[0.98]"
              >
                <LogIn size={18} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}