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
  paymentTone,
  type AdminBooking,
  type Session,
} from '../../lib/adminCore';

export default function BookingDetailView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const { bookingId = '' } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate('/bookings');
  const [item, setItem] = useState<AdminBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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
  }, [apiUrl, bookingId, session.accessToken]);

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
