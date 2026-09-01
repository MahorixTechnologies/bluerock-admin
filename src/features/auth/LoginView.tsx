import { useState } from 'react';
import {
  apiFetch,
  BrandMark,
  ErrorBanner,
  Icon,
  normalizeApiUrl,
  type LoginResponse,
  type Session,
} from '../../lib/adminCore';

export default function LoginView({
  apiUrl,
  isDark,
  onToggleTheme,
  onApiUrlChange,
  onLoggedIn,
}: {
  apiUrl: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onApiUrlChange: (next: string) => void;
  onLoggedIn: (session: Session) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="login">
      <aside className="loginAside">
        <div className="loginAsideTop">
          <BrandMark size={44} />
          <span className="loginAsideBrand">BlueRock</span>
        </div>
        <div className="loginAsideBody">
          <h2 className="loginAsideTitle">Manage your rentals with confidence.</h2>
          <p className="loginAsideText">
            One console for users, listings, and bookings across the BlueRock platform.
          </p>
          <ul className="loginFeatureList">
            <li>
              <Icon name="users" size={16} /> Approve accounts and moderate access
            </li>
            <li>
              <Icon name="home" size={16} /> Review and publish property listings
            </li>
            <li>
              <Icon name="wallet" size={16} /> Track bookings and revenue in real time
            </li>
          </ul>
        </div>
        <div className="loginAsideFoot">© {new Date().getFullYear()} BlueRock</div>
      </aside>

      <div className="loginMain">
        <div className="loginTopbar">
          <button
            type="button"
            className="iconBtn"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={18} />
          </button>
        </div>

        <div className="loginCard">
          <div className="loginBrandMobile">
            <BrandMark size={40} />
          </div>
          <h1 className="loginTitle">Welcome back</h1>
          <p className="loginSubtitle">Sign in with an admin account to continue.</p>

          <form
            className="loginForm"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setBusy(true);
              try {
                const resolvedApiUrl = normalizeApiUrl(apiUrl);
                if (!resolvedApiUrl) throw new Error('API URL is required');
                onApiUrlChange(resolvedApiUrl);

                const payload = await apiFetch<LoginResponse>(resolvedApiUrl, null, '/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: email.trim(), password }),
                });

                if (payload.user.role !== 'ADMIN') {
                  throw new Error('This account is not an admin');
                }

                onLoggedIn({ accessToken: payload.accessToken, user: payload.user });
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Login failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="fieldGroup">
              <span className="fieldLabel">API URL</span>
              <div className="inputWithIcon">
                <Icon name="server" size={16} className="inputIcon" />
                <input
                  className="textInput"
                  value={apiUrl}
                  onChange={(e) => onApiUrlChange(normalizeApiUrl(e.target.value))}
                  placeholder="http://localhost:3000/api/v1"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            </label>

            <label className="fieldGroup">
              <span className="fieldLabel">Email</span>
              <div className="inputWithIcon">
                <Icon name="mail" size={16} className="inputIcon" />
                <input
                  className="textInput"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bluerock.com"
                  type="email"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="fieldGroup">
              <span className="fieldLabel">Password</span>
              <div className="inputWithIcon">
                <Icon name="lock" size={16} className="inputIcon" />
                <input
                  className="textInput"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                />
              </div>
            </label>

            {error ? <ErrorBanner message={error} /> : null}

            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
