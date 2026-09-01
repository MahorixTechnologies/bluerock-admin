import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiFetch,
  Badge,
  EmptyRow,
  ErrorBanner,
  formatDate,
  Icon,
  initialsFor,
  Pagination,
  SearchField,
  useAdminResource,
  usePagedItems,
  userStatusTone,
  type AdminUser,
  type Session,
  type UserStatus,
} from '../../lib/adminCore';

export default function UsersView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const loader = useCallback(async () => {
    return await apiFetch<AdminUser[]>(apiUrl, session.accessToken, '/admin/users');
  }, [apiUrl, session.accessToken]);

  const { data: items, setData: setItems, loading, error, setError, reload } = useAdminResource<AdminUser[]>(
    loader,
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => {
      return (
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const { page, setPage, totalPages, pageItems } = usePagedItems(filtered);

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
      setItems((prev) => prev.map((u) => (u.id === data.id ? { ...u, status: data.status } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'user' : 'users'}`}
        </span>
        <div className="toolbarActions">
          <SearchField value={query} onChange={setQuery} placeholder="Search email, role, status…" />
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
              ) : pageItems.length === 0 ? (
                <EmptyRow span={6} label="No users found." />
              ) : (
                pageItems.map((u) => (
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
