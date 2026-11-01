import { create } from 'zustand';

// index.html applies the saved theme before first paint; this mirrors the same rule.
const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem('sagewell-theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // storage unavailable (private mode); fall through to the default
  }
  return 'dark'; // first visit opens dark
};

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    localStorage.setItem('sagewell-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  // Call once on mount to sync DOM
  initTheme: () => {
    const theme = get().theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },
}));
