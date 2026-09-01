import { useCallback, useEffect, useState } from 'react';
import {
  apiFetch,
  Badge,
  ErrorBanner,
  formatMoney,
  Icon,
  listingStatusTone,
  type AdminBooking,
  type AdminListing,
  type AdminUser,
  type Session,
} from '../../lib/adminCore';
import AnalyticsTrendsChart from './AnalyticsTrendsChart';

export default function ReportsView({ apiUrl, session }: { apiUrl: string; session: Session }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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
  }, [apiUrl, session.accessToken]);

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
