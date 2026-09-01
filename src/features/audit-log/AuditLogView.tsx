import { useCallback } from 'react';
import {
  apiFetch,
  ErrorBanner,
  formatDateTime,
  Icon,
  useAdminResource,
  usePagedItems,
  Pagination,
  type AdminAuditLog,
  type Session,
} from '../../lib/adminCore';

function describeTarget(entry: AdminAuditLog) {
  return `${entry.targetType} · ${entry.targetId.slice(0, 8)}`;
}

function describeMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return null;
  try {
    return JSON.stringify(metadata);
  } catch {
    return null;
  }
}

export default function AuditLogView({ apiUrl, session }: { apiUrl: string; session: Session }) {
  const loader = useCallback(async () => {
    return await apiFetch<AdminAuditLog[]>(apiUrl, session.accessToken, '/admin/audit-logs?limit=50');
  }, [apiUrl, session.accessToken]);

  const { data: items, loading, error, reload } = useAdminResource<AdminAuditLog[]>(loader, []);
  const { page, setPage, totalPages, pageItems } = usePagedItems(items);

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">{loading ? 'Loading…' : `${items.length} recent actions`}</span>
        <div className="toolbarActions">
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
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="tableEmpty">Loading audit log…</div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="tableEmpty">No audit log entries yet.</div>
                  </td>
                </tr>
              ) : (
                pageItems.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{entry.actor.name?.trim() || entry.actor.email}</span>
                        <span className="cellUserSub">
                          {entry.actor.email} · {entry.actor.role}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="roleTag">{entry.action}</span>
                    </td>
                    <td className="cellMuted">{describeTarget(entry)}</td>
                    <td className="cellMuted truncate">{describeMetadata(entry.metadata) ?? '—'}</td>
                    <td className="cellMuted">{formatDateTime(entry.createdAt)}</td>
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
