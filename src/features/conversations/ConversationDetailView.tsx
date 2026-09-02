import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  apiFetch,
  ErrorBanner,
  formatDateTime,
  Icon,
  type AdminConversation,
  type AdminMessage,
  type Session,
} from '../../lib/adminCore';

export default function ConversationDetailView({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session;
}) {
  const { conversationId = '' } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const onBack = () => navigate('/conversations');

  const conversation = (location.state as { conversation?: AdminConversation } | null)?.conversation ?? null;

  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AdminMessage[]>(
        apiUrl,
        session.accessToken,
        `/admin/conversations/${conversationId}/messages`,
      );
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, conversationId, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const senderLabel = (senderId: string) => {
    if (!conversation) return 'Participant';
    if (senderId === conversation.renterId) return conversation.renter.name?.trim() || conversation.renter.email;
    if (senderId === conversation.ownerId) return conversation.owner.name?.trim() || conversation.owner.email;
    return 'Participant';
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbarActions">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            <Icon name="chevron" size={16} />
            Back to Conversations
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {conversation ? (
        <section className="userHero">
          <div className="userHeroIdentity">
            <span className="avatar userHeroAvatar">
              {(conversation.renter.name?.trim() || conversation.renter.email).slice(0, 2).toUpperCase()}
            </span>
            <div className="userHeroText">
              <span className="panelEyebrow">Support thread · read only</span>
              <h2 className="userHeroTitle">
                {conversation.renter.name?.trim() || conversation.renter.email} &amp;{' '}
                {conversation.owner.name?.trim() || conversation.owner.email}
              </h2>
              <p className="userHeroSubtitle">{conversation.listing?.title ?? 'No linked listing'}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="panelEyebrow">Messages</span>
            <h3 className="panelTitle">Full conversation thread</h3>
          </div>
        </div>

        <div className="detailFeed">
          {loading ? (
            <div className="feedEmpty">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="feedEmpty">No messages in this conversation.</div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="feedCard">
                <div className="feedCardTop">
                  <strong>{senderLabel(message.senderId)}</strong>
                  <span className="cellUserSub">{formatDateTime(message.createdAt)}</span>
                </div>
                <span className="feedMeta">{message.body}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
