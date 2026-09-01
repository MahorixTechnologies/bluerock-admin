import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark, Icon, initialsFor, normalizeApiUrl, type AdminSettings, type Session } from '../lib/adminCore';
import DashboardView from '../features/dashboard/DashboardView';
import UsersView from '../features/users/UsersView';
import UserDetailView from '../features/users/UserDetailView';
import ListingsView from '../features/listings/ListingsView';
import ListingDetailView from '../features/listings/ListingDetailView';
import BookingsView from '../features/bookings/BookingsView';
import BookingDetailView from '../features/bookings/BookingDetailView';
import OwnerApplicationsView from '../features/owner-applications/OwnerApplicationsView';
import AuditLogView from '../features/audit-log/AuditLogView';
import ReportsQueueView from '../features/reports-queue/ReportsQueueView';
import DisputesQueueView from '../features/disputes/DisputesQueueView';
import IncomesView from '../features/incomes/IncomesView';
import ReportsView from '../features/reports/ReportsView';
import SettingsView from '../features/settings/SettingsView';
import { NAV_ITEMS, ROUTE_META } from './navigation';

export default function AppShell({
  apiUrl,
  defaultApiUrl,
  onApiUrlChange,
  session,
  settings,
  onSettingsChange,
  isDark,
  onToggleTheme,
  onSignOut,
}: {
  apiUrl: string;
  defaultApiUrl: string;
  onApiUrlChange: (next: string) => void;
  session: Session;
  settings: AdminSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<AdminSettings>>;
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const meta = ROUTE_META.find((r) => r.test(location.pathname)) ?? ROUTE_META[0];

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
              className={`navItem ${meta.navKey === item.key ? 'navItem--active' : ''}`}
              onClick={() => {
                navigate(item.path);
                setNavOpen(false);
              }}
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
              <span className="statusDot statusDot--live">Live</span>
            </div>
            <input
              className="connectionInput"
              value={apiUrl}
              onChange={(e) => onApiUrlChange(normalizeApiUrl(e.target.value))}
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
            <button type="button" className="iconBtn" onClick={onSignOut} title="Sign out" aria-label="Sign out">
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
              onClick={onToggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={18} />
            </button>
          </div>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<DashboardView apiUrl={apiUrl} session={session} />} />
            <Route path="/users" element={<UsersView apiUrl={apiUrl} session={session} />} />
            <Route path="/users/:userId" element={<UserDetailView apiUrl={apiUrl} session={session} />} />
            <Route path="/listings" element={<ListingsView apiUrl={apiUrl} session={session} />} />
            <Route path="/listings/:listingId" element={<ListingDetailView apiUrl={apiUrl} session={session} />} />
            <Route path="/bookings" element={<BookingsView apiUrl={apiUrl} session={session} />} />
            <Route path="/bookings/:bookingId" element={<BookingDetailView apiUrl={apiUrl} session={session} />} />
            <Route path="/owner-applications" element={<OwnerApplicationsView apiUrl={apiUrl} session={session} />} />
            <Route path="/audit-log" element={<AuditLogView apiUrl={apiUrl} session={session} />} />
            <Route path="/reports-queue" element={<ReportsQueueView apiUrl={apiUrl} session={session} />} />
            <Route path="/disputes" element={<DisputesQueueView apiUrl={apiUrl} session={session} />} />
            <Route path="/incomes" element={<IncomesView apiUrl={apiUrl} session={session} />} />
            <Route path="/reports" element={<ReportsView apiUrl={apiUrl} session={session} />} />
            <Route path="/settings" element={<SettingsView settings={settings} onSettingsChange={onSettingsChange} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
