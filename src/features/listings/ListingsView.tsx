import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiFetch,
  Badge,
  EmptyRow,
  ErrorBanner,
  formatDate,
  formatMoney,
  Icon,
  listingStatusTone,
  Pagination,
  SearchField,
  useAdminResource,
  usePagedItems,
  type AdminListing,
  type Session,
} from '../../lib/adminCore';

export default function ListingsView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const loader = useCallback(async () => {
    return await apiFetch<AdminListing[]>(apiUrl, session.accessToken, '/admin/listings');
  }, [apiUrl, session.accessToken]);

  const { data: items, setData: setItems, loading, error, setError, reload } = useAdminResource<AdminListing[]>(
    loader,
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((l) => {
      if (featuredOnly && !l.featured) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        l.owner.email.toLowerCase().includes(q)
      );
    });
  }, [items, query, featuredOnly]);

  const { page, setPage, totalPages, pageItems } = usePagedItems(filtered);

  const setStatus = async (listingId: string, status: 'APPROVED' | 'REJECTED') => {
    setError(null);
    try {
      const data = await apiFetch<AdminListing>(
        apiUrl,
        session.accessToken,
        `/listings/${listingId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      setItems((prev) => prev.map((l) => (l.id === data.id ? { ...l, status: data.status } : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'listing' : 'listings'}`}
        </span>
        <div className="toolbarActions">
          <SearchField value={query} onChange={setQuery} placeholder="Search title, location, owner…" />
          <label className="checkboxField">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
            />
            Featured only
          </label>
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
              ) : pageItems.length === 0 ? (
                <EmptyRow span={8} label="No listings found." />
              ) : (
                pageItems.map((l) => (
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
                              onClick={() => void setStatus(l.id, 'APPROVED')}
                            >
                              <Icon name="check" size={14} />
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => void setStatus(l.id, 'REJECTED')}
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
