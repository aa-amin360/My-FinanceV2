"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: any) {
  const [theme, setTheme] = useState("dark");
  const [collapsed, setCollapsed] = useState(false); // ✅ Global persisted state

  // Restore Theme Setting
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Restore Sidebar Collapse Setting (Client-Only Mount)
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed") === "true";
    setCollapsed(saved);
  }, []);

  const toggleTheme = () => {
    setTheme((prev: string) => (prev === "dark" ? "light" : "dark"));
  };

  // ✅ Toggle Collapse handler written at root layer to survive page transitions
  const toggleCollapse = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, collapsed, toggleCollapse }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);