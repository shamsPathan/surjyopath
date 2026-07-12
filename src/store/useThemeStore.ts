import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("surjyo-theme") as Theme | null;
  if (stored === "dark" || stored === "light") return stored;
  // Respect system preference as fallback
  if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    localStorage.setItem("surjyo-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("surjyo-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return { theme: next };
    });
  },
}));
