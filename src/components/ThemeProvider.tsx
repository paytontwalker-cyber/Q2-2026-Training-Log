import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ThemeMode, THEME_PRESETS } from '../theme';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  themeMode: ThemeMode;
  setTheme: (primary: string, secondary: string, mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const saved = localStorage.getItem('traininglog_theme');
  const parsed = saved ? JSON.parse(saved) : null;
  const [primaryColor, setPrimaryColor] = useState(parsed?.primaryColor || THEME_PRESETS[0].primary);
  const [secondaryColor, setSecondaryColor] = useState(parsed?.secondaryColor || THEME_PRESETS[0].secondaryOptions[0].value);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const root = document.documentElement;
    // These are the variables the app's Tailwind classes actually use:
    const preset = THEME_PRESETS.find(p => p.primary === primaryColor);
    const lightVariant = preset?.primaryLight || primaryColor;
    const secondaryLight = secondaryColor; // Fallback to secondaryColor as light variant
    root.style.setProperty('--app-primary', primaryColor);
    root.style.setProperty('--app-primary-light', lightVariant);
    root.style.setProperty('--app-secondary', secondaryColor);
    root.style.setProperty('--app-secondary-light', secondaryLight);

    root.classList.remove('dark');
  }, [primaryColor, secondaryColor, themeMode]);

  const setTheme = useCallback((primary: string, secondary: string, _mode: ThemeMode) => {
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
    setThemeMode('light');
    localStorage.setItem('traininglog_theme', JSON.stringify({ primaryColor: primary, secondaryColor: secondary, themeMode: 'light' }));
  }, []);

  return (
    <ThemeContext.Provider value={{ primaryColor, secondaryColor, themeMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
