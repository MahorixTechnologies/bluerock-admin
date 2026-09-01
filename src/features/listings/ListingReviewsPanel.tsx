import { useCallback, useState } from 'react';
import {
  apiFetch,
  Badge,
  ErrorBanner,
  formatDate,
  Icon,
  reviewStatusTone,
  useAdminResource,
  type AdminReview,
  type Session,
} from '../../lib/adminCore';

export default function ListingReviewsPanel({
  apiUrl,
  session,
  listingId,
}: {
  apiUrl: string;
  session: Session;
  listingId: string;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loader = useCallback(async () => {
    return await apiFetch<AdminReview[]>(apiUrl, session.accessToken, `/listings/${listingId}/reviews`);
  }, [apiUrl, listingId, session.accessToken]);

  const { data: reviews, setData: setReviews, loading, error, reload } = useAdminResource<AdminReview[]>(
    loader,
    [],
  );

  const moderate = async (reviewId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionError(null);
    setBusyId(reviewId);
    try {
      await apiFetch(apiUrl, session.accessToken, `/admin/reviews/${reviewId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      // Applied optimistically rather than refetched: the public reviews
      // endpoint excludes REJECTED reviews, so a refetch after flagging one
      // would make it disappear and couldn't be unflagged from this list.
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, moderationStatus: status } : r)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update review');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <span className="panelEyebrow">Reviews</span>
          <h3 className="panelTitle">Guest feedback and moderation</h3>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void reload()}>
          <Icon name="refresh" size={14} />
          Refresh
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {actionError ? <ErrorBanner message={actionError} /> : null}

      <div className="detailFeed">
        {loading ? (
          <div className="feedEmpty">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="feedEmpty">No reviews for this listing yet.</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="feedCard">
              <div className="feedCardTop">
                <strong>
                  {review.renter?.name?.trim() || 'Renter'} · {review.rating}/5
                  <Icon name="star" size={14} />
                </strong>
                <Badge tone={reviewStatusTone(review.moderationStatus)}>{review.moderationStatus}</Badge>
              </div>
              <span className="feedMeta">{review.body}</span>
              {review.ownerResponse ? (
                <span className="feedMeta">Owner response: {review.ownerResponse}</span>
              ) : null}
              <span className="feedMeta">{formatDate(review.createdAt)}</span>
              <div className="actionCluster">
                {review.moderationStatus === 'REJECTED' ? (
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    disabled={busyId === review.id}
                    onClick={() => void moderate(review.id, 'APPROVED')}
                  >
                    <Icon name="check" size={14} />
                    Unflag
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    disabled={busyId === review.id}
                    onClick={() => void moderate(review.id, 'REJECTED')}
                  >
                    <Icon name="flag" size={14} />
                    Flag
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
