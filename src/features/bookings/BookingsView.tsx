import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiFetch,
  Badge,
  bookingStatusTone,
  buildQuery,
  emptyPagedResult,
  EmptyRow,
  ErrorBanner,
  formatDate,
  formatMoney,
  Icon,
  Pagination,
  paymentTone,
  useAdminResource,
  type AdminBooking,
  type PagedResult,
  type Session,
} from '../../lib/adminCore';

const PAGE_SIZE = 20;
const STATUS_FILTERS: (AdminBooking['status'] | 'ALL')[] = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
];
const PAYMENT_FILTERS: (AdminBooking['paymentStatus'] | 'ALL')[] = [
  'ALL',
  'UNPAID',
  'PAID',
  'REFUND_PENDING',
  'REFUNDED',
];

export default function BookingsView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AdminBooking['status'] | 'ALL'>('ALL');
  const [paymentStatus, setPaymentStatus] = useState<AdminBooking['paymentStatus'] | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [status, paymentStatus]);

  const loader = useCallback(async () => {
    const qs = buildQuery({
      status: status === 'ALL' ? undefined : status,
      paymentStatus: paymentStatus === 'ALL' ? undefined : paymentStatus,
      page,
      pageSize: PAGE_SIZE,
    });
    return await apiFetch<PagedResult<AdminBooking>>(apiUrl, session.accessToken, `/admin/bookings${qs}`);
  }, [apiUrl, session.accessToken, status, paymentStatus, page]);

  const { data: result, loading, error, reload } = useAdminResource<PagedResult<AdminBooking>>(
    loader,
    emptyPagedResult(PAGE_SIZE),
  );

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${result.total} ${result.total === 1 ? 'booking' : 'bookings'}`}
        </span>
        <div className="toolbarActions">
          <div className="segmented">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                className={`segmented__item ${status === s ? 'segmented__item--active' : ''}`}
                onClick={() => setStatus(s)}
              >
                {s === 'ALL' ? 'All statuses' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="segmented">
            {PAYMENT_FILTERS.map((p) => (
              <button
                key={p}
                type="button"
                className={`segmented__item ${paymentStatus === p ? 'segmented__item--active' : ''}`}
                onClick={() => setPaymentStatus(p)}
              >
                {p === 'ALL' ? 'All payments' : p.replace('_', ' ')}
              </button>
            ))}
          </div>
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
              ) : result.data.length === 0 ? (
                <EmptyRow span={8} label="No bookings found." />
              ) : (
                result.data.map((b) => (
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
                      <Badge tone={bookingStatusTone(b.status)}>{b.status.replace('_', ' ')}</Badge>
                    </td>
                    <td>
                      <Badge tone={paymentTone(b.paymentStatus)}>{b.paymentStatus.replace('_', ' ')}</Badge>
                    </td>
                    <td className="cellMuted">{formatDate(b.createdAt)}</td>
                    <td className="colActions">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate(`/bookings/${b.id}`)}>
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
