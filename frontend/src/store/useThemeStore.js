import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("gatherly-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("gatherly-theme", theme);
    set({ theme });
  },
}));
