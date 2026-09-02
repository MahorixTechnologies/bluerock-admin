import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  apiFetch,
  Badge,
  bookingStatusTone,
  ErrorBanner,
  formatDate,
  formatDateTime,
  formatMoney,
  Icon,
  paymentTxTone,
  type AdminPaymentDetail,
  type Session,
} from '../../lib/adminCore';

export default function PaymentDetailView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const { paymentId = '' } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate('/payments');
  const [item, setItem] = useState<AdminPaymentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminPaymentDetail>(apiUrl, session.accessToken, `/admin/payments/${paymentId}`);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, paymentId, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const refund = async () => {
    if (!item) return;
    setError(null);
    setRefunding(true);
    try {
      await apiFetch(apiUrl, session.accessToken, `/admin/payments/${item.id}/refund`, { method: 'POST' });
      setItem((prev) => (prev ? { ...prev, status: 'REFUNDED' } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refund payment');
    } finally {
      setRefunding(false);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbarActions">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            <Icon name="chevron" size={16} />
            Back to Payments
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading && !item ? (
        <div className="panel userDetailEmpty">Loading payment details…</div>
      ) : !item ? (
        <div className="panel userDetailEmpty">Payment not found.</div>
      ) : (
        <>
          <section className="userHero">
            <div className="userHeroIdentity">
              <span className="avatar userHeroAvatar">{item.reference.slice(0, 2).toUpperCase()}</span>
              <div className="userHeroText">
                <span className="panelEyebrow">Payment transaction</span>
                <h2 className="userHeroTitle">{item.reference}</h2>
                <p className="userHeroSubtitle">{item.payer.name?.trim() || item.payer.email}</p>
              </div>
            </div>

            <div className="userHeroActions">
              <Badge tone={paymentTxTone(item.status)}>{item.status}</Badge>
              {item.status === 'SUCCESSFUL' ? (
                <button type="button" className="btn btn--danger" disabled={refunding} onClick={() => void refund()}>
                  {refunding ? 'Refunding…' : 'Refund'}
                </button>
              ) : null}
            </div>
          </section>

          <div className="statGrid">
            <div className="statCard statCard--brand">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="wallet" size={18} />
                </span>
                <span className="statLabel">Amount</span>
              </div>
              <div className="statValue">{formatMoney(item.currency, item.amount)}</div>
            </div>
            <div className="statCard statCard--amber">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="server" size={18} />
                </span>
                <span className="statLabel">Provider</span>
              </div>
              <div className="statValue">{item.provider}</div>
            </div>
            <div className="statCard statCard--violet">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="chart" size={18} />
                </span>
                <span className="statLabel">Purpose</span>
              </div>
              <div className="statValue">{item.purpose.replace('_', ' ')}</div>
            </div>
            <div className="statCard statCard--emerald">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="calendar" size={18} />
                </span>
                <span className="statLabel">Created</span>
              </div>
              <div className="statValue">{formatDate(item.createdAt)}</div>
            </div>
          </div>

          <div className="userDetailGrid userDetailGrid--two">
            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Transaction</span>
                  <h3 className="panelTitle">Provider details</h3>
                </div>
              </div>
              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Reference</span>
                  <strong className="truncate">{item.reference}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Provider transaction id</span>
                  <strong className="truncate">{item.providerTransactionId ?? 'Not available'}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Last updated</span>
                  <strong>{formatDateTime(item.updatedAt)}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Payer</span>
                  <h3 className="panelTitle">Payer information</h3>
                </div>
              </div>
              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Name</span>
                  <strong>{item.payer.name?.trim() || item.payer.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Email</span>
                  <strong className="truncate">{item.payer.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Phone</span>
                  <strong>{item.payer.phone?.trim() || 'Not provided'}</strong>
                </div>
              </div>
            </section>
          </div>

          {item.booking ? (
            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Booking</span>
                  <h3 className="panelTitle">Related reservation</h3>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => navigate(`/bookings/${item.booking!.id}`)}
                >
                  View booking
                </button>
              </div>
              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Listing</span>
                  <strong>{item.listing?.title ?? item.booking.listing.title}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Stay</span>
                  <strong>
                    {formatDate(item.booking.startDate)} → {formatDate(item.booking.endDate)}
                  </strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Booking status</span>
                  <Badge tone={bookingStatusTone(item.booking.status)}>{item.booking.status.replace('_', ' ')}</Badge>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Booking total</span>
                  <strong>{formatMoney('NGN', item.booking.total)}</strong>
                </div>
              </div>
            </section>
          ) : item.listing ? (
            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Listing</span>
                  <h3 className="panelTitle">Related listing</h3>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => navigate(`/listings/${item.listing!.id}`)}
                >
                  View listing
                </button>
              </div>
              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Title</span>
                  <strong>{item.listing.title}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Location</span>
                  <strong>{item.listing.location}</strong>
                </div>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
