import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then((val) => {
      if (val === 'true') setIsDark(true);
    });
  }, []);

  const toggleDark = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('darkMode', String(next));
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
};