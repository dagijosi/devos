import type { Theme } from "./types";

export const lightTheme: Theme = {
  id: "light",
  name: "Light",
  type: "solid",
  mode: "light",
  colors: {
    background: "#F6F8FB",
    text: "#182234",
    textSecondary: "#475569",
    muted: "#64748B",
    icon: "#2F6FEB",
    accent: "#2F6FEB",
    border: "#D7DFEA",
    surface: "#FFFFFF",
    dropdown: "#FFFFFF",
    hover: "#EEF3F9",
    success: "#16A34A",
    warning: "#D97706",
    error: "#DC2626",
    info: "#0284C7",
    secondary: "#C99014",
  },
};

export const darkTheme: Theme = {
  id: "dark",
  name: "Dark",
  type: "solid",
  mode: "dark",
  colors: {
    background: "#06080D",
    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    muted: "#94A3B8",
    icon: "#4F8EF7",
    accent: "#4F8EF7",
    border: "#24334F",
    surface: "#0C111C",
    dropdown: "#131B2C",
    hover: "#1C2740",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#38BDF8",
    secondary: "#F4B942",
  },
};

export const themes = [lightTheme, darkTheme];

export const defaultTheme = lightTheme;
export const defaultDarkTheme = darkTheme;
