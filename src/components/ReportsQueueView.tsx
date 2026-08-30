import { useCallback, useState } from 'react';
import {
  apiFetch,
  Badge,
  cloneData,
  demoReports,
  ErrorBanner,
  formatDateTime,
  Icon,
  isDemoSession,
  reportStatusTone,
  useAdminResource,
  usePagedItems,
  Pagination,
  type AdminReport,
  type ReportStatus,
  type Session,
} from '../lib/adminCore';

const STATUS_FILTERS: ReportStatus[] = ['OPEN', 'RESOLVED', 'DISMISSED'];

export default function ReportsQueueView({ apiUrl, session }: { apiUrl: string; session: Session }) {
  const demoMode = isDemoSession(session);
  const [statusFilter, setStatusFilter] = useState<ReportStatus>('OPEN');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const loader = useCallback(async () => {
    if (demoMode) return cloneData(demoReports).filter((item) => item.status === statusFilter);
    return await apiFetch<AdminReport[]>(apiUrl, session.accessToken, `/admin/reports?status=${statusFilter}`);
  }, [apiUrl, demoMode, session.accessToken, statusFilter]);

  const { data: items, setData: setItems, loading, error, reload } = useAdminResource<AdminReport[]>(loader, []);
  const { page, setPage, totalPages, pageItems } = usePagedItems(items);

  const decide = async (report: AdminReport, decision: 'RESOLVE' | 'DISMISS') => {
    setActionError(null);
    setBusyId(report.id);
    const note = noteDrafts[report.id]?.trim() || undefined;
    try {
      if (demoMode) {
        setItems((prev) => prev.filter((item) => item.id !== report.id));
        return;
      }
      await apiFetch(apiUrl, session.accessToken, `/admin/reports/${report.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });
      setItems((prev) => prev.filter((item) => item.id !== report.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update report');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${items.length} ${statusFilter.toLowerCase()} ${items.length === 1 ? 'report' : 'reports'}`}
        </span>
        <div className="toolbarActions">
          <div className="segmented">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                className={`segmented__item ${statusFilter === status ? 'segmented__item--active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
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
      {actionError ? <ErrorBanner message={actionError} /> : null}

      <div className="tableCard">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Details</th>
                <th>Status</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="tableEmpty">Loading reports…</div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="tableEmpty">No {statusFilter.toLowerCase()} reports.</div>
                  </td>
                </tr>
              ) : (
                pageItems.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{report.reporter.name?.trim() || report.reporter.email}</span>
                        <span className="cellUserSub">{report.reporter.email}</span>
                      </div>
                    </td>
                    <td className="cellMuted">
                      {report.targetType} · {report.targetId.slice(0, 8)}
                    </td>
                    <td>{report.reason}</td>
                    <td className="cellMuted truncate">{report.details || '—'}</td>
                    <td>
                      <Badge tone={reportStatusTone(report.status)}>{report.status}</Badge>
                      {report.status !== 'OPEN' && report.resolvedBy ? (
                        <div className="cellUserSub" style={{ marginTop: 4 }}>
                          by {report.resolvedBy.name?.trim() || report.resolvedBy.email}
                          {report.resolvedAt ? ` · ${formatDateTime(report.resolvedAt)}` : ''}
                        </div>
                      ) : null}
                      {report.resolutionNote ? (
                        <div className="cellUserSub" style={{ marginTop: 2 }}>
                          &ldquo;{report.resolutionNote}&rdquo;
                        </div>
                      ) : null}
                    </td>
                    <td className="colActions">
                      {report.status === 'OPEN' ? (
                        <div className="actionCluster actionCluster--stacked">
                          <input
                            className="textInput textInput--sm"
                            placeholder="Note (optional)"
                            value={noteDrafts[report.id] ?? ''}
                            onChange={(e) =>
                              setNoteDrafts((prev) => ({ ...prev, [report.id]: e.target.value }))
                            }
                          />
                          <div className="actionCluster">
                            <button
                              type="button"
                              className="btn btn--soft btn--sm"
                              disabled={busyId === report.id}
                              onClick={() => void decide(report, 'RESOLVE')}
                            >
                              <Icon name="check" size={14} />
                              Resolve
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              disabled={busyId === report.id}
                              onClick={() => void decide(report, 'DISMISS')}
                            >
                              <Icon name="x" size={14} />
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ) : null}
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
