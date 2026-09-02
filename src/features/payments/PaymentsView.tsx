import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiFetch,
  Badge,
  buildQuery,
  emptyPagedResult,
  EmptyRow,
  ErrorBanner,
  formatDateTime,
  formatMoney,
  Icon,
  Pagination,
  paymentTxTone,
  SearchField,
  useAdminResource,
  useDebouncedValue,
  type AdminPayment,
  type PagedResult,
  type PaymentPurpose,
  type PaymentTxStatus,
  type Session,
} from '../../lib/adminCore';

const PAGE_SIZE = 20;
const STATUS_FILTERS: (PaymentTxStatus | 'ALL')[] = ['ALL', 'INITIATED', 'SUCCESSFUL', 'FAILED', 'REFUNDED'];
const PURPOSE_FILTERS: (PaymentPurpose | 'ALL')[] = ['ALL', 'BOOKING', 'FEATURED_LISTING'];

export default function PaymentsView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [status, setStatus] = useState<PaymentTxStatus | 'ALL'>('ALL');
  const [purpose, setPurpose] = useState<PaymentPurpose | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status, purpose]);

  const loader = useCallback(async () => {
    const qs = buildQuery({
      status: status === 'ALL' ? undefined : status,
      purpose: purpose === 'ALL' ? undefined : purpose,
      search: debouncedQuery.trim() || undefined,
      page,
      pageSize: PAGE_SIZE,
    });
    return await apiFetch<PagedResult<AdminPayment>>(apiUrl, session.accessToken, `/admin/payments${qs}`);
  }, [apiUrl, session.accessToken, status, purpose, debouncedQuery, page]);

  const { data: result, loading, error, reload } = useAdminResource<PagedResult<AdminPayment>>(
    loader,
    emptyPagedResult(PAGE_SIZE),
  );

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${result.total} ${result.total === 1 ? 'payment' : 'payments'}`}
        </span>
        <div className="toolbarActions">
          <SearchField value={query} onChange={setQuery} placeholder="Search reference, transaction id…" />
          <div className="segmented">
            {PURPOSE_FILTERS.map((p) => (
              <button
                key={p}
                type="button"
                className={`segmented__item ${purpose === p ? 'segmented__item--active' : ''}`}
                onClick={() => setPurpose(p)}
              >
                {p === 'ALL' ? 'All purposes' : p.replace('_', ' ')}
              </button>
            ))}
          </div>
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
                <th>Reference</th>
                <th>Payer</th>
                <th>Purpose</th>
                <th>Amount</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Created</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow span={8} label="Loading payments…" />
              ) : result.data.length === 0 ? (
                <EmptyRow span={8} label="No payments found." />
              ) : (
                result.data.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{p.reference}</span>
                        <span className="cellUserSub">{p.providerTransactionId ?? 'No transaction id'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{p.payer.name?.trim() || p.payer.email}</span>
                        <span className="cellUserSub">{p.payer.email}</span>
                      </div>
                    </td>
                    <td className="cellMuted">{p.purpose.replace('_', ' ')}</td>
                    <td className="cellStrong">{formatMoney(p.currency, p.amount)}</td>
                    <td className="cellMuted">{p.provider}</td>
                    <td>
                      <Badge tone={paymentTxTone(p.status)}>{p.status}</Badge>
                    </td>
                    <td className="cellMuted">{formatDateTime(p.createdAt)}</td>
                    <td className="colActions">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate(`/payments/${p.id}`)}>
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
