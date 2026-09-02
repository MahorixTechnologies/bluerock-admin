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
  Icon,
  initialsFor,
  Pagination,
  SearchField,
  useAdminResource,
  useDebouncedValue,
  userStatusTone,
  type AdminUser,
  type PagedResult,
  type Session,
  type UserRole,
  type UserStatus,
} from '../../lib/adminCore';

const PAGE_SIZE = 20;
const ROLE_FILTERS: (UserRole | 'ALL')[] = ['ALL', 'RENTER', 'LANDLORD', 'ADMIN'];
const STATUS_FILTERS: (UserStatus | 'ALL')[] = ['ALL', 'ACTIVE', 'SUSPENDED'];

export default function UsersView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [role, setRole] = useState<UserRole | 'ALL'>('ALL');
  const [status, setStatus] = useState<UserStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, role, status]);

  const loader = useCallback(async () => {
    const qs = buildQuery({
      role: role === 'ALL' ? undefined : role,
      status: status === 'ALL' ? undefined : status,
      search: debouncedQuery.trim() || undefined,
      page,
      pageSize: PAGE_SIZE,
    });
    return await apiFetch<PagedResult<AdminUser>>(apiUrl, session.accessToken, `/admin/users${qs}`);
  }, [apiUrl, session.accessToken, role, status, debouncedQuery, page]);

  const { data: result, setData: setResult, loading, error, setError, reload } = useAdminResource<
    PagedResult<AdminUser>
  >(loader, emptyPagedResult(PAGE_SIZE));

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const updateStatus = async (userId: string, next: UserStatus) => {
    setError(null);
    try {
      const data = await apiFetch<{ id: string; email: string; status: UserStatus }>(
        apiUrl,
        session.accessToken,
        `/admin/users/${userId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        },
      );
      setResult((prev) => ({
        ...prev,
        data: prev.data.map((u) => (u.id === data.id ? { ...u, status: data.status } : u)),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${result.total} ${result.total === 1 ? 'user' : 'users'}`}
        </span>
        <div className="toolbarActions">
          <SearchField value={query} onChange={setQuery} placeholder="Search email, name, phone…" />
          <div className="segmented">
            {ROLE_FILTERS.map((r) => (
              <button
                key={r}
                type="button"
                className={`segmented__item ${role === r ? 'segmented__item--active' : ''}`}
                onClick={() => setRole(r)}
              >
                {r === 'ALL' ? 'All roles' : r}
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
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Joined</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow span={6} label="Loading users…" />
              ) : result.data.length === 0 ? (
                <EmptyRow span={6} label="No users found." />
              ) : (
                result.data.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="cellUser">
                        <span className="avatar avatar--sm">{initialsFor(u.name, u.email)}</span>
                        <div className="cellUserText">
                          <span className="cellUserName">{u.name?.trim() || u.email}</span>
                          <span className="cellUserSub">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="roleTag">{u.role}</span>
                    </td>
                    <td>
                      <Badge tone={userStatusTone(u.status)}>{u.status}</Badge>
                    </td>
                    <td>
                      {u.emailVerified ? (
                        <span className="verified verified--yes">
                          <Icon name="check" size={14} /> Verified
                        </span>
                      ) : (
                        <span className="verified verified--no">Unverified</span>
                      )}
                    </td>
                    <td className="cellMuted">{formatDate(u.createdAt)}</td>
                    <td className="colActions">
                      <div className="actionCluster">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate(`/users/${u.id}`)}>
                          View
                        </button>
                        {u.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={() => void updateStatus(u.id, 'SUSPENDED')}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--soft btn--sm"
                            onClick={() => void updateStatus(u.id, 'ACTIVE')}
                          >
                            Activate
                          </button>
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
