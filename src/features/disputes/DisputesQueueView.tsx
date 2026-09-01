import { useCallback, useState } from 'react';
import {
  apiFetch,
  Badge,
  bookingStatusTone,
  disputeStatusTone,
  ErrorBanner,
  formatDate,
  formatDateTime,
  formatMoney,
  Icon,
  useAdminResource,
  usePagedItems,
  Pagination,
  type AdminDispute,
  type DisputeStatus,
  type Session,
} from '../../lib/adminCore';

const STATUS_FILTERS: DisputeStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];

const DECISIONS: { status: DisputeStatus; label: string; icon: 'check' | 'x' | 'activity'; tone: 'soft' | 'danger' | 'ghost' }[] = [
  { status: 'RESOLVED', label: 'Resolve', icon: 'check', tone: 'soft' },
  { status: 'REJECTED', label: 'Reject', icon: 'x', tone: 'danger' },
  { status: 'UNDER_REVIEW', label: 'Under Review', icon: 'activity', tone: 'ghost' },
];

export default function DisputesQueueView({ apiUrl, session }: { apiUrl: string; session: Session }) {
  const [statusFilter, setStatusFilter] = useState<DisputeStatus>('OPEN');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const loader = useCallback(async () => {
    return await apiFetch<AdminDispute[]>(apiUrl, session.accessToken, `/admin/disputes?status=${statusFilter}`);
  }, [apiUrl, session.accessToken, statusFilter]);

  const { data: items, setData: setItems, loading, error, reload } = useAdminResource<AdminDispute[]>(loader, []);
  const { page, setPage, totalPages, pageItems } = usePagedItems(items);

  const decide = async (dispute: AdminDispute, status: DisputeStatus) => {
    setActionError(null);
    setBusyId(dispute.id);
    const resolutionNotes = noteDrafts[dispute.id]?.trim() || undefined;
    try {
      await apiFetch(apiUrl, session.accessToken, `/admin/disputes/${dispute.id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolutionNotes }),
      });
      setItems((prev) => prev.filter((item) => item.id !== dispute.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update dispute');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading
            ? 'Loading…'
            : `${items.length} ${statusFilter.toLowerCase().replace('_', ' ')} ${items.length === 1 ? 'dispute' : 'disputes'}`}
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
                {status.replace('_', ' ')}
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
                <th>Booking</th>
                <th>Raised by</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="tableEmpty">Loading disputes…</div>
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="tableEmpty">No {statusFilter.toLowerCase().replace('_', ' ')} disputes.</div>
                  </td>
                </tr>
              ) : (
                pageItems.map((dispute) => (
                  <tr key={dispute.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{dispute.booking.listing.title}</span>
                        <span className="cellUserSub">
                          {dispute.booking.listing.location} · {formatDate(dispute.booking.startDate)}–
                          {formatDate(dispute.booking.endDate)}
                        </span>
                        <span className="cellUserSub">
                          <Badge tone={bookingStatusTone(dispute.booking.status)}>{dispute.booking.status}</Badge>
                          {formatMoney('NGN', dispute.booking.total)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{dispute.raisedBy.name?.trim() || dispute.raisedBy.email}</span>
                        <span className="cellUserSub">
                          {dispute.raisedBy.email} · {dispute.raisedBy.role}
                        </span>
                      </div>
                    </td>
                    <td>{dispute.reason}</td>
                    <td>
                      <Badge tone={disputeStatusTone(dispute.status)}>{dispute.status.replace('_', ' ')}</Badge>
                      {dispute.decidedAt ? (
                        <div className="cellUserSub" style={{ marginTop: 4 }}>
                          {formatDateTime(dispute.decidedAt)}
                        </div>
                      ) : null}
                      {dispute.resolutionNotes ? (
                        <div className="cellUserSub" style={{ marginTop: 2 }}>
                          &ldquo;{dispute.resolutionNotes}&rdquo;
                        </div>
                      ) : null}
                    </td>
                    <td className="colActions">
                      <div className="actionCluster actionCluster--stacked">
                        <input
                          className="textInput textInput--sm"
                          placeholder="Resolution notes (optional)"
                          value={noteDrafts[dispute.id] ?? ''}
                          onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [dispute.id]: e.target.value }))}
                        />
                        <div className="actionCluster">
                          {DECISIONS.filter((d) => d.status !== dispute.status).map((d) => (
                            <button
                              key={d.status}
                              type="button"
                              className={`btn btn--${d.tone} btn--sm`}
                              disabled={busyId === dispute.id}
                              onClick={() => void decide(dispute, d.status)}
                            >
                              <Icon name={d.icon} size={14} />
                              {d.label}
                            </button>
                          ))}
                        </div>
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
