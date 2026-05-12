import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
const THEME_CHANGE_EVENT = "pinch-theme-change";

const getSystemDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const getStoredDark = () => {
  if (typeof window === "undefined") return true;

  const themeMode = localStorage.getItem("theme-mode") as ThemeMode | null;
  if (themeMode === "dark") return true;
  if (themeMode === "light") return false;
  if (themeMode === "system") return getSystemDark();

  const stored = localStorage.getItem("theme");
  if (stored) return stored === "dark";
  return getSystemDark();
};

const ThemeToggle = () => {
  const [dark, setDark] = useState(getStoredDark);

  useEffect(() => {
    const syncStoredTheme = () => setDark(getStoredDark());
    window.addEventListener("storage", syncStoredTheme);
    window.addEventListener(THEME_CHANGE_EVENT, syncStoredTheme);
    return () => {
      window.removeEventListener("storage", syncStoredTheme);
      window.removeEventListener(THEME_CHANGE_EVENT, syncStoredTheme);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleToggle = () => {
    setDark((current) => {
      const next = !current;
      localStorage.setItem("theme", next ? "dark" : "light");
      localStorage.setItem("theme-mode", next ? "dark" : "light");
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
      return next;
    });
  };

  return (
    <button
      onClick={handleToggle}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/65 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;
