import { useCallback, useState } from 'react';
import {
  apiFetch,
  Badge,
  ErrorBanner,
  formatDate,
  Icon,
  ownerApplicationTone,
  useAdminResource,
  usePagedItems,
  Pagination,
  type AdminOwnerApplication,
  type Session,
} from '../../lib/adminCore';

export default function OwnerApplicationsView({ apiUrl, session }: { apiUrl: string; session: Session }) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loader = useCallback(async () => {
    return await apiFetch<AdminOwnerApplication[]>(
      apiUrl,
      session.accessToken,
      '/admin/owner-applications?status=PENDING',
    );
  }, [apiUrl, session.accessToken]);

  const { data: items, setData: setItems, loading, error, reload } = useAdminResource<AdminOwnerApplication[]>(
    loader,
    [],
  );

  const { page, setPage, totalPages, pageItems } = usePagedItems(items);

  const decide = async (userId: string, decision: 'APPROVE' | 'REJECT') => {
    setActionError(null);
    setBusyId(userId);
    try {
      await apiFetch(apiUrl, session.accessToken, `/admin/owner-applications/${userId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      setItems((prev) => prev.filter((item) => item.id !== userId));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update application');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${items.length} pending ${items.length === 1 ? 'application' : 'applications'}`}
        </span>
        <div className="toolbarActions">
          <button type="button" className="btn btn--ghost" onClick={() => void reload()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="calloutNote">
        <Icon name="shield" size={15} />
        <span>
          Approving flips the account to LANDLORD, but the user must log out and back in before landlord tools
          appear for them — the role is baked into their session token at login.
        </span>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {actionError ? <ErrorBanner message={actionError} /> : null}

      <div className="tableCard">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Applied</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="tableEmpty">Loading applications…</div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="tableEmpty">No pending owner applications.</div>
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{item.name?.trim() || item.email}</span>
                        <span className="cellUserSub">{item.email}</span>
                      </div>
                    </td>
                    <td className="cellMuted">{item.phone?.trim() || 'Not provided'}</td>
                    <td>
                      <Badge tone={ownerApplicationTone(item.ownerApplicationStatus)}>
                        {item.ownerApplicationStatus}
                      </Badge>
                    </td>
                    <td className="cellMuted">
                      {item.ownerApplicationAt ? formatDate(item.ownerApplicationAt) : '—'}
                    </td>
                    <td className="colActions">
                      <div className="actionCluster">
                        <button
                          type="button"
                          className="btn btn--soft btn--sm"
                          disabled={busyId === item.id}
                          onClick={() => void decide(item.id, 'APPROVE')}
                        >
                          <Icon name="check" size={14} />
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          disabled={busyId === item.id}
                          onClick={() => void decide(item.id, 'REJECT')}
                        >
                          <Icon name="x" size={14} />
                          Reject
                        </button>
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
