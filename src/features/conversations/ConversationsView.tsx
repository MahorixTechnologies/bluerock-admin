import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiFetch,
  buildQuery,
  emptyPagedResult,
  EmptyRow,
  ErrorBanner,
  formatDateTime,
  Icon,
  Pagination,
  useAdminResource,
  type AdminConversation,
  type PagedResult,
  type Session,
} from '../../lib/adminCore';

const PAGE_SIZE = 20;

export default function ConversationsView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const loader = useCallback(async () => {
    const qs = buildQuery({ page, pageSize: PAGE_SIZE });
    return await apiFetch<PagedResult<AdminConversation>>(apiUrl, session.accessToken, `/admin/conversations${qs}`);
  }, [apiUrl, session.accessToken, page]);

  const { data: result, loading, error, reload } = useAdminResource<PagedResult<AdminConversation>>(
    loader,
    emptyPagedResult(PAGE_SIZE),
  );

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${result.total} ${result.total === 1 ? 'conversation' : 'conversations'}`}
        </span>
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
                <th>Participants</th>
                <th>Context</th>
                <th>Latest message</th>
                <th>Messages</th>
                <th>Last activity</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow span={6} label="Loading conversations…" />
              ) : result.data.length === 0 ? (
                <EmptyRow span={6} label="No conversations found." />
              ) : (
                result.data.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{c.renter.name?.trim() || c.renter.email}</span>
                        <span className="cellUserSub">renter · {c.renter.email}</span>
                        <span className="cellUserName">{c.owner.name?.trim() || c.owner.email}</span>
                        <span className="cellUserSub">owner · {c.owner.email}</span>
                      </div>
                    </td>
                    <td className="cellMuted">{c.listing?.title ?? (c.bookingId ? 'Booking thread' : '—')}</td>
                    <td className="cellMuted truncate">
                      {c.latestMessage ? c.latestMessage.body : 'No messages yet'}
                    </td>
                    <td className="cellMuted">{c._count.messages}</td>
                    <td className="cellMuted">{formatDateTime(c.updatedAt)}</td>
                    <td className="colActions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => navigate(`/conversations/${c.id}`, { state: { conversation: c } })}
                      >
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
