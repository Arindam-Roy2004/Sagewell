import { TbSunFilled, TbMoonFilled } from "react-icons/tb";
import { useThemeStore } from "../stores/themeStore";
import { cn } from "@/lib/utils";

/** Sun/moon toggle with a 300ms rotate + scale cross-fade (RoastForge navbar style). */
export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer",
        className
      )}
    >
      <TbSunFilled
        className={cn(
          "absolute size-[18px] transition-all duration-300",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        )}
      />
      <TbMoonFilled
        className={cn(
          "absolute size-[18px] transition-all duration-300",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
      />
    </button>
  );
}
