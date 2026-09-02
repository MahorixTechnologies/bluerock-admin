/* eslint-disable react-refresh/only-export-components -- shared core module: types, constants, hooks, and small UI primitives, not a Fast Refresh component boundary */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type UserRole = 'RENTER' | 'LANDLORD' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type ListingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type OwnerApplicationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReviewModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReportTargetType = 'LISTING' | 'USER';
export type ReportStatus = 'OPEN' | 'RESOLVED' | 'DISMISSED';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  name: string | null;
  phone: string | null;
  createdAt: string;
};

export type AdminUserDetail = AdminUser & {
  updatedAt: string;
  counts: {
    listingsOwned: number;
    bookingsAsRenter: number;
    reviewsWritten: number;
    accessTokens: number;
  };
  recentListings: {
    id: string;
    title: string;
    location: string;
    status: ListingStatus;
    createdAt: string;
    pricePerNight: number;
    currency: 'NGN' | 'USD';
  }[];
  recentBookings: {
    id: string;
    createdAt: string;
    total: number;
    status: AdminBooking['status'];
    paymentStatus: AdminBooking['paymentStatus'];
    listing: {
      id: string;
      title: string;
      location: string;
    };
  }[];
};

export type AdminListing = {
  id: string;
  ownerId: string;
  status: ListingStatus;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  currency: 'NGN' | 'USD';
  rooms: number;
  bathrooms: number;
  type: 'House' | 'Apartment';
  images: string[];
  amenities: string[];
  rules: string[];
  featured: boolean;
  featuredUntil: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: string; email: string; name: string | null; phone: string | null };
};

export type AdminBooking = {
  id: string;
  listingId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  nights: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUND_PENDING' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
  listing: { id: string; title: string; location: string; ownerId: string };
  renter: { id: string; email: string; name: string | null; phone: string | null };
};

export type AdminBookingDetail = AdminBooking & {
  payments: AdminPayment[];
  payouts: AdminPayout[];
};

export type AdminSettings = {
  companyEmail: string;
  supportPhone: string;
  payoutDay: string;
  maintenanceMode: boolean;
};

export type AdminStats = {
  users: number;
  listings: number;
  bookings: number;
  revenue: number;
};

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    name: string | null;
    phone: string | null;
  };
};

export type Session = {
  accessToken: string;
  user: LoginResponse['user'];
};

export type AdminOwnerApplication = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  ownerApplicationStatus: OwnerApplicationStatus;
  ownerApplicationAt: string | null;
  createdAt: string;
};

export type AdminAuditLog = {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; email: string; name: string | null; role: UserRole };
};

export type AdminReview = {
  id: string;
  listingId: string;
  renterId: string;
  rating: number;
  body: string;
  ownerResponse: string | null;
  moderationStatus: ReviewModerationStatus;
  createdAt: string;
  renter?: { id: string; name: string | null; email?: string };
};

export type AdminReviewWithListing = AdminReview & {
  renter: { id: string; name: string | null; email: string };
  listing: { id: string; title: string; ownerId: string };
};

export type PaymentPurpose = 'BOOKING' | 'FEATURED_LISTING';
export type PaymentProvider = 'PAYSTACK' | 'FLUTTERWAVE';
export type PaymentTxStatus = 'INITIATED' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED';

export type AdminPayment = {
  id: string;
  purpose: PaymentPurpose;
  bookingId: string | null;
  listingId: string | null;
  payerId: string;
  provider: PaymentProvider;
  reference: string;
  providerTransactionId: string | null;
  amount: number;
  currency: 'NGN' | 'USD';
  status: PaymentTxStatus;
  rawPayload: unknown;
  createdAt: string;
  updatedAt: string;
  payer: { id: string; email: string; name: string | null };
  booking: { id: string; listingId: string } | null;
  listing: { id: string; title: string } | null;
};

export type AdminPaymentDetail = Omit<AdminPayment, 'payer' | 'listing'> & {
  payer: { id: string; email: string; name: string | null; phone: string | null };
  booking: AdminBooking | null;
  listing: { id: string; title: string; location: string } | null;
};

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export type AdminPayout = {
  id: string;
  ownerId: string;
  bookingId: string;
  amount: number;
  currency: 'NGN' | 'USD';
  status: PayoutStatus;
  provider: string;
  reference: string | null;
  providerTransferId: string | null;
  rawPayload: unknown;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  owner: { id: string; email: string; name: string | null };
  booking: { id: string; listing?: { id: string; title: string } };
};

export type AdminMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type AdminConversation = {
  id: string;
  listingId: string | null;
  bookingId: string | null;
  renterId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  renter: { id: string; name: string | null; email: string };
  owner: { id: string; name: string | null; email: string };
  listing: { id: string; title: string } | null;
  booking: { id: string } | null;
  latestMessage: AdminMessage | null;
  _count: { messages: number };
};

export type AdminReport = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolvedById: string | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; email: string; name: string | null };
  resolvedBy: { id: string; email: string; name: string | null } | null;
};

export type AdminDispute = {
  id: string;
  bookingId: string;
  raisedById: string;
  reason: string;
  status: DisputeStatus;
  resolutionNotes: string | null;
  decidedById: string | null;
  decidedAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    status: AdminBooking['status'];
    paymentStatus: AdminBooking['paymentStatus'];
    startDate: string;
    endDate: string;
    total: number;
    listing: { id: string; title: string; location: string; ownerId: string };
    renter: { id: string; email: string; name: string | null };
  };
  raisedBy: { id: string; email: string; name: string | null; role: UserRole };
  decidedBy: { id: string; email: string; name: string | null } | null;
};

export type AdminFeeRule = {
  id: string;
  key: string;
  value: number;
  description: string | null;
  updatedAt: string;
  updatedById: string | null;
};

export type AnalyticsWeekPoint = { weekStart: string; count: number; revenue: number };
export type AnalyticsStatusCount = { status: AdminBooking['status']; count: number };
export type AdminAnalyticsTrends = {
  series: AnalyticsWeekPoint[];
  statusBreakdown: AnalyticsStatusCount[];
};

export const SERVICE_FEE_RULE_KEY = 'SERVICE_FEE_PERCENT';

export const API_URL_KEY = 'bluerock.admin.apiUrl.v1';
export const SESSION_KEY = 'bluerock.admin.session.v1';
export const THEME_KEY = 'bluerock.admin.theme.v1';
export const SETTINGS_KEY = 'bluerock.admin.settings.v1';

export function getDefaultSettings(): AdminSettings {
  return {
    companyEmail: 'support@bluerock.com',
    supportPhone: '+2348000000000',
    payoutDay: 'Friday',
    maintenanceMode: false,
  };
}

export type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type PagedResult<T> = { data: T[]; total: number; page: number; pageSize: number };

export function emptyPagedResult<T>(pageSize = 20): PagedResult<T> {
  return { data: [], total: 0, page: 1, pageSize };
}

/**
 * Builds a `?a=1&b=2` query string from a params object, skipping any
 * key whose value is undefined, null, or an empty string.
 */
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  if (!isRecord(value)) return false;
  return typeof value.success === 'boolean' && 'data' in value;
}

export function readMessage(value: unknown) {
  if (!isRecord(value)) return undefined;
  return typeof value.message === 'string' ? value.message : undefined;
}

export function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function normalizeApiUrl(input: string) {
  const trimmed = input.trim().replace(/\/+$/, '');
  if (trimmed.length === 0) return '';
  if (/\/api\/v1$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api/v1`;
}

export function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch<T>(
  baseUrl: string,
  accessToken: string | null,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(joinUrl(baseUrl, path), { ...options, headers });
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message = typeof payload === 'string' ? payload : readMessage(payload);
    throw new Error(message || `Request failed (${res.status})`);
  }

  if (isApiEnvelope(payload)) {
    if (!payload.success) {
      throw new Error(payload.message || 'Request failed');
    }
    return payload.data as T;
  }

  return payload as T;
}

export function formatMoney(currency: 'NGN' | 'USD', amount: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      amount,
    );
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function initialsFor(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

export type IconName =
  | 'grid'
  | 'users'
  | 'home'
  | 'calendar'
  | 'chart'
  | 'settings'
  | 'search'
  | 'refresh'
  | 'logout'
  | 'check'
  | 'x'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'sparkles'
  | 'trend'
  | 'chevron'
  | 'wallet'
  | 'shield'
  | 'server'
  | 'activity'
  | 'mail'
  | 'pin'
  | 'lock'
  | 'star'
  | 'flag'
  | 'clipboard';

const ICON_PATHS: Record<IconName, ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="17" rx="2" />
      <path d="M16 2.5v4M8 2.5v4M3 10h18" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19h16" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.21 7.2a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3.5v6h-6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  sparkles: (
    <path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z" />
  ),
  trend: (
    <>
      <path d="M22 7 13.5 15.5l-5-5L2 17" />
      <path d="M16 7h6v6" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  wallet: (
    <>
      <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13" />
      <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      <circle cx="16.5" cy="13.5" r="1.2" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  server: (
    <>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </>
  ),
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  star: (
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
  ),
  flag: (
    <>
      <path d="M4 22V4" />
      <path d="M4 4h14l-2.5 4L18 12H4" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 12h6M9 16h6M9 8h6" />
    </>
  ),
};

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <span className="brandMark" style={{ width: size, height: size }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 20 12 4l8 16H14l-2-4-2 4z"
          fill="rgba(255,255,255,0.95)"
          stroke="rgba(255,255,255,0.95)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared UI                                                                  */
/* -------------------------------------------------------------------------- */

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function userStatusTone(status: UserStatus): BadgeTone {
  return status === 'ACTIVE' ? 'success' : 'danger';
}

export function listingStatusTone(status: ListingStatus): BadgeTone {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'ARCHIVED') return 'neutral';
  return 'warning';
}

export function bookingStatusTone(status: AdminBooking['status']): BadgeTone {
  if (status === 'CONFIRMED' || status === 'CHECKED_IN') return 'success';
  if (status === 'COMPLETED' || status === 'CHECKED_OUT') return 'info';
  if (status === 'PENDING') return 'warning';
  return 'danger';
}

export function paymentTone(status: AdminBooking['paymentStatus']): BadgeTone {
  if (status === 'PAID') return 'success';
  if (status === 'UNPAID' || status === 'REFUND_PENDING') return 'warning';
  return 'neutral';
}

export function ownerApplicationTone(status: OwnerApplicationStatus): BadgeTone {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'neutral';
}

export function reviewStatusTone(status: ReviewModerationStatus): BadgeTone {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
}

export function reportStatusTone(status: ReportStatus): BadgeTone {
  if (status === 'RESOLVED') return 'success';
  if (status === 'DISMISSED') return 'neutral';
  return 'warning';
}

export function disputeStatusTone(status: DisputeStatus): BadgeTone {
  if (status === 'RESOLVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'UNDER_REVIEW') return 'info';
  return 'warning';
}

export function paymentTxTone(status: PaymentTxStatus): BadgeTone {
  if (status === 'SUCCESSFUL') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'REFUNDED') return 'neutral';
  return 'warning';
}

export function payoutTone(status: PayoutStatus): BadgeTone {
  if (status === 'PAID') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'PROCESSING') return 'info';
  return 'warning';
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="errorBanner" role="alert">
      <Icon name="x" size={16} />
      <span>{message}</span>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <div className="searchField">
      <Icon name="search" size={16} className="searchIcon" />
      <input
        className="searchInput"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function EmptyRow({ span, label }: { span: number; label: string }) {
  return (
    <tr>
      <td colSpan={span}>
        <div className="tableEmpty">{label}</div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Data fetching                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Shared list-fetch/error-state pattern used across the admin resource views
 * (users, listings, bookings, owner applications, audit logs, reviews, …).
 *
 * The caller supplies a memoized `loader` (its own `useCallback` with the
 * right dependency list — typically `apiUrl`, `session.accessToken`, plus any
 * id params) that resolves the live API call. This hook owns the
 * `data` / `loading` / `error` state and the load-on-mount
 * + reload-on-loader-change effect, so individual views no longer duplicate
 * the try/catch/finally boilerplate.
 */
export function useAdminResource<T>(loader: () => Promise<T>, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const initialRef = useRef(initialValue);
  useEffect(() => {
    initialRef.current = initialValue;
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setData(initialRef.current);
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, setData, loading, error, setError, reload: load };
}

/**
 * Debounces a fast-changing value (typically search input) so callers can
 * depend on it in a fetch `useCallback` without refetching on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_PAGE_SIZE = 20;

export function usePagedItems<T>(items: T[], pageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return { page: safePage, setPage, totalPages, pageItems, pageSize };
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        <Icon name="chevron" size={14} className="paginationPrev" />
        Prev
      </button>
      <span className="paginationLabel">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        Next
        <Icon name="chevron" size={14} className="paginationNext" />
      </button>
    </div>
  );
}
