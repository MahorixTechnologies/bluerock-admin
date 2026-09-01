import { useCallback, useState } from 'react';
import {
  apiFetch,
  Badge,
  bookingStatusTone,
  ErrorBanner,
  formatMoney,
  Icon,
  useAdminResource,
  type AdminAnalyticsTrends,
  type AnalyticsWeekPoint,
  type BadgeTone,
  type Session,
} from '../../lib/adminCore';

function formatWeekLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function formatCompact(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return `${Math.round(value)}`;
}

/**
 * Small SVG bar chart for one week-indexed metric. Kept single-purpose (one
 * axis, one hue) so the two metrics (count, revenue) never share a dual-axis
 * chart — they render as two of these, stacked, sharing the same week labels.
 */
function WeekBarChart({
  points,
  getValue,
  formatTooltipValue,
  formatTick,
}: {
  points: AnalyticsWeekPoint[];
  getValue: (point: AnalyticsWeekPoint) => number;
  formatTooltipValue: (value: number) => string;
  formatTick: (value: number) => string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const values = points.map(getValue);
  const maxValue = Math.max(1, ...values);

  const width = 760;
  const height = 168;
  const paddingLeft = 46;
  const paddingRight = 8;
  const paddingTop = 10;
  const paddingBottom = 22;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const gap = 8;
  const barWidth = points.length > 0 ? (plotWidth - gap * (points.length - 1)) / points.length : 0;
  const gridlineCount = 4;
  const labelEvery = points.length > 8 ? 2 : 1;

  return (
    <div className="chartScroll">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Weekly trend chart"
        preserveAspectRatio="xMinYMid meet"
      >
        {Array.from({ length: gridlineCount + 1 }, (_, i) => i).map((i) => {
          const y = paddingTop + (plotHeight * i) / gridlineCount;
          const value = maxValue - (maxValue * i) / gridlineCount;
          return (
            <g key={i}>
              <line x1={paddingLeft} x2={width - paddingRight} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={paddingLeft - 8} y={y + 3.5} textAnchor="end" className="chartAxisLabel">
                {formatTick(value)}
              </text>
            </g>
          );
        })}

        {points.map((point, i) => {
          const value = getValue(point);
          const barHeight = maxValue > 0 ? (value / maxValue) * plotHeight : 0;
          const x = paddingLeft + i * (barWidth + gap);
          const y = paddingTop + plotHeight - barHeight;
          const showLabel = i % labelEvery === 0 || i === points.length - 1;
          return (
            <g
              key={point.weekStart}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((idx) => (idx === i ? null : idx))}
            >
              <rect
                className="chartBar"
                x={x}
                y={value > 0 ? y : paddingTop + plotHeight - 2}
                width={barWidth}
                height={value > 0 ? Math.max(barHeight, 2) : 2}
                rx={3}
                fill={hoverIndex === i ? 'var(--primary-600)' : 'var(--primary)'}
              >
                <title>{`${formatWeekLabel(point.weekStart)}: ${formatTooltipValue(value)}`}</title>
              </rect>
              {showLabel ? (
                <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" className="chartAxisLabel">
                  {formatWeekLabel(point.weekStart)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const STATUS_TONE_VAR: Record<BadgeTone, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
  neutral: 'var(--text-subtle)',
};

export default function AnalyticsTrendsChart({ apiUrl, session }: { apiUrl: string; session: Session }) {
  const loader = useCallback(async () => {
    return await apiFetch<AdminAnalyticsTrends>(apiUrl, session.accessToken, '/admin/analytics/trends');
  }, [apiUrl, session.accessToken]);

  const { data, loading, error, reload } = useAdminResource<AdminAnalyticsTrends>(loader, {
    series: [],
    statusBreakdown: [],
  });

  const totalBookings = data.series.reduce((sum, point) => sum + point.count, 0);
  const totalRevenue = data.series.reduce((sum, point) => sum + point.revenue, 0);
  const maxStatusCount = Math.max(1, ...data.statusBreakdown.map((item) => item.count));

  return (
    <div className="dashGrid">
      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="panelEyebrow">Booking trends</span>
            <h3 className="panelTitle">Last 12 weeks</h3>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => void reload()}>
            <Icon name="refresh" size={14} />
            Refresh
          </button>
        </div>

        {error ? <ErrorBanner message={error} /> : null}

        {loading ? (
          <div className="feedEmpty">Loading trends…</div>
        ) : data.series.length === 0 ? (
          <div className="feedEmpty">No booking activity in this window yet.</div>
        ) : (
          <>
            <div className="chartBlock">
              <div className="chartSubHeader">
                <span className="chartSubTitle">Bookings per week</span>
                <span className="chartSubMeta">{totalBookings} total</span>
              </div>
              <WeekBarChart
                points={data.series}
                getValue={(point) => point.count}
                formatTooltipValue={(value) => `${value} booking${value === 1 ? '' : 's'}`}
                formatTick={(value) => `${Math.round(value)}`}
              />
            </div>
            <div className="chartBlock">
              <div className="chartSubHeader">
                <span className="chartSubTitle">Revenue per week</span>
                <span className="chartSubMeta">{formatMoney('NGN', totalRevenue)} total</span>
              </div>
              <WeekBarChart
                points={data.series}
                getValue={(point) => point.revenue}
                formatTooltipValue={(value) => formatMoney('NGN', value)}
                formatTick={(value) => `₦${formatCompact(value)}`}
              />
            </div>
          </>
        )}
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <span className="panelEyebrow">Booking status</span>
            <h3 className="panelTitle">Current breakdown</h3>
          </div>
        </div>

        {loading ? (
          <div className="feedEmpty">Loading breakdown…</div>
        ) : data.statusBreakdown.length === 0 ? (
          <div className="feedEmpty">No bookings yet.</div>
        ) : (
          <div className="statusBarList">
            {data.statusBreakdown.map((item) => {
              const tone = bookingStatusTone(item.status);
              return (
                <div key={item.status} className="statusBarRow">
                  <div className="statusBarTop">
                    <Badge tone={tone}>{item.status}</Badge>
                    <span className="statusBarCount">{item.count}</span>
                  </div>
                  <div className="statusBarTrack">
                    <div
                      className="statusBarFill"
                      style={{
                        width: `${Math.max(4, (item.count / maxStatusCount) * 100)}%`,
                        background: STATUS_TONE_VAR[tone],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
