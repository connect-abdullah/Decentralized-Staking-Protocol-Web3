"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme_provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="btn btn-secondary !size-9 !p-0"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
