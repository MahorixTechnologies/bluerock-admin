import { useCallback, useEffect, useState } from 'react';
import {
  apiFetch,
  Badge,
  ErrorBanner,
  formatMoney,
  Icon,
  type AdminBooking,
  type Session,
} from '../../lib/adminCore';
import FeeRulesPanel from './FeeRulesPanel';

export default function IncomesView({ apiUrl, session }: { apiUrl: string; session: Session }) {
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serviceFeePercent, setServiceFeePercent] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminBooking[]>(apiUrl, session.accessToken, '/admin/bookings');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load income data');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, session.accessToken]);

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
