import { useCallback, useState } from 'react';
import {
  apiFetch,
  buildQuery,
  emptyPagedResult,
  ErrorBanner,
  formatDateTime,
  Icon,
  Pagination,
  useAdminResource,
  type AdminAuditLog,
  type PagedResult,
  type Session,
} from '../../lib/adminCore';

const PAGE_SIZE = 20;

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
  const [page, setPage] = useState(1);

  const loader = useCallback(async () => {
    const qs = buildQuery({ page, pageSize: PAGE_SIZE });
    return await apiFetch<PagedResult<AdminAuditLog>>(apiUrl, session.accessToken, `/admin/audit-logs${qs}`);
  }, [apiUrl, session.accessToken, page]);

  const { data: result, loading, error, reload } = useAdminResource<PagedResult<AdminAuditLog>>(
    loader,
    emptyPagedResult(PAGE_SIZE),
  );

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">{loading ? 'Loading…' : `${result.total} recent actions`}</span>
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
              ) : result.data.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="tableEmpty">No audit log entries yet.</div>
                  </td>
                </tr>
              ) : (
                result.data.map((entry) => (
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
