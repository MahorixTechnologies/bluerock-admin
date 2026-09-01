import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  apiFetch,
  Badge,
  ErrorBanner,
  formatDate,
  formatMoney,
  Icon,
  listingStatusTone,
  type AdminListing,
  type Session,
} from '../../lib/adminCore';
import ListingReviewsPanel from './ListingReviewsPanel';

export default function ListingDetailView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const { listingId = '' } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate('/listings');
  const [item, setItem] = useState<AdminListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminListing[]>(apiUrl, session.accessToken, '/admin/listings');
      const detail = data.find((listing) => listing.id === listingId) ?? null;
      if (!detail) throw new Error('Listing not found');
      setItem(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listing');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, listingId, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!item) return;
    setError(null);
    try {
      const data = await apiFetch<AdminListing>(
        apiUrl,
        session.accessToken,
        `/listings/${item.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      setItem((prev) => (prev ? { ...prev, status: data.status } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  const setFeatured = async (featured: boolean) => {
    if (!item) return;
    setError(null);
    try {
      const data = await apiFetch<AdminListing>(
        apiUrl,
        session.accessToken,
        `/listings/${item.id}/featured`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured }),
        },
      );
      setItem((prev) => (prev ? { ...prev, featured: data.featured, featuredUntil: data.featuredUntil } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbarActions">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            <Icon name="chevron" size={16} />
            Back to Listings
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading && !item ? (
        <div className="panel userDetailEmpty">Loading listing details…</div>
      ) : !item ? (
        <div className="panel userDetailEmpty">Listing not found.</div>
      ) : (
        <>
          <section className="userHero">
            <div className="userHeroIdentity">
              <span className="avatar userHeroAvatar">{item.title.slice(0, 2).toUpperCase()}</span>
              <div className="userHeroText">
                <span className="panelEyebrow">Property details</span>
                <h2 className="userHeroTitle">{item.title}</h2>
                <p className="userHeroSubtitle">{item.location}</p>
              </div>
            </div>

            <div className="userHeroActions">
              <Badge tone={listingStatusTone(item.status)}>{item.status}</Badge>
              <span className="roleTag">{item.type}</span>
              {item.featured ? (
                <Badge tone="info">
                  Featured{item.featuredUntil ? ` · until ${formatDate(item.featuredUntil)}` : ''}
                </Badge>
              ) : null}
              {item.status === 'PENDING' ? (
                <>
                  <button type="button" className="btn btn--soft" onClick={() => void setStatus('APPROVED')}>
                    Approve Listing
                  </button>
                  <button type="button" className="btn btn--danger" onClick={() => void setStatus('REJECTED')}>
                    Reject Listing
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void setFeatured(!item.featured)}
              >
                {item.featured ? 'Remove from Featured Homes' : 'Add to Featured Homes'}
              </button>
            </div>
          </section>

          <div className="statGrid">
            <div className="statCard statCard--brand">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="wallet" size={18} />
                </span>
                <span className="statLabel">Price per Night</span>
              </div>
              <div className="statValue">{formatMoney(item.currency, item.pricePerNight)}</div>
            </div>
            <div className="statCard statCard--violet">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="home" size={18} />
                </span>
                <span className="statLabel">Rooms</span>
              </div>
              <div className="statValue">{item.rooms}</div>
            </div>
            <div className="statCard statCard--amber">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="activity" size={18} />
                </span>
                <span className="statLabel">Bathrooms</span>
              </div>
              <div className="statValue">{item.bathrooms}</div>
            </div>
            <div className="statCard statCard--emerald">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="calendar" size={18} />
                </span>
                <span className="statLabel">Created</span>
              </div>
              <div className="statValue detailValueSm">{formatDate(item.createdAt)}</div>
            </div>
          </div>

          <div className="userDetailGrid userDetailGrid--two">
            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Overview</span>
                  <h3 className="panelTitle">Property summary</h3>
                </div>
              </div>
              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Owner</span>
                  <strong>{item.owner.name?.trim() || item.owner.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Owner email</span>
                  <strong className="truncate">{item.owner.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Phone</span>
                  <strong>{item.owner.phone?.trim() || 'Not provided'}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Description</span>
                  <strong className="detailParagraph">{item.description}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Amenities and rules</span>
                  <h3 className="panelTitle">What guests should know</h3>
                </div>
              </div>
              <div className="chipGroup">
                {item.amenities.map((amenity) => (
                  <span key={amenity} className="miniChip">
                    {amenity}
                  </span>
                ))}
              </div>
              <div className="detailFeed detailFeed--tight">
                {item.rules.map((rule) => (
                  <div key={rule} className="feedCard">
                    <span className="feedMeta">{rule}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <ListingReviewsPanel apiUrl={apiUrl} session={session} listingId={item.id} />
        </>
      )}
    </div>
  );
}
