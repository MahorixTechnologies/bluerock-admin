import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiFetch,
  Badge,
  buildQuery,
  emptyPagedResult,
  EmptyRow,
  ErrorBanner,
  formatDate,
  formatMoney,
  Icon,
  listingStatusTone,
  Pagination,
  SearchField,
  useAdminResource,
  useDebouncedValue,
  type AdminListing,
  type ListingStatus,
  type PagedResult,
  type Session,
} from '../../lib/adminCore';

const PAGE_SIZE = 20;
const STATUS_FILTERS: (ListingStatus | 'ALL')[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'];

export default function ListingsView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [status, setStatus] = useState<ListingStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status]);

  const loader = useCallback(async () => {
    const qs = buildQuery({
      status: status === 'ALL' ? undefined : status,
      search: debouncedQuery.trim() || undefined,
      page,
      pageSize: PAGE_SIZE,
    });
    return await apiFetch<PagedResult<AdminListing>>(apiUrl, session.accessToken, `/admin/listings${qs}`);
  }, [apiUrl, session.accessToken, status, debouncedQuery, page]);

  const { data: result, setData: setResult, loading, error, setError, reload } = useAdminResource<
    PagedResult<AdminListing>
  >(loader, emptyPagedResult(PAGE_SIZE));

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const setListingStatus = async (listingId: string, next: 'APPROVED' | 'REJECTED') => {
    setError(null);
    try {
      const data = await apiFetch<AdminListing>(
        apiUrl,
        session.accessToken,
        `/listings/${listingId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        },
      );
      setResult((prev) => ({
        ...prev,
        data: prev.data.map((l) => (l.id === data.id ? { ...l, status: data.status } : l)),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${result.total} ${result.total === 1 ? 'listing' : 'listings'}`}
        </span>
        <div className="toolbarActions">
          <SearchField value={query} onChange={setQuery} placeholder="Search title, location…" />
          <div className="segmented">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                className={`segmented__item ${status === s ? 'segmented__item--active' : ''}`}
                onClick={() => setStatus(s)}
              >
                {s === 'ALL' ? 'All statuses' : s}
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
              ) : result.data.length === 0 ? (
                <EmptyRow span={8} label="No listings found." />
              ) : (
                result.data.map((l) => (
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
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate(`/listings/${l.id}`)}>
                          View
                        </button>
                        {l.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              className="btn btn--soft btn--sm"
                              onClick={() => void setListingStatus(l.id, 'APPROVED')}
                            >
                              <Icon name="check" size={14} />
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => void setListingStatus(l.id, 'REJECTED')}
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
