import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  apiFetch,
  Badge,
  bookingStatusTone,
  ErrorBanner,
  formatDate,
  formatMoney,
  Icon,
  initialsFor,
  listingStatusTone,
  userStatusTone,
  type AdminUserDetail,
  type IconName,
  type Session,
  type UserStatus,
} from '../../lib/adminCore';

export default function UserDetailView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const { userId = '' } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate('/users');
  const [item, setItem] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminUserDetail>(apiUrl, session.accessToken, `/admin/users/${userId}`);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, session.accessToken, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (next: UserStatus) => {
    if (!item) return;
    setError(null);

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
