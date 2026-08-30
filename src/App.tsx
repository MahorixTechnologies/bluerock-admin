import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  API_URL_KEY,
  SESSION_KEY,
  THEME_KEY,
  SETTINGS_KEY,
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  demoUsers,
  demoListings,
  demoBookings,
  demoReviews,
  cloneData,
  isDemoCredentials,
  isDemoSession,
  createDemoSession,
  getDemoStats,
  getDemoUserDetail,
  getDemoListingDetail,
  getDemoBookingDetail,
  getDefaultSettings,
  normalizeApiUrl,
  apiFetch,
  safeParseJson,
  formatMoney,
  formatDate,
  initialsFor,
  Icon,
  BrandMark,
  Badge,
  userStatusTone,
  listingStatusTone,
  bookingStatusTone,
  paymentTone,
  reviewStatusTone,
  ErrorBanner,
  SearchField,
  EmptyRow,
  useAdminResource,
  usePagedItems,
  Pagination,
  type IconName,
  type UserStatus,
  type AdminUser,
  type AdminUserDetail,
  type AdminListing,
  type AdminBooking,
  type AdminSettings,
  type AdminStats,
  type LoginResponse,
  type Session,
  type AdminReview,
} from './lib/adminCore';
import OwnerApplicationsView from './components/OwnerApplicationsView';
import AuditLogView from './components/AuditLogView';
import ReportsQueueView from './components/ReportsQueueView';
import DisputesQueueView from './components/DisputesQueueView';
import FeeRulesPanel from './components/FeeRulesPanel';
import AnalyticsTrendsChart from './components/AnalyticsTrendsChart';

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */

function useDarkMode() {
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

/* -------------------------------------------------------------------------- */
/* App shell                                                                  */
/* -------------------------------------------------------------------------- */

type View =
  | 'dashboard'
  | 'users'
  | 'user_details'
  | 'listings'
  | 'listing_details'
  | 'bookings'
  | 'booking_details'
  | 'owner_applications'
  | 'audit_logs'
  | 'moderation_reports'
  | 'disputes'
  | 'incomes'
  | 'reports'
  | 'settings';

const NAV_ITEMS: { key: View; label: string; icon: IconName }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'listings', label: 'Listings', icon: 'home' },
  { key: 'bookings', label: 'Bookings', icon: 'calendar' },
  { key: 'owner_applications', label: 'Owner Applications', icon: 'flag' },
  { key: 'moderation_reports', label: 'Reports Queue', icon: 'shield' },
  { key: 'disputes', label: 'Disputes', icon: 'activity' },
  { key: 'audit_logs', label: 'Audit Log', icon: 'clipboard' },
  { key: 'incomes', label: 'Incomes', icon: 'wallet' },
  { key: 'reports', label: 'Reports', icon: 'chart' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const PAGE_META: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of platform activity and health' },
  users: { title: 'Users', subtitle: 'Manage accounts across renters, landlords, and admins' },
  user_details: { title: 'User Details', subtitle: 'Profile, activity, and access overview' },
  listings: { title: 'Listings', subtitle: 'Moderate and approve properties on the platform' },
  listing_details: { title: 'Listing Details', subtitle: 'Review property information and moderation status' },
  bookings: { title: 'Bookings', subtitle: 'Track reservations and their payment status' },
  booking_details: { title: 'Booking Details', subtitle: 'Inspect reservation value, stay dates, and payment state' },
  owner_applications: {
    title: 'Owner Applications',
    subtitle: 'Review renter requests to become landlords',
  },
  audit_logs: { title: 'Audit Log', subtitle: 'Recent administrative actions across the platform' },
  moderation_reports: {
    title: 'Reports Queue',
    subtitle: 'User-filed reports against listings and accounts',
  },
  disputes: { title: 'Disputes', subtitle: 'Booking disputes raised by renters and landlords' },
  incomes: { title: 'Incomes', subtitle: 'Revenue, service charge, and payout overview' },
  reports: { title: 'Reports', subtitle: 'Platform performance, approval flow, and booking trends' },
  settings: { title: 'Settings', subtitle: 'Business defaults, support contacts, and admin configuration' },
};

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

  const [view, setView] = useState<View>('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(() => {
    const stored = safeParseJson<AdminSettings>(localStorage.getItem(SETTINGS_KEY));
    return stored ?? getDefaultSettings();
  });
  const [navOpen, setNavOpen] = useState(false);
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

  if (!session) {
    return (
      <LoginView
        apiUrl={apiUrl}
        isDark={isDark}
        onToggleTheme={toggle}
        onApiUrlChange={setApiUrl}
        onLoggedIn={(next) => {
          setSession(next);
          setView('dashboard');
        }}
      />
    );
  }

  const demoMode = isDemoSession(session);
  const meta = PAGE_META[view];

  const navigate = (next: View) => {
    setView(next);
    if (next !== 'user_details') {
      setSelectedUserId(null);
    }
    if (next !== 'listing_details') {
      setSelectedListingId(null);
    }
    if (next !== 'booking_details') {
      setSelectedBookingId(null);
    }
    setNavOpen(false);
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return (
    <div className="app">
      {navOpen ? <div className="scrim" onClick={() => setNavOpen(false)} /> : null}

      <aside className={`sidebar ${navOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebarBrand">
          <BrandMark />
          <div className="sidebarBrandText">
            <span className="sidebarBrandName">BlueRock</span>
            <span className="sidebarBrandSub">Admin Console</span>
          </div>
        </div>

        <nav className="nav">
          <span className="navLabel">Manage</span>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`navItem ${view === item.key ? 'navItem--active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebarFooter">
          <div className="connectionCard">
            <div className="connectionTop">
              <span className="connectionLabel">
                <Icon name="server" size={14} />
                Backend
              </span>
              <span className={`statusDot ${demoMode ? 'statusDot--demo' : 'statusDot--live'}`}>
                {demoMode ? 'Demo' : 'Live'}
              </span>
            </div>
            <input
              className="connectionInput"
              value={apiUrl}
              onChange={(e) => setApiUrl(normalizeApiUrl(e.target.value))}
              placeholder={defaultApiUrl}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="userChip">
            <span className="avatar">{initialsFor(session.user.name, session.user.email)}</span>
            <div className="userChipText">
              <span className="userChipName">{session.user.name?.trim() || session.user.email}</span>
              <span className="userChipRole">{session.user.role}</span>
            </div>
            <button type="button" className="iconBtn" onClick={signOut} title="Sign out" aria-label="Sign out">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbarLeft">
            <button
              type="button"
              className="iconBtn topbarMenu"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
            >
              <Icon name="menu" size={20} />
            </button>
            <div className="topbarHeading">
              <h1 className="topbarTitle">{meta.title}</h1>
              <p className="topbarSubtitle">{meta.subtitle}</p>
            </div>
          </div>
          <div className="topbarActions">
            <button
              type="button"
              className="iconBtn"
              onClick={toggle}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={18} />
            </button>
          </div>
        </header>

        <main className="content">
          {view === 'dashboard' ? (
            <DashboardView apiUrl={apiUrl} session={session} onNavigate={navigate} />
          ) : view === 'users' ? (
            <UsersView
              apiUrl={apiUrl}
              session={session}
              onViewUser={(userId) => {
                setSelectedUserId(userId);
                setView('user_details');
              }}
            />
          ) : view === 'user_details' && selectedUserId ? (
            <UserDetailView
              apiUrl={apiUrl}
              session={session}
              userId={selectedUserId}
              onBack={() => {
                setView('users');
                setSelectedUserId(null);
              }}
            />
          ) : view === 'listings' ? (
            <ListingsView
              apiUrl={apiUrl}
              session={session}
              onViewListing={(listingId) => {
                setSelectedListingId(listingId);
                setView('listing_details');
              }}
            />
          ) : view === 'listing_details' && selectedListingId ? (
            <ListingDetailView
              apiUrl={apiUrl}
              session={session}
              listingId={selectedListingId}
              onBack={() => {
                setView('listings');
                setSelectedListingId(null);
              }}
            />
          ) : view === 'bookings' ? (
            <BookingsView
              apiUrl={apiUrl}
              session={session}
              onViewBooking={(bookingId) => {
                setSelectedBookingId(bookingId);
                setView('booking_details');
              }}
            />
          ) : view === 'booking_details' && selectedBookingId ? (
            <BookingDetailView
              apiUrl={apiUrl}
              session={session}
              bookingId={selectedBookingId}
              onBack={() => {
                setView('bookings');
                setSelectedBookingId(null);
              }}
            />
          ) : view === 'owner_applications' ? (
            <OwnerApplicationsView apiUrl={apiUrl} session={session} />
          ) : view === 'audit_logs' ? (
            <AuditLogView apiUrl={apiUrl} session={session} />
          ) : view === 'moderation_reports' ? (
            <ReportsQueueView apiUrl={apiUrl} session={session} />
          ) : view === 'disputes' ? (
            <DisputesQueueView apiUrl={apiUrl} session={session} />
          ) : view === 'incomes' ? (
            <IncomesView apiUrl={apiUrl} session={session} />
          ) : view === 'reports' ? (
            <ReportsView apiUrl={apiUrl} session={session} />
          ) : view === 'settings' ? (
            <SettingsView settings={settings} onSettingsChange={setSettings} />
          ) : (
            <DashboardView apiUrl={apiUrl} session={session} onNavigate={navigate} />
          )}
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Login                                                                      */
/* -------------------------------------------------------------------------- */

function LoginView({
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
  const [email, setEmail] = useState(DEMO_ADMIN_EMAIL);
  const [password, setPassword] = useState(DEMO_ADMIN_PASSWORD);
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

          <div className="demoHint">
            <Icon name="sparkles" size={15} />
            <span>
              Demo: <strong>{DEMO_ADMIN_EMAIL}</strong> / <strong>{DEMO_ADMIN_PASSWORD}</strong>
            </span>
          </div>

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

                try {
                  const payload = await apiFetch<LoginResponse>(resolvedApiUrl, null, '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.trim(), password }),
                  });

                  if (payload.user.role !== 'ADMIN') {
                    throw new Error('This account is not an admin');
                  }

                  onLoggedIn({ accessToken: payload.accessToken, user: payload.user });
                  return;
                } catch (err) {
                  // Only fall back to the local demo session when the entered
                  // credentials are exactly the known demo admin credentials AND
                  // the failure looks like the backend was unreachable (a
                  // network-level failure), never for a real rejection from a
                  // reachable backend (e.g. wrong password, non-admin role).
                  const isNetworkFailure = err instanceof TypeError;
                  if (isDemoCredentials(email, password) && isNetworkFailure) {
                    onLoggedIn(createDemoSession());
                    return;
                  }
                  throw err;
                }
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

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

function DashboardView({
  apiUrl,
  session,
  onNavigate,
}: {
  apiUrl: string;
  session: Session;
  onNavigate: (view: View) => void;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);
  const adminName = session.user.name?.trim() || session.user.email;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setStats(getDemoStats());
        return;
      }
      const data = await apiFetch<AdminStats>(apiUrl, session.accessToken, '/admin/stats');
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const statCards = [
    {
      label: 'Users',
      value: loading ? '—' : String(stats?.users ?? '—'),
      tone: 'brand',
      icon: 'users' as IconName,
      note: 'Accounts across admins, landlords, and renters',
    },
    {
      label: 'Listings',
      value: loading ? '—' : String(stats?.listings ?? '—'),
      tone: 'violet',
      icon: 'home' as IconName,
      note: 'Properties currently tracked by the platform',
    },
    {
      label: 'Bookings',
      value: loading ? '—' : String(stats?.bookings ?? '—'),
      tone: 'amber',
      icon: 'calendar' as IconName,
      note: 'Reservations moving through the pipeline',
    },
    {
      label: 'Revenue',
      value: loading ? '—' : formatMoney('NGN', stats?.revenue ?? 0),
      tone: 'emerald',
      icon: 'wallet' as IconName,
      note: 'Paid booking volume recorded so far',
    },
  ] as const;

  return (
    <div className="stack">
      <section className="hero">
        <div className="heroBody">
          <span className="heroEyebrow">
            <Icon name="sparkles" size={14} /> Operations overview
          </span>
          <h2 className="heroTitle">Welcome back, {adminName}</h2>
          <p className="heroSubtitle">
            A cleaner view of platform activity across users, listings, bookings, and revenue.
          </p>
        </div>
        <button type="button" className="btn btn--ghost btn--onHero" onClick={() => void load()}>
          <Icon name="refresh" size={16} />
          Refresh
        </button>
      </section>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="statGrid">
        {statCards.map((card) => (
          <div key={card.label} className={`statCard statCard--${card.tone}`}>
            <div className="statCardTop">
              <span className="statIcon">
                <Icon name={card.icon} size={20} />
              </span>
              <span className="statLabel">{card.label}</span>
            </div>
            <div className="statValue">{card.value}</div>
            <div className="statNote">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="dashGrid">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Quick actions</span>
              <h3 className="panelTitle">Move faster through admin tasks</h3>
            </div>
          </div>
          <div className="actionList">
            <button type="button" className="actionRow" onClick={() => onNavigate('users')}>
              <span className="actionIcon actionIcon--brand">
                <Icon name="users" size={18} />
              </span>
              <span className="actionText">
                <strong>Review users</strong>
                <small>Suspend, activate, and inspect account status.</small>
              </span>
              <span className="actionMeta">{loading ? '—' : (stats?.users ?? 0)}</span>
              <Icon name="chevron" size={16} className="actionChevron" />
            </button>
            <button type="button" className="actionRow" onClick={() => onNavigate('listings')}>
              <span className="actionIcon actionIcon--violet">
                <Icon name="home" size={18} />
              </span>
              <span className="actionText">
                <strong>Moderate listings</strong>
                <small>Approve pending homes and clean up rejected ones.</small>
              </span>
              <span className="actionMeta">{loading ? '—' : (stats?.listings ?? 0)}</span>
              <Icon name="chevron" size={16} className="actionChevron" />
            </button>
            <button type="button" className="actionRow" onClick={() => onNavigate('bookings')}>
              <span className="actionIcon actionIcon--amber">
                <Icon name="calendar" size={18} />
              </span>
              <span className="actionText">
                <strong>Track bookings</strong>
                <small>Follow reservation flow and payment status.</small>
              </span>
              <span className="actionMeta">{loading ? '—' : (stats?.bookings ?? 0)}</span>
              <Icon name="chevron" size={16} className="actionChevron" />
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">System snapshot</span>
              <h3 className="panelTitle">What the platform looks like right now</h3>
            </div>
          </div>
          <div className="insightList">
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="activity" size={16} /> Workspace status
              </span>
              <strong>{demoMode ? 'Ready for demo review' : 'Connected to live services'}</strong>
            </div>
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="grid" size={16} /> Total managed records
              </span>
              <strong>
                {loading ? '—' : (stats?.users ?? 0) + (stats?.listings ?? 0) + (stats?.bookings ?? 0)}
              </strong>
            </div>
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="trend" size={16} /> Revenue health
              </span>
              <strong>{loading ? '—' : stats?.revenue ? 'Generating value' : 'Awaiting paid activity'}</strong>
            </div>
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="shield" size={16} /> Admin identity
              </span>
              <strong className="truncate">{session.user.email}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

function UsersView({
  apiUrl,
  session,
  onViewUser,
}: {
  apiUrl: string;
  session: Session;
  onViewUser: (userId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const demoMode = isDemoSession(session);

  const loader = useCallback(async () => {
    if (demoMode) return cloneData(demoUsers);
    return await apiFetch<AdminUser[]>(apiUrl, session.accessToken, '/admin/users');
  }, [apiUrl, demoMode, session.accessToken]);

  const { data: items, setData: setItems, loading, error, setError, reload } = useAdminResource<AdminUser[]>(
    loader,
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => {
      return (
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const { page, setPage, totalPages, pageItems } = usePagedItems(filtered);

  const updateStatus = async (userId: string, next: UserStatus) => {
    setError(null);
    if (demoMode) {
      setItems((prev) => prev.map((u) => (u.id === userId ? { ...u, status: next } : u)));
      return;
    }
    try {
      const data = await apiFetch<{ id: string; email: string; status: UserStatus }>(
        apiUrl,
        session.accessToken,
        `/admin/users/${userId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        },
      );
      setItems((prev) => prev.map((u) => (u.id === data.id ? { ...u, status: data.status } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'user' : 'users'}`}
        </span>
        <div className="toolbarActions">
          <SearchField value={query} onChange={setQuery} placeholder="Search email, role, status…" />
          <button type="button" className="btn btn--ghost" onClick={() => void reload()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="tableCard">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Joined</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow span={6} label="Loading users…" />
              ) : pageItems.length === 0 ? (
                <EmptyRow span={6} label="No users found." />
              ) : (
                pageItems.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="cellUser">
                        <span className="avatar avatar--sm">{initialsFor(u.name, u.email)}</span>
                        <div className="cellUserText">
                          <span className="cellUserName">{u.name?.trim() || u.email}</span>
                          <span className="cellUserSub">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="roleTag">{u.role}</span>
                    </td>
                    <td>
                      <Badge tone={userStatusTone(u.status)}>{u.status}</Badge>
                    </td>
                    <td>
                      {u.emailVerified ? (
                        <span className="verified verified--yes">
                          <Icon name="check" size={14} /> Verified
                        </span>
                      ) : (
                        <span className="verified verified--no">Unverified</span>
                      )}
                    </td>
                    <td className="cellMuted">{formatDate(u.createdAt)}</td>
                    <td className="colActions">
                      <div className="actionCluster">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onViewUser(u.id)}>
                          View
                        </button>
                        {u.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={() => void updateStatus(u.id, 'SUSPENDED')}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--soft btn--sm"
                            onClick={() => void updateStatus(u.id, 'ACTIVE')}
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

function UserDetailView({
  apiUrl,
  session,
  userId,
  onBack,
}: {
  apiUrl: string;
  session: Session;
  userId: string;
  onBack: () => void;
}) {
  const [item, setItem] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        const detail = getDemoUserDetail(userId);
        if (!detail) throw new Error('User not found');
        setItem(detail);
        return;
      }

      const data = await apiFetch<AdminUserDetail>(apiUrl, session.accessToken, `/admin/users/${userId}`);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (next: UserStatus) => {
    if (!item) return;
    setError(null);

    if (demoMode) {
      setItem((prev) => (prev ? { ...prev, status: next } : prev));
      return;
    }

    try {
      const data = await apiFetch<{ id: string; email: string; status: UserStatus }>(
        apiUrl,
        session.accessToken,
        `/admin/users/${item.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        },
      );
      setItem((prev) => (prev ? { ...prev, status: data.status } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const summaryCards = item
    ? [
        { label: 'Listings Owned', value: String(item.counts.listingsOwned), tone: 'brand', icon: 'home' as IconName },
        {
          label: 'Bookings Made',
          value: String(item.counts.bookingsAsRenter),
          tone: 'amber',
          icon: 'calendar' as IconName,
        },
        { label: 'Reviews', value: String(item.counts.reviewsWritten), tone: 'violet', icon: 'activity' as IconName },
        { label: 'Tokens', value: String(item.counts.accessTokens), tone: 'emerald', icon: 'shield' as IconName },
      ]
    : [];

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbarActions">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            <Icon name="chevron" size={16} />
            Back to Users
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading && !item ? (
        <div className="panel userDetailEmpty">Loading user details…</div>
      ) : !item ? (
        <div className="panel userDetailEmpty">User not found.</div>
      ) : (
        <>
          <section className="userHero">
            <div className="userHeroIdentity">
              <span className="avatar userHeroAvatar">{initialsFor(item.name, item.email)}</span>
              <div className="userHeroText">
                <span className="panelEyebrow">User profile</span>
                <h2 className="userHeroTitle">{item.name?.trim() || item.email}</h2>
                <p className="userHeroSubtitle">{item.email}</p>
              </div>
            </div>

            <div className="userHeroActions">
              <span className="roleTag">{item.role}</span>
              <Badge tone={userStatusTone(item.status)}>{item.status}</Badge>
              {item.status === 'ACTIVE' ? (
                <button type="button" className="btn btn--danger" onClick={() => void updateStatus('SUSPENDED')}>
                  Suspend User
                </button>
              ) : (
                <button type="button" className="btn btn--soft" onClick={() => void updateStatus('ACTIVE')}>
                  Activate User
                </button>
              )}
            </div>
          </section>

          <div className="statGrid">
            {summaryCards.map((card) => (
              <div key={card.label} className={`statCard statCard--${card.tone}`}>
                <div className="statCardTop">
                  <span className="statIcon">
                    <Icon name={card.icon} size={18} />
                  </span>
                  <span className="statLabel">{card.label}</span>
                </div>
                <div className="statValue">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="userDetailGrid">
            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Account summary</span>
                  <h3 className="panelTitle">Profile and access information</h3>
                </div>
              </div>

              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Email address</span>
                  <strong className="truncate">{item.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Phone number</span>
                  <strong>{item.phone?.trim() || 'Not provided'}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Verification</span>
                  <strong>{item.emailVerified ? 'Verified' : 'Pending verification'}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Joined</span>
                  <strong>{formatDate(item.createdAt)}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Last updated</span>
                  <strong>{formatDate(item.updatedAt)}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Recent listings</span>
                  <h3 className="panelTitle">Latest properties from this user</h3>
                </div>
              </div>

              <div className="detailFeed">
                {item.recentListings.length === 0 ? (
                  <div className="feedEmpty">No listings yet.</div>
                ) : (
                  item.recentListings.map((listing) => (
                    <div key={listing.id} className="feedCard">
                      <div className="feedCardTop">
                        <strong>{listing.title}</strong>
                        <Badge tone={listingStatusTone(listing.status)}>{listing.status}</Badge>
                      </div>
                      <span className="feedMeta">{listing.location}</span>
                      <span className="feedMeta">
                        {formatMoney(listing.currency, listing.pricePerNight)} • {formatDate(listing.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Recent bookings</span>
                  <h3 className="panelTitle">Reservations made by this user</h3>
                </div>
              </div>

              <div className="detailFeed">
                {item.recentBookings.length === 0 ? (
                  <div className="feedEmpty">No bookings yet.</div>
                ) : (
                  item.recentBookings.map((booking) => (
                    <div key={booking.id} className="feedCard">
                      <div className="feedCardTop">
                        <strong>{booking.listing.title}</strong>
                        <Badge tone={bookingStatusTone(booking.status)}>{booking.status}</Badge>
                      </div>
                      <span className="feedMeta">{booking.listing.location}</span>
                      <span className="feedMeta">
                        {formatMoney('NGN', booking.total)} • {formatDate(booking.createdAt)}
                      </span>
                      <span className="feedMeta">Payment: {booking.paymentStatus}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Listings                                                                   */
/* -------------------------------------------------------------------------- */

function ListingsView({
  apiUrl,
  session,
  onViewListing,
}: {
  apiUrl: string;
  session: Session;
  onViewListing: (listingId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const demoMode = isDemoSession(session);

  const loader = useCallback(async () => {
    if (demoMode) return cloneData(demoListings);
    return await apiFetch<AdminListing[]>(apiUrl, session.accessToken, '/admin/listings');
  }, [apiUrl, demoMode, session.accessToken]);

  const { data: items, setData: setItems, loading, error, setError, reload } = useAdminResource<AdminListing[]>(
    loader,
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((l) => {
      if (featuredOnly && !l.featured) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        l.owner.email.toLowerCase().includes(q)
      );
    });
  }, [items, query, featuredOnly]);

  const { page, setPage, totalPages, pageItems } = usePagedItems(filtered);

  const setStatus = async (listingId: string, status: 'APPROVED' | 'REJECTED') => {
    setError(null);
    if (demoMode) {
      setItems((prev) => prev.map((l) => (l.id === listingId ? { ...l, status } : l)));
      return;
    }
    try {
      const data = await apiFetch<AdminListing>(
        apiUrl,
        session.accessToken,
        `/listings/${listingId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      setItems((prev) => prev.map((l) => (l.id === data.id ? { ...l, status: data.status } : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'listing' : 'listings'}`}
        </span>
        <div className="toolbarActions">
          <SearchField value={query} onChange={setQuery} placeholder="Search title, location, owner…" />
          <label className="checkboxField">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
            />
            Featured only
          </label>
          <button type="button" className="btn btn--ghost" onClick={() => void reload()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="tableCard">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Property</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Price / night</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Created</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow span={8} label="Loading listings…" />
              ) : pageItems.length === 0 ? (
                <EmptyRow span={8} label="No listings found." />
              ) : (
                pageItems.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{l.title}</span>
                        <span className="cellUserSub">
                          {l.type} · {l.rooms} bd · {l.bathrooms} ba
                        </span>
                      </div>
                    </td>
                    <td className="cellMuted">{l.owner.email}</td>
                    <td>
                      <span className="cellLocation">
                        <Icon name="pin" size={14} />
                        {l.location}
                      </span>
                    </td>
                    <td className="cellStrong">{formatMoney(l.currency, l.pricePerNight)}</td>
                    <td>
                      <Badge tone={listingStatusTone(l.status)}>{l.status}</Badge>
                    </td>
                    <td>
                      {l.featured ? (
                        <Badge tone="info">
                          Featured{l.featuredUntil ? ` · ${formatDate(l.featuredUntil)}` : ''}
                        </Badge>
                      ) : (
                        <span className="cellDash">—</span>
                      )}
                    </td>
                    <td className="cellMuted">{formatDate(l.createdAt)}</td>
                    <td className="colActions">
                      <div className="actionCluster">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onViewListing(l.id)}>
                          View
                        </button>
                        {l.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              className="btn btn--soft btn--sm"
                              onClick={() => void setStatus(l.id, 'APPROVED')}
                            >
                              <Icon name="check" size={14} />
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => void setStatus(l.id, 'REJECTED')}
                            >
                              <Icon name="x" size={14} />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="cellDash">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bookings                                                                   */
/* -------------------------------------------------------------------------- */

function ListingDetailView({
  apiUrl,
  session,
  listingId,
  onBack,
}: {
  apiUrl: string;
  session: Session;
  listingId: string;
  onBack: () => void;
}) {
  const [item, setItem] = useState<AdminListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        const detail = getDemoListingDetail(listingId);
        if (!detail) throw new Error('Listing not found');
        setItem(cloneData(detail));
        return;
      }

      const data = await apiFetch<AdminListing[]>(apiUrl, session.accessToken, '/admin/listings');
      const detail = data.find((listing) => listing.id === listingId) ?? null;
      if (!detail) throw new Error('Listing not found');
      setItem(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, listingId, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!item) return;
    setError(null);
    if (demoMode) {
      setItem((prev) => (prev ? { ...prev, status } : prev));
      return;
    }
    try {
      const data = await apiFetch<AdminListing>(
        apiUrl,
        session.accessToken,
        `/listings/${item.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      setItem((prev) => (prev ? { ...prev, status: data.status } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  const setFeatured = async (featured: boolean) => {
    if (!item) return;
    setError(null);
    if (demoMode) {
      setItem((prev) => (prev ? { ...prev, featured, featuredUntil: featured ? prev.featuredUntil : null } : prev));
      return;
    }
    try {
      const data = await apiFetch<AdminListing>(
        apiUrl,
        session.accessToken,
        `/listings/${item.id}/featured`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured }),
        },
      );
      setItem((prev) => (prev ? { ...prev, featured: data.featured, featuredUntil: data.featuredUntil } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbarActions">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            <Icon name="chevron" size={16} />
            Back to Listings
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading && !item ? (
        <div className="panel userDetailEmpty">Loading listing details…</div>
      ) : !item ? (
        <div className="panel userDetailEmpty">Listing not found.</div>
      ) : (
        <>
          <section className="userHero">
            <div className="userHeroIdentity">
              <span className="avatar userHeroAvatar">{item.title.slice(0, 2).toUpperCase()}</span>
              <div className="userHeroText">
                <span className="panelEyebrow">Property details</span>
                <h2 className="userHeroTitle">{item.title}</h2>
                <p className="userHeroSubtitle">{item.location}</p>
              </div>
            </div>

            <div className="userHeroActions">
              <Badge tone={listingStatusTone(item.status)}>{item.status}</Badge>
              <span className="roleTag">{item.type}</span>
              {item.featured ? (
                <Badge tone="info">
                  Featured{item.featuredUntil ? ` · until ${formatDate(item.featuredUntil)}` : ''}
                </Badge>
              ) : null}
              {item.status === 'PENDING' ? (
                <>
                  <button type="button" className="btn btn--soft" onClick={() => void setStatus('APPROVED')}>
                    Approve Listing
                  </button>
                  <button type="button" className="btn btn--danger" onClick={() => void setStatus('REJECTED')}>
                    Reject Listing
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void setFeatured(!item.featured)}
              >
                {item.featured ? 'Remove from Featured Homes' : 'Add to Featured Homes'}
              </button>
            </div>
          </section>

          <div className="statGrid">
            <div className="statCard statCard--brand">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="wallet" size={18} />
                </span>
                <span className="statLabel">Price per Night</span>
              </div>
              <div className="statValue">{formatMoney(item.currency, item.pricePerNight)}</div>
            </div>
            <div className="statCard statCard--violet">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="home" size={18} />
                </span>
                <span className="statLabel">Rooms</span>
              </div>
              <div className="statValue">{item.rooms}</div>
            </div>
            <div className="statCard statCard--amber">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="activity" size={18} />
                </span>
                <span className="statLabel">Bathrooms</span>
              </div>
              <div className="statValue">{item.bathrooms}</div>
            </div>
            <div className="statCard statCard--emerald">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="calendar" size={18} />
                </span>
                <span className="statLabel">Created</span>
              </div>
              <div className="statValue detailValueSm">{formatDate(item.createdAt)}</div>
            </div>
          </div>

          <div className="userDetailGrid userDetailGrid--two">
            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Overview</span>
                  <h3 className="panelTitle">Property summary</h3>
                </div>
              </div>
              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Owner</span>
                  <strong>{item.owner.name?.trim() || item.owner.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Owner email</span>
                  <strong className="truncate">{item.owner.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Phone</span>
                  <strong>{item.owner.phone?.trim() || 'Not provided'}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Description</span>
                  <strong className="detailParagraph">{item.description}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Amenities and rules</span>
                  <h3 className="panelTitle">What guests should know</h3>
                </div>
              </div>
              <div className="chipGroup">
                {item.amenities.map((amenity) => (
                  <span key={amenity} className="miniChip">
                    {amenity}
                  </span>
                ))}
              </div>
              <div className="detailFeed detailFeed--tight">
                {item.rules.map((rule) => (
                  <div key={rule} className="feedCard">
                    <span className="feedMeta">{rule}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <ListingReviewsPanel apiUrl={apiUrl} session={session} listingId={item.id} />
        </>
      )}
    </div>
  );
}

function ListingReviewsPanel({
  apiUrl,
  session,
  listingId,
}: {
  apiUrl: string;
  session: Session;
  listingId: string;
}) {
  const demoMode = isDemoSession(session);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loader = useCallback(async () => {
    if (demoMode) return cloneData(demoReviews.filter((review) => review.listingId === listingId));
    return await apiFetch<AdminReview[]>(apiUrl, session.accessToken, `/listings/${listingId}/reviews`);
  }, [apiUrl, demoMode, listingId, session.accessToken]);

  const { data: reviews, setData: setReviews, loading, error, reload } = useAdminResource<AdminReview[]>(
    loader,
    [],
  );

  const moderate = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionError(null);
    setBusyId(reviewId);
    try {
      if (demoMode) {
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, moderationStatus: status } : r)));
        return;
      }
      await apiFetch(apiUrl, session.accessToken, `/admin/reviews/${reviewId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      // Applied optimistically rather than refetched: the public reviews
      // endpoint excludes REJECTED reviews, so a refetch after flagging one
      // would make it disappear and couldn't be unflagged from this list.
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, moderationStatus: status } : r)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update review');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <span className="panelEyebrow">Reviews</span>
          <h3 className="panelTitle">Guest feedback and moderation</h3>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void reload()}>
          <Icon name="refresh" size={14} />
          Refresh
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {actionError ? <ErrorBanner message={actionError} /> : null}

      <div className="detailFeed">
        {loading ? (
          <div className="feedEmpty">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="feedEmpty">No reviews for this listing yet.</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="feedCard">
              <div className="feedCardTop">
                <strong>
                  {review.renter?.name?.trim() || 'Renter'} · {review.rating}/5
                  <Icon name="star" size={14} />
                </strong>
                <Badge tone={reviewStatusTone(review.moderationStatus)}>{review.moderationStatus}</Badge>
              </div>
              <span className="feedMeta">{review.body}</span>
              {review.ownerResponse ? (
                <span className="feedMeta">Owner response: {review.ownerResponse}</span>
              ) : null}
              <span className="feedMeta">{formatDate(review.createdAt)}</span>
              <div className="actionCluster">
                {review.moderationStatus === 'REJECTED' ? (
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    disabled={busyId === review.id}
                    onClick={() => void moderate(review.id, 'APPROVED')}
                  >
                    <Icon name="check" size={14} />
                    Unflag
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    disabled={busyId === review.id}
                    onClick={() => void moderate(review.id, 'REJECTED')}
                  >
                    <Icon name="flag" size={14} />
                    Flag
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Bookings                                                                   */
/* -------------------------------------------------------------------------- */

function BookingsView({
  apiUrl,
  session,
  onViewBooking,
}: {
  apiUrl: string;
  session: Session;
  onViewBooking: (bookingId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const demoMode = isDemoSession(session);

  const loader = useCallback(async () => {
    if (demoMode) return cloneData(demoBookings);
    return await apiFetch<AdminBooking[]>(apiUrl, session.accessToken, '/admin/bookings');
  }, [apiUrl, demoMode, session.accessToken]);

  const { data: items, loading, error, reload } = useAdminResource<AdminBooking[]>(loader, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((b) => {
      return (
        b.listing.title.toLowerCase().includes(q) ||
        b.listing.location.toLowerCase().includes(q) ||
        b.renter.email.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q) ||
        b.paymentStatus.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const { page, setPage, totalPages, pageItems } = usePagedItems(filtered);

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'booking' : 'bookings'}`}
        </span>
        <div className="toolbarActions">
          <SearchField value={query} onChange={setQuery} placeholder="Search listing, renter, status…" />
          <button type="button" className="btn btn--ghost" onClick={() => void reload()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="tableCard">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Renter</th>
                <th>Stay</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Created</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow span={8} label="Loading bookings…" />
              ) : pageItems.length === 0 ? (
                <EmptyRow span={8} label="No bookings found." />
              ) : (
                pageItems.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{b.listing.title}</span>
                        <span className="cellUserSub">
                          <Icon name="pin" size={12} /> {b.listing.location}
                        </span>
                      </div>
                    </td>
                    <td className="cellMuted">{b.renter.email}</td>
                    <td>
                      <div className="cellUserText">
                        <span className="cellStrong">
                          {b.nights} {b.nights === 1 ? 'night' : 'nights'}
                        </span>
                        <span className="cellUserSub">
                          {formatDate(b.startDate)} → {formatDate(b.endDate)}
                        </span>
                      </div>
                    </td>
                    <td className="cellStrong">{formatMoney('NGN', b.total)}</td>
                    <td>
                      <Badge tone={bookingStatusTone(b.status)}>{b.status}</Badge>
                    </td>
                    <td>
                      <Badge tone={paymentTone(b.paymentStatus)}>{b.paymentStatus}</Badge>
                    </td>
                    <td className="cellMuted">{formatDate(b.createdAt)}</td>
                    <td className="colActions">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => onViewBooking(b.id)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

function BookingDetailView({
  apiUrl,
  session,
  bookingId,
  onBack,
}: {
  apiUrl: string;
  session: Session;
  bookingId: string;
  onBack: () => void;
}) {
  const [item, setItem] = useState<AdminBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        const detail = getDemoBookingDetail(bookingId);
        if (!detail) throw new Error('Booking not found');
        setItem(cloneData(detail));
        return;
      }
      const data = await apiFetch<AdminBooking[]>(apiUrl, session.accessToken, '/admin/bookings');
      const detail = data.find((booking) => booking.id === bookingId) ?? null;
      if (!detail) throw new Error('Booking not found');
      setItem(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, bookingId, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbarActions">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            <Icon name="chevron" size={16} />
            Back to Bookings
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading && !item ? (
        <div className="panel userDetailEmpty">Loading booking details…</div>
      ) : !item ? (
        <div className="panel userDetailEmpty">Booking not found.</div>
      ) : (
        <>
          <section className="userHero">
            <div className="userHeroIdentity">
              <span className="avatar userHeroAvatar">{item.listing.title.slice(0, 2).toUpperCase()}</span>
              <div className="userHeroText">
                <span className="panelEyebrow">Reservation details</span>
                <h2 className="userHeroTitle">{item.listing.title}</h2>
                <p className="userHeroSubtitle">{item.renter.name?.trim() || item.renter.email}</p>
              </div>
            </div>

            <div className="userHeroActions">
              <Badge tone={bookingStatusTone(item.status)}>{item.status}</Badge>
              <Badge tone={paymentTone(item.paymentStatus)}>{item.paymentStatus}</Badge>
            </div>
          </section>

          <div className="statGrid">
            <div className="statCard statCard--brand">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="wallet" size={18} />
                </span>
                <span className="statLabel">Total</span>
              </div>
              <div className="statValue">{formatMoney('NGN', item.total)}</div>
            </div>
            <div className="statCard statCard--amber">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="calendar" size={18} />
                </span>
                <span className="statLabel">Nights</span>
              </div>
              <div className="statValue">{item.nights}</div>
            </div>
            <div className="statCard statCard--violet">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="chart" size={18} />
                </span>
                <span className="statLabel">Service Fee</span>
              </div>
              <div className="statValue">{formatMoney('NGN', item.serviceFee)}</div>
            </div>
            <div className="statCard statCard--emerald">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="activity" size={18} />
                </span>
                <span className="statLabel">Subtotal</span>
              </div>
              <div className="statValue">{formatMoney('NGN', item.subtotal)}</div>
            </div>
          </div>

          <div className="userDetailGrid userDetailGrid--two">
            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Stay information</span>
                  <h3 className="panelTitle">Reservation breakdown</h3>
                </div>
              </div>
              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Location</span>
                  <strong>{item.listing.location}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Check in</span>
                  <strong>{formatDate(item.startDate)}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Check out</span>
                  <strong>{formatDate(item.endDate)}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Created</span>
                  <strong>{formatDate(item.createdAt)}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Renter profile</span>
                  <h3 className="panelTitle">Guest information</h3>
                </div>
              </div>
              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Name</span>
                  <strong>{item.renter.name?.trim() || item.renter.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Email</span>
                  <strong className="truncate">{item.renter.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Phone</span>
                  <strong>{item.renter.phone?.trim() || 'Not provided'}</strong>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function IncomesView({ apiUrl, session }: { apiUrl: string; session: Session }) {
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serviceFeePercent, setServiceFeePercent] = useState(0);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setItems(cloneData(demoBookings));
        return;
      }
      const data = await apiFetch<AdminBooking[]>(apiUrl, session.accessToken, '/admin/bookings');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load income data');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const paidBookings = items.filter((item) => item.paymentStatus === 'PAID');
  const grossRevenue = paidBookings.reduce((sum, item) => sum + item.total, 0);
  const currentServiceCharge = paidBookings.reduce((sum, item) => sum + item.serviceFee, 0);
  const projectedServiceCharge = Math.round((grossRevenue * serviceFeePercent) / 100);
  const landlordPayout = Math.max(0, grossRevenue - projectedServiceCharge);

  return (
    <div className="stack">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="statGrid">
        <div className="statCard statCard--brand">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="wallet" size={18} />
            </span>
            <span className="statLabel">Gross Revenue</span>
          </div>
          <div className="statValue">{loading ? '—' : formatMoney('NGN', grossRevenue)}</div>
          <div className="statNote">Total paid booking value across the platform.</div>
        </div>
        <div className="statCard statCard--violet">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="chart" size={18} />
            </span>
            <span className="statLabel">Current Fee Income</span>
          </div>
          <div className="statValue">{loading ? '—' : formatMoney('NGN', currentServiceCharge)}</div>
          <div className="statNote">Service fee captured from paid bookings so far.</div>
        </div>
        <div className="statCard statCard--amber">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="settings" size={18} />
            </span>
            <span className="statLabel">Configured Charge</span>
          </div>
          <div className="statValue">{serviceFeePercent}%</div>
          <div className="statNote">Live service charge from platform fee rules.</div>
        </div>
        <div className="statCard statCard--emerald">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="trend" size={18} />
            </span>
            <span className="statLabel">Projected Payouts</span>
          </div>
          <div className="statValue">{loading ? '—' : formatMoney('NGN', landlordPayout)}</div>
          <div className="statNote">Approximate landlord payout after configured service charge.</div>
        </div>
      </div>

      <div className="userDetailGrid userDetailGrid--two">
        <FeeRulesPanel apiUrl={apiUrl} session={session} onServiceFeePercentChange={setServiceFeePercent} />

        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Recent paid bookings</span>
              <h3 className="panelTitle">Revenue-driving reservations</h3>
            </div>
          </div>
          <div className="detailFeed">
            {paidBookings.length === 0 ? (
              <div className="feedEmpty">No paid bookings yet.</div>
            ) : (
              paidBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="feedCard">
                  <div className="feedCardTop">
                    <strong>{booking.listing.title}</strong>
                    <Badge tone="success">Paid</Badge>
                  </div>
                  <span className="feedMeta">{booking.renter.email}</span>
                  <span className="feedMeta">
                    Total: {formatMoney('NGN', booking.total)} • Fee: {formatMoney('NGN', booking.serviceFee)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportsView({ apiUrl, session }: { apiUrl: string; session: Session }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setUsers(cloneData(demoUsers));
        setListings(cloneData(demoListings));
        setBookings(cloneData(demoBookings));
        return;
      }
      const [usersData, listingsData, bookingsData] = await Promise.all([
        apiFetch<AdminUser[]>(apiUrl, session.accessToken, '/admin/users'),
        apiFetch<AdminListing[]>(apiUrl, session.accessToken, '/admin/listings'),
        apiFetch<AdminBooking[]>(apiUrl, session.accessToken, '/admin/bookings'),
      ]);
      setUsers(usersData);
      setListings(listingsData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
      setUsers([]);
      setListings([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length;
  const pendingListings = listings.filter((listing) => listing.status === 'PENDING').length;
  const paidBookings = bookings.filter((booking) => booking.paymentStatus === 'PAID').length;
  const unverifiedUsers = users.filter((user) => !user.emailVerified).length;
  const averageBookingValue = bookings.length
    ? Math.round(bookings.reduce((sum, booking) => sum + booking.total, 0) / bookings.length)
    : 0;

  return (
    <div className="stack">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="statGrid">
        <div className="statCard statCard--brand">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="users" size={18} />
            </span>
            <span className="statLabel">Active Users</span>
          </div>
          <div className="statValue">{loading ? '—' : activeUsers}</div>
        </div>
        <div className="statCard statCard--amber">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="home" size={18} />
            </span>
            <span className="statLabel">Pending Listings</span>
          </div>
          <div className="statValue">{loading ? '—' : pendingListings}</div>
        </div>
        <div className="statCard statCard--emerald">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="wallet" size={18} />
            </span>
            <span className="statLabel">Paid Bookings</span>
          </div>
          <div className="statValue">{loading ? '—' : paidBookings}</div>
        </div>
        <div className="statCard statCard--violet">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="chart" size={18} />
            </span>
            <span className="statLabel">Avg Booking Value</span>
          </div>
          <div className="statValue">{loading ? '—' : formatMoney('NGN', averageBookingValue)}</div>
        </div>
      </div>

      <div className="dashGrid">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Platform reports</span>
              <h3 className="panelTitle">Operational highlights</h3>
            </div>
          </div>
          <div className="insightList">
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="shield" size={16} /> Unverified users
              </span>
              <strong>{loading ? '—' : unverifiedUsers}</strong>
            </div>
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="activity" size={16} /> Approval pressure
              </span>
              <strong>{loading ? '—' : pendingListings > 0 ? 'Needs review' : 'Under control'}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Recent exceptions</span>
              <h3 className="panelTitle">Items that need attention</h3>
            </div>
          </div>
          <div className="detailFeed">
            {listings.filter((listing) => listing.status !== 'APPROVED').slice(0, 4).map((listing) => (
              <div key={listing.id} className="feedCard">
                <div className="feedCardTop">
                  <strong>{listing.title}</strong>
                  <Badge tone={listingStatusTone(listing.status)}>{listing.status}</Badge>
                </div>
                <span className="feedMeta">{listing.location}</span>
              </div>
            ))}
            {!loading && listings.filter((listing) => listing.status !== 'APPROVED').length === 0 ? (
              <div className="feedEmpty">No flagged listings right now.</div>
            ) : null}
          </div>
        </section>
      </div>

      <AnalyticsTrendsChart apiUrl={apiUrl} session={session} />
    </div>
  );
}

function SettingsView({
  settings,
  onSettingsChange,
}: {
  settings: AdminSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<AdminSettings>>;
}) {
  return (
    <div className="stack">
      <div className="userDetailGrid userDetailGrid--two">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Business settings</span>
              <h3 className="panelTitle">Support and payout defaults</h3>
            </div>
          </div>
          <div className="detailList">
            <label className="fieldGroup">
              <span className="fieldLabel">Support email</span>
              <input
                className="textInput"
                value={settings.companyEmail}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, companyEmail: e.target.value }))}
              />
            </label>
            <label className="fieldGroup">
              <span className="fieldLabel">Support phone</span>
              <input
                className="textInput"
                value={settings.supportPhone}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, supportPhone: e.target.value }))}
              />
            </label>
            <label className="fieldGroup">
              <span className="fieldLabel">Default payout day</span>
              <input
                className="textInput"
                value={settings.payoutDay}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, payoutDay: e.target.value }))}
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Platform controls</span>
              <h3 className="panelTitle">Operational toggles</h3>
            </div>
          </div>
          <div className="detailList">
            <label className="toggleRow">
              <span>
                <strong>Maintenance mode</strong>
                <small>Restrict platform access for maintenance windows.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, maintenanceMode: e.target.checked }))}
              />
            </label>
            <div className="detailRow">
              <span className="detailLabel">Service charge source</span>
              <strong>Managed from Incomes tab</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
