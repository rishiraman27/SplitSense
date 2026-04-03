import { create } from 'zustand';

export const useCurrencyStore = create((set) => ({
  // Check local storage, default to USD if they haven't chosen yet
  currency: localStorage.getItem('currency') || 'USD',
  symbol: localStorage.getItem('currency') === 'INR' ? '₹' : '$',
  
  toggleCurrency: () => set((state) => {
    const newCurrency = state.currency === 'USD' ? 'INR' : 'USD';
    const newSymbol = newCurrency === 'INR' ? '₹' : '$';
    
    // Save their choice to the browser
    localStorage.setItem('currency', newCurrency);
    
    return { currency: newCurrency, symbol: newSymbol };
  }),
}));