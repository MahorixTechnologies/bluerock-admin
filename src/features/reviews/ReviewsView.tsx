import { useCallback, useEffect, useState } from 'react';
import {
  apiFetch,
  Badge,
  buildQuery,
  emptyPagedResult,
  EmptyRow,
  ErrorBanner,
  formatDate,
  Icon,
  Pagination,
  reviewStatusTone,
  useAdminResource,
  type AdminReviewWithListing,
  type PagedResult,
  type ReviewModerationStatus,
  type Session,
} from '../../lib/adminCore';

const PAGE_SIZE = 20;
const STATUS_FILTERS: (ReviewModerationStatus | 'ALL')[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export default function ReviewsView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const [status, setStatus] = useState<ReviewModerationStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const loader = useCallback(async () => {
    const qs = buildQuery({ status: status === 'ALL' ? undefined : status, page, pageSize: PAGE_SIZE });
    return await apiFetch<PagedResult<AdminReviewWithListing>>(apiUrl, session.accessToken, `/admin/reviews${qs}`);
  }, [apiUrl, session.accessToken, status, page]);

  const { data: result, setData: setResult, loading, error, reload } = useAdminResource<
    PagedResult<AdminReviewWithListing>
  >(loader, emptyPagedResult(PAGE_SIZE));

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const moderate = async (reviewId: string, next: 'APPROVED' | 'REJECTED') => {
    setActionError(null);
    setBusyId(reviewId);
    try {
      await apiFetch(apiUrl, session.accessToken, `/admin/reviews/${reviewId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      setResult((prev) => ({
        ...prev,
        data: prev.data.map((r) => (r.id === reviewId ? { ...r, moderationStatus: next } : r)),
      }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update review');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${result.total} ${result.total === 1 ? 'review' : 'reviews'}`}
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
                <th>Listing</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Status</th>
                <th>Posted</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow span={7} label="Loading reviews…" />
              ) : result.data.length === 0 ? (
                <EmptyRow span={7} label="No reviews found." />
              ) : (
                result.data.map((review) => (
                  <tr key={review.id}>
                    <td className="cellUserName">{review.listing.title}</td>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{review.renter.name?.trim() || review.renter.email}</span>
                        <span className="cellUserSub">{review.renter.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cellUserSub">
                        {review.rating}/5 <Icon name="star" size={12} />
                      </span>
                    </td>
                    <td className="cellMuted truncate">{review.body}</td>
                    <td>
                      <Badge tone={reviewStatusTone(review.moderationStatus)}>{review.moderationStatus}</Badge>
                    </td>
                    <td className="cellMuted">{formatDate(review.createdAt)}</td>
                    <td className="colActions">
                      <div className="actionCluster">
                        {review.moderationStatus !== 'APPROVED' ? (
                          <button
                            type="button"
                            className="btn btn--soft btn--sm"
                            disabled={busyId === review.id}
                            onClick={() => void moderate(review.id, 'APPROVED')}
                          >
                            <Icon name="check" size={14} />
                            Approve
                          </button>
                        ) : null}
                        {review.moderationStatus !== 'REJECTED' ? (
                          <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            disabled={busyId === review.id}
                            onClick={() => void moderate(review.id, 'REJECTED')}
                          >
                            <Icon name="flag" size={14} />
                            Reject
                          </button>
                        ) : null}
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
