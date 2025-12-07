// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 'auto' | 'light' | 'dark'
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    if (saved) return saved;
    return 'auto'; // Default a auto mode
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Detectar cambios en preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (themeMode === 'auto') {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Aplicar tema a DOM
  useEffect(() => {
    let shouldBeDark = isDarkMode;

    // Si está en auto mode, usar preferencia del sistema
    if (themeMode === 'auto') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(shouldBeDark);
    } else if (themeMode === 'light') {
      shouldBeDark = false;
    } else if (themeMode === 'dark') {
      shouldBeDark = true;
    }

    // Aplicar clase al elemento html
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Guardar en localStorage
    localStorage.setItem('darkMode', shouldBeDark);
    localStorage.setItem('themeMode', themeMode);
  }, [isDarkMode, themeMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    setThemeMode('light'); // Al togglear manual, salir de auto mode
  };

  const setTheme = (mode) => {
    setThemeMode(mode);
    if (mode === 'light') {
      setIsDarkMode(false);
    } else if (mode === 'dark') {
      setIsDarkMode(true);
    } else if (mode === 'auto') {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      toggleDarkMode,
      themeMode,
      setTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
