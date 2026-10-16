import { useState, useEffect, useCallback } from "react";

export type Theme = "dark" | "light" | "system";
export type Accent = "original" | "orange" | "blue" | "violet" | "green" | "rose" | "teal";

const themeKey = "app-theme";
const accentKey = "app-accent";
const signal = "zen-theme-updated";
const themes: Theme[] = ["dark", "light", "system"];
const accents: Accent[] = ["original", "orange", "blue", "violet", "green", "rose", "teal"];

function readTheme(): Theme {
  const value = localStorage.getItem(themeKey);
  return themes.includes(value as Theme) ? value as Theme : "system";
}
function readAccent(): Accent {
  const value = localStorage.getItem(accentKey);
  return accents.includes(value as Accent) ? value as Accent : "original";
}
function apply(theme: Theme, accent: Accent) {
  const root = document.documentElement;
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
  root.dataset.accent = accent;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [accent, setAccentState] = useState<Accent>(readAccent);

  useEffect(() => {
    const sync = () => {
      setThemeState(readTheme());
      setAccentState(readAccent());
    };
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => apply(readTheme(), readAccent());
    window.addEventListener("storage", sync);
    window.addEventListener(signal, sync);
    media.addEventListener("change", onSystemChange);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(signal, sync);
      media.removeEventListener("change", onSystemChange);
    };
  }, []);

  useEffect(() => { apply(theme, accent); }, [theme, accent]);

  const setTheme = useCallback((value: Theme) => {
    localStorage.setItem(themeKey, value);
    setThemeState(value);
    window.dispatchEvent(new Event(signal));
  }, []);
  const setAccent = useCallback((value: Accent) => {
    localStorage.setItem(accentKey, value);
    setAccentState(value);
    window.dispatchEvent(new Event(signal));
  }, []);
  return { theme, setTheme, accent, setAccent };
}
