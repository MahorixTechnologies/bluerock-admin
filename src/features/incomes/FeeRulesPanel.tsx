import { useCallback, useEffect, useState } from 'react';
import {
  apiFetch,
  ErrorBanner,
  formatDateTime,
  Icon,
  SERVICE_FEE_RULE_KEY,
  useAdminResource,
  type AdminFeeRule,
  type Session,
} from '../../lib/adminCore';

/**
 * Editor for backend-persisted `FeeRule` rows (GET/PATCH /admin/fee-rules).
 * Replaces the old localStorage-only "service charge %" field. Reports the
 * live SERVICE_FEE_PERCENT value up via `onServiceFeePercentChange` so callers
 * (e.g. the Incomes view) can use it in revenue projections without each
 * maintaining their own fetch of the same resource.
 */
export default function FeeRulesPanel({
  apiUrl,
  session,
  onServiceFeePercentChange,
}: {
  apiUrl: string;
  session: Session;
  onServiceFeePercentChange?: (value: number) => void;
}) {
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const loader = useCallback(async () => {
    return await apiFetch<AdminFeeRule[]>(apiUrl, session.accessToken, '/admin/fee-rules');
  }, [apiUrl, session.accessToken]);

  const { data: rules, setData: setRules, loading, error, reload } = useAdminResource<AdminFeeRule[]>(loader, []);

  useEffect(() => {
    const serviceFee = rules.find((rule) => rule.key === SERVICE_FEE_RULE_KEY);
    if (serviceFee) onServiceFeePercentChange?.(serviceFee.value);
    // onServiceFeePercentChange is intentionally excluded: callers may pass a
    // fresh closure each render, and we only want this to re-run when the
    // fetched rules themselves change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules]);

  const save = async (rule: AdminFeeRule) => {
    const raw = drafts[rule.key];
    const value = Number(raw);
    if (raw === undefined || raw.trim() === '' || !Number.isFinite(value) || value < 0 || value > 100) {
      setSaveError('Value must be a number between 0 and 100.');
      return;
    }
    setSaveError(null);
    setSavingKey(rule.key);
    try {
      const updated = await apiFetch<AdminFeeRule>(
        apiUrl,
        session.accessToken,
        `/admin/fee-rules/${rule.key}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        },
      );
      setRules((prev) => prev.map((item) => (item.key === rule.key ? updated : item)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[rule.key];
        return next;
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update fee rule');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <span className="panelEyebrow">Fee rules</span>
          <h3 className="panelTitle">Platform fee configuration</h3>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void reload()}>
          <Icon name="refresh" size={14} />
          Refresh
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {saveError ? <ErrorBanner message={saveError} /> : null}

      <div className="detailList">
        {loading ? (
          <div className="feedEmpty">Loading fee rules…</div>
        ) : rules.length === 0 ? (
          <div className="feedEmpty">No fee rules configured.</div>
        ) : (
          rules.map((rule) => {
            const draft = drafts[rule.key] ?? String(rule.value);
            const dirty = draft !== String(rule.value);
            return (
              <label key={rule.id} className="fieldGroup">
                <span className="fieldLabel">{rule.key.replaceAll('_', ' ')}</span>
                {rule.description ? <span className="cellUserSub">{rule.description}</span> : null}
                <div className="actionCluster" style={{ justifyContent: 'flex-start' }}>
                  <input
                    className="textInput textInput--sm"
                    type="number"
                    min={0}
                    max={100}
                    value={draft}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [rule.key]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    disabled={!dirty || savingKey === rule.key}
                    onClick={() => void save(rule)}
                  >
                    <Icon name="check" size={14} />
                    Save
                  </button>
                </div>
                <span className="cellUserSub">
                  Last updated {formatDateTime(rule.updatedAt)}
                  {rule.updatedById ? ' by admin' : ''}
                </span>
              </label>
            );
          })
        )}
      </div>
    </section>
  );
}
