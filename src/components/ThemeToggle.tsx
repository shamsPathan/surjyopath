import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-200 active:scale-[0.98]"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      <span className="relative flex items-center justify-center w-[18px] h-[18px]">
        <Sun
          size={18}
          className={`absolute transition-all duration-300 ${
            theme === "light"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-75"
          }`}
        />
        <Moon
          size={18}
          className={`absolute transition-all duration-300 ${
            theme === "dark"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-75"
          }`}
        />
      </span>
      <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}