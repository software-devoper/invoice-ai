import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

const ThemeToggle = ({ compact = false }: { compact?: boolean }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
        isLight
          ? "border-black bg-white text-black hover:bg-slate-100"
          : "border-white bg-black text-white hover:bg-slate-900",
        compact ? "h-10 w-10 p-0" : ""
      )}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {!compact && <span>{isLight ? "Dark" : "Light"}</span>}
    </button>
  );
};

export default ThemeToggle;

