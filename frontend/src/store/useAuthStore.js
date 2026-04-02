import { create } from 'zustand';

// We check localStorage first so the user stays logged in if they refresh the page
const storedUser = JSON.parse(localStorage.getItem('user'));

export const useAuthStore = create((set) => ({
  user: storedUser || null, // Holds the user ID, name, email, and token
  
  // Call this function when login is successful
  setLogin: (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  },

  // Call this function to log out
  setLogout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },
}));