import { useCallback, useState } from 'react';
import {
  apiFetch,
  Badge,
  buildQuery,
  EmptyRow,
  ErrorBanner,
  formatDateTime,
  formatMoney,
  Icon,
  Pagination,
  payoutTone,
  useAdminResource,
  usePagedItems,
  type AdminPayout,
  type PayoutStatus,
  type Session,
} from '../../lib/adminCore';

const STATUS_FILTERS: (PayoutStatus | 'ALL')[] = ['ALL', 'PENDING', 'PROCESSING', 'PAID', 'FAILED'];

export default function PayoutsView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const [status, setStatus] = useState<PayoutStatus | 'ALL'>('ALL');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loader = useCallback(async () => {
    const qs = buildQuery({ status: status === 'ALL' ? undefined : status });
    return await apiFetch<AdminPayout[]>(apiUrl, session.accessToken, `/payouts${qs}`);
  }, [apiUrl, session.accessToken, status]);

  const { data: items, setData: setItems, loading, error, reload } = useAdminResource<AdminPayout[]>(loader, []);
  const { page, setPage, totalPages, pageItems } = usePagedItems(items);

  const process = async (payout: AdminPayout) => {
    setActionError(null);
    setBusyId(payout.id);
    try {
      await apiFetch(apiUrl, session.accessToken, `/admin/payouts/${payout.id}/process`, { method: 'POST' });
      setItems((prev) => prev.map((p) => (p.id === payout.id ? { ...p, status: 'PROCESSING' } : p)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to process payout');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${items.length} ${items.length === 1 ? 'payout' : 'payouts'}`}
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
      {actionError ? <ErrorBanner message={actionError} /> : null}

      <div className="tableCard">
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Amount</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Created</th>
                <th>Paid</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow span={7} label="Loading payouts…" />
              ) : pageItems.length === 0 ? (
                <EmptyRow span={7} label="No payouts found." />
              ) : (
                pageItems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{p.owner.name?.trim() || p.owner.email}</span>
                        <span className="cellUserSub">{p.owner.email}</span>
                      </div>
                    </td>
                    <td className="cellStrong">{formatMoney(p.currency, p.amount)}</td>
                    <td className="cellMuted">{p.provider}</td>
                    <td>
                      <Badge tone={payoutTone(p.status)}>{p.status}</Badge>
                    </td>
                    <td className="cellMuted">{formatDateTime(p.createdAt)}</td>
                    <td className="cellMuted">{p.paidAt ? formatDateTime(p.paidAt) : '—'}</td>
                    <td className="colActions">
                      {p.status === 'PENDING' ? (
                        <button
                          type="button"
                          className="btn btn--soft btn--sm"
                          disabled={busyId === p.id}
                          onClick={() => void process(p)}
                        >
                          <Icon name="check" size={14} />
                          Process
                        </button>
                      ) : (
                        <span className="cellDash">—</span>
                      )}
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
