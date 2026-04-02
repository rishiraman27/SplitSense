import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  // Check if they previously chose dark mode, otherwise default to true (dark)
  isDarkMode: localStorage.getItem('theme') !== 'light',
  
  toggleTheme: () => set((state) => {
    const newMode = !state.isDarkMode;
    // Save their choice to the browser
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    return { isDarkMode: newMode };
  }),
}));