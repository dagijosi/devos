import type { Theme } from "./types";

export const lightTheme: Theme = {
  id: "light",
  name: "Light",
  type: "solid",
  mode: "light",
  colors: {
    background: "#f8fafc",
    text: "#0f172a",
    muted: "#64748b",
    icon: "#3b82f6",
    accent: "#2563eb",
    border: "#e2e8f0",
    surface: "#ffffff",
    dropdown: "#f1f5f9",
  },
};

export const darkTheme: Theme = {
  id: "dark",
  name: "Dark",
  type: "solid",
  mode: "dark",
  colors: {
    background: "#0f172a",
    text: "#e2e8f0",
    muted: "#94a3b8",
    icon: "#60a5fa",
    accent: "#3b82f6",
    border: "#1e293b",
    surface: "#1e293b",
    dropdown: "#262b3c",
  },
};

export const themes = [lightTheme, darkTheme];

export const defaultTheme = lightTheme;
export const defaultDarkTheme = darkTheme;
