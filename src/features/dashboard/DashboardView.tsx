import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiFetch,
  ErrorBanner,
  formatMoney,
  Icon,
  type AdminStats,
  type IconName,
  type Session,
} from '../../lib/adminCore';

export default function DashboardView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const adminName = session.user.name?.trim() || session.user.email;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminStats>(apiUrl, session.accessToken, '/admin/stats');
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, session.accessToken]);

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
            <button type="button" className="actionRow" onClick={() => navigate('/users')}>
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
            <button type="button" className="actionRow" onClick={() => navigate('/listings')}>
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
            <button type="button" className="actionRow" onClick={() => navigate('/bookings')}>
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
              <strong>Connected to live services</strong>
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
