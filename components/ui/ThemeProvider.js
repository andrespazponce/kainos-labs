'use client';
// components/ui/ThemeProvider.js
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = [
  { id: 'default', label: 'KAINOS', dotColor: '#00AEEF' },
  { id: 'mono', label: 'Mono', dotColor: '#f4f4f4' },
  { id: 'razer', label: 'Razer', dotColor: '#44d62c' },
];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('kainos-theme');
    if (saved && THEMES.some((t) => t.id === saved)) {
      setThemeState(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    window.localStorage.setItem('kainos-theme', theme);
  }, [theme, mounted]);

  const setTheme = (id) => setThemeState(id);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
