import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import {
  API_URL_KEY,
  SESSION_KEY,
  SETTINGS_KEY,
  getDefaultSettings,
  normalizeApiUrl,
  safeParseJson,
  type AdminSettings,
  type Session,
} from './lib/adminCore';
import { useDarkMode } from './layout/useDarkMode';
import AppShell from './layout/AppShell';
import LoginView from './features/auth/LoginView';

function App() {
  const defaultApiUrl = useMemo(() => {
    const configured = import.meta.env.VITE_API_URL;
    return normalizeApiUrl(typeof configured === 'string' ? configured : 'http://localhost:3000');
  }, []);

  const [apiUrl, setApiUrl] = useState(() => {
    const stored = localStorage.getItem(API_URL_KEY);
    return normalizeApiUrl(stored || defaultApiUrl);
  });

  const [session, setSession] = useState<Session | null>(() => {
    const stored = safeParseJson<Session>(localStorage.getItem(SESSION_KEY));
    if (!stored?.accessToken || !stored?.user?.email) return null;
    return stored;
  });

  const [settings, setSettings] = useState<AdminSettings>(() => {
    const stored = safeParseJson<AdminSettings>(localStorage.getItem(SETTINGS_KEY));
    return stored ?? getDefaultSettings();
  });
  const { isDark, toggle } = useDarkMode();

  useEffect(() => {
    localStorage.setItem(API_URL_KEY, apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    if (!session) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/" replace />
          ) : (
            <LoginView
              apiUrl={apiUrl}
              isDark={isDark}
              onToggleTheme={toggle}
              onApiUrlChange={setApiUrl}
              onLoggedIn={setSession}
            />
          )
        }
      />
      <Route
        path="/*"
        element={
          session ? (
            <AppShell
              apiUrl={apiUrl}
              defaultApiUrl={defaultApiUrl}
              onApiUrlChange={setApiUrl}
              session={session}
              settings={settings}
              onSettingsChange={setSettings}
              isDark={isDark}
              onToggleTheme={toggle}
              onSignOut={signOut}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
