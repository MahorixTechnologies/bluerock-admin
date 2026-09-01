import { useEffect, useState } from 'react';
import { THEME_KEY } from '../lib/adminCore';

export function useDarkMode() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  });
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) {
      root.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
    } else {
      root.removeAttribute('data-theme');
      localStorage.removeItem(THEME_KEY);
    }
  }, [theme]);

  const isDark = theme ? theme === 'dark' : systemDark;
  const toggle = () => setTheme(isDark ? 'light' : 'dark');
  return { isDark, toggle };
}
