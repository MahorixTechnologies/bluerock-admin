import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiFetch,
  Badge,
  bookingStatusTone,
  EmptyRow,
  ErrorBanner,
  formatDate,
  formatMoney,
  Icon,
  Pagination,
  paymentTone,
  SearchField,
  useAdminResource,
  usePagedItems,
  type AdminBooking,
  type Session,
} from '../../lib/adminCore';

export default function BookingsView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const loader = useCallback(async () => {
    return await apiFetch<AdminBooking[]>(apiUrl, session.accessToken, '/admin/bookings');
  }, [apiUrl, session.accessToken]);

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
