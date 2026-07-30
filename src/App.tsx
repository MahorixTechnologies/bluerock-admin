import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import './App.css';

type UserRole = 'RENTER' | 'LANDLORD' | 'ADMIN';
type UserStatus = 'ACTIVE' | 'SUSPENDED';
type ListingStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  name: string | null;
  phone: string | null;
  createdAt: string;
};

type AdminUserDetail = AdminUser & {
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

type AdminListing = {
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
  createdAt: string;
  updatedAt: string;
  owner: { id: string; email: string; name: string | null; phone: string | null };
};

type AdminBooking = {
  id: string;
  listingId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  nights: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
  listing: { id: string; title: string; location: string; ownerId: string };
  renter: { id: string; email: string; name: string | null; phone: string | null };
};

type AdminSettings = {
  serviceChargePercent: number;
  companyEmail: string;
  supportPhone: string;
  payoutDay: string;
  maintenanceMode: boolean;
};

type AdminStats = {
  users: number;
  listings: number;
  bookings: number;
  revenue: number;
};

type LoginResponse = {
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

type Session = {
  accessToken: string;
  user: LoginResponse['user'];
};

const API_URL_KEY = 'bluerock.admin.apiUrl.v1';
const SESSION_KEY = 'bluerock.admin.session.v1';
const THEME_KEY = 'bluerock.admin.theme.v1';
const SETTINGS_KEY = 'bluerock.admin.settings.v1';
const DEMO_ADMIN_EMAIL = 'admin@bluerock.com';
const DEMO_ADMIN_PASSWORD = 'admin123';
const DEMO_ACCESS_TOKEN = 'demo-admin-token';

const demoUsers: AdminUser[] = [
  {
    id: 'demo-admin',
    email: DEMO_ADMIN_EMAIL,
    role: 'ADMIN',
    status: 'ACTIVE',
    emailVerified: true,
    name: 'BlueRock Admin',
    phone: null,
    createdAt: '2026-07-01T09:00:00.000Z',
  },
  {
    id: 'demo-landlord-1',
    email: 'landlord@bluerock.com',
    role: 'LANDLORD',
    status: 'ACTIVE',
    emailVerified: true,
    name: 'BlueRock Landlord',
    phone: '+2348123456789',
    createdAt: '2026-07-01T10:00:00.000Z',
  },
  {
    id: 'demo-landlord-2',
    email: 'landlord2@bluerock.com',
    role: 'LANDLORD',
    status: 'ACTIVE',
    emailVerified: true,
    name: 'BlueRock Landlord 2',
    phone: '+2348030000000',
    createdAt: '2026-07-01T10:30:00.000Z',
  },
  {
    id: 'demo-renter-1',
    email: 'renter@bluerock.com',
    role: 'RENTER',
    status: 'ACTIVE',
    emailVerified: true,
    name: 'BlueRock Renter',
    phone: null,
    createdAt: '2026-07-02T08:15:00.000Z',
  },
  {
    id: 'demo-renter-2',
    email: 'suspended@bluerock.com',
    role: 'RENTER',
    status: 'SUSPENDED',
    emailVerified: true,
    name: 'Suspended User',
    phone: null,
    createdAt: '2026-07-02T08:45:00.000Z',
  },
];

const demoListings: AdminListing[] = [
  {
    id: 'demo-listing-1',
    ownerId: 'demo-landlord-1',
    status: 'APPROVED',
    title: 'Aurora Retreat',
    description: 'A calm premium apartment with city views and fast check-in.',
    location: 'Lekki, Lagos',
    pricePerNight: 45000,
    currency: 'NGN',
    rooms: 2,
    bathrooms: 2,
    type: 'Apartment',
    images: ['https://picsum.photos/seed/bluerock-admin-1/900/600'],
    amenities: ['WiFi', 'Kitchen', 'Air conditioning'],
    rules: ['No smoking', 'No parties'],
    createdAt: '2026-07-03T11:00:00.000Z',
    updatedAt: '2026-07-03T11:00:00.000Z',
    owner: {
      id: 'demo-landlord-1',
      email: 'landlord@bluerock.com',
      name: 'BlueRock Landlord',
      phone: '+2348123456789',
    },
  },
  {
    id: 'demo-listing-2',
    ownerId: 'demo-landlord-2',
    status: 'PENDING',
    title: 'Palmview Estate',
    description: 'A stylish home stay with a quiet compound and large rooms.',
    location: 'Ikeja, Lagos',
    pricePerNight: 60000,
    currency: 'NGN',
    rooms: 3,
    bathrooms: 3,
    type: 'House',
    images: ['https://picsum.photos/seed/bluerock-admin-2/900/600'],
    amenities: ['Parking', 'Security', 'Generator'],
    rules: ['No pets'],
    createdAt: '2026-07-04T12:15:00.000Z',
    updatedAt: '2026-07-04T12:15:00.000Z',
    owner: {
      id: 'demo-landlord-2',
      email: 'landlord2@bluerock.com',
      name: 'BlueRock Landlord 2',
      phone: '+2348030000000',
    },
  },
  {
    id: 'demo-listing-3',
    ownerId: 'demo-landlord-2',
    status: 'REJECTED',
    title: 'The Courtyard Villa',
    description: 'A spacious villa with premium finishing and weekend appeal.',
    location: 'Ajah, Lagos',
    pricePerNight: 90000,
    currency: 'NGN',
    rooms: 4,
    bathrooms: 4,
    type: 'House',
    images: ['https://picsum.photos/seed/bluerock-admin-3/900/600'],
    amenities: ['Ocean view', 'WiFi', 'Security'],
    rules: ['No parties'],
    createdAt: '2026-07-05T09:40:00.000Z',
    updatedAt: '2026-07-05T09:40:00.000Z',
    owner: {
      id: 'demo-landlord-2',
      email: 'landlord2@bluerock.com',
      name: 'BlueRock Landlord 2',
      phone: '+2348030000000',
    },
  },
];

const demoBookings: AdminBooking[] = [
  {
    id: 'demo-booking-1',
    listingId: 'demo-listing-1',
    renterId: 'demo-renter-1',
    startDate: '2026-07-18T00:00:00.000Z',
    endDate: '2026-07-21T00:00:00.000Z',
    nights: 3,
    subtotal: 135000,
    serviceFee: 10000,
    total: 145000,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    createdAt: '2026-07-10T13:20:00.000Z',
    updatedAt: '2026-07-10T13:20:00.000Z',
    listing: {
      id: 'demo-listing-1',
      title: 'Aurora Retreat',
      location: 'Lekki, Lagos',
      ownerId: 'demo-landlord-1',
    },
    renter: {
      id: 'demo-renter-1',
      email: 'renter@bluerock.com',
      name: 'BlueRock Renter',
      phone: null,
    },
  },
  {
    id: 'demo-booking-2',
    listingId: 'demo-listing-2',
    renterId: 'demo-renter-1',
    startDate: '2026-07-24T00:00:00.000Z',
    endDate: '2026-07-26T00:00:00.000Z',
    nights: 2,
    subtotal: 120000,
    serviceFee: 12000,
    total: 132000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    createdAt: '2026-07-12T16:05:00.000Z',
    updatedAt: '2026-07-12T16:05:00.000Z',
    listing: {
      id: 'demo-listing-2',
      title: 'Palmview Estate',
      location: 'Ikeja, Lagos',
      ownerId: 'demo-landlord-2',
    },
    renter: {
      id: 'demo-renter-1',
      email: 'renter@bluerock.com',
      name: 'BlueRock Renter',
      phone: null,
    },
  },
];

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isDemoCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD;
}

function isDemoSession(session: Session) {
  return session.accessToken === DEMO_ACCESS_TOKEN;
}

function createDemoSession(): Session {
  return {
    accessToken: DEMO_ACCESS_TOKEN,
    user: {
      id: 'demo-admin',
      email: DEMO_ADMIN_EMAIL,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      name: 'BlueRock Admin',
      phone: null,
    },
  };
}

function getDemoStats(): AdminStats {
  return {
    users: demoUsers.length,
    listings: demoListings.length,
    bookings: demoBookings.length,
    revenue: demoBookings
      .filter((booking) => booking.paymentStatus === 'PAID')
      .reduce((sum, booking) => sum + booking.total, 0),
  };
}

function getDemoUserDetail(userId: string): AdminUserDetail | null {
  const user = demoUsers.find((item) => item.id === userId);
  if (!user) return null;

  const recentListings = demoListings
    .filter((listing) => listing.ownerId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((listing) => ({
      id: listing.id,
      title: listing.title,
      location: listing.location,
      status: listing.status,
      createdAt: listing.createdAt,
      pricePerNight: listing.pricePerNight,
      currency: listing.currency,
    }));

  const recentBookings = demoBookings
    .filter((booking) => booking.renterId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((booking) => ({
      id: booking.id,
      createdAt: booking.createdAt,
      total: booking.total,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      listing: {
        id: booking.listing.id,
        title: booking.listing.title,
        location: booking.listing.location,
      },
    }));

  return {
    ...user,
    updatedAt: user.createdAt,
    counts: {
      listingsOwned: recentListings.length,
      bookingsAsRenter: recentBookings.length,
      reviewsWritten: 0,
      accessTokens: user.emailVerified ? 1 : 0,
    },
    recentListings,
    recentBookings,
  };
}

function getDemoListingDetail(listingId: string) {
  return demoListings.find((item) => item.id === listingId) ?? null;
}

function getDemoBookingDetail(bookingId: string) {
  return demoBookings.find((item) => item.id === bookingId) ?? null;
}

function getDefaultSettings(): AdminSettings {
  return {
    serviceChargePercent: 10,
    companyEmail: 'support@bluerock.com',
    supportPhone: '+2348000000000',
    payoutDay: 'Friday',
    maintenanceMode: false,
  };
}

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  if (!isRecord(value)) return false;
  return typeof value.success === 'boolean' && 'data' in value;
}

function readMessage(value: unknown) {
  if (!isRecord(value)) return undefined;
  return typeof value.message === 'string' ? value.message : undefined;
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function normalizeApiUrl(input: string) {
  const trimmed = input.trim().replace(/\/+$/, '');
  if (trimmed.length === 0) return '';
  if (/\/api\/v1$/i.test(trimmed)) return trimmed;
  return `${trimmed}/api/v1`;
}

function joinUrl(baseUrl: string, path: string) {
  const base = baseUrl.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function apiFetch<T>(
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

function formatMoney(currency: 'NGN' | 'USD', amount: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      amount,
    );
  } catch {
    return `${currency} ${amount}`;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function initialsFor(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

type IconName =
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
  | 'lock';

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
};

function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
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

function BrandMark({ size = 40 }: { size?: number }) {
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

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function userStatusTone(status: UserStatus): BadgeTone {
  return status === 'ACTIVE' ? 'success' : 'danger';
}

function listingStatusTone(status: ListingStatus): BadgeTone {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  return 'warning';
}

function bookingStatusTone(status: AdminBooking['status']): BadgeTone {
  if (status === 'CONFIRMED') return 'success';
  if (status === 'COMPLETED') return 'info';
  if (status === 'PENDING') return 'warning';
  return 'danger';
}

function paymentTone(status: AdminBooking['paymentStatus']): BadgeTone {
  if (status === 'PAID') return 'success';
  if (status === 'UNPAID') return 'warning';
  return 'neutral';
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="errorBanner" role="alert">
      <Icon name="x" size={16} />
      <span>{message}</span>
    </div>
  );
}

function SearchField({
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

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */

function useDarkMode() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  });
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) {
      root.setAttribute('data-theme', theme);
      localStorage.setItem(THEME_KEY, theme);
    } else {
      root.removeAttribute('data-theme');
      localStorage.removeItem(THEME_KEY);
    }
  }, [theme]);

  const isDark = theme ? theme === 'dark' : systemDark;
  const toggle = () => setTheme(isDark ? 'light' : 'dark');
  return { isDark, toggle };
}

/* -------------------------------------------------------------------------- */
/* App shell                                                                  */
/* -------------------------------------------------------------------------- */

type View =
  | 'dashboard'
  | 'users'
  | 'user_details'
  | 'listings'
  | 'listing_details'
  | 'bookings'
  | 'booking_details'
  | 'incomes'
  | 'reports'
  | 'settings';

const NAV_ITEMS: { key: View; label: string; icon: IconName }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'listings', label: 'Listings', icon: 'home' },
  { key: 'bookings', label: 'Bookings', icon: 'calendar' },
  { key: 'incomes', label: 'Incomes', icon: 'wallet' },
  { key: 'reports', label: 'Reports', icon: 'chart' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const PAGE_META: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of platform activity and health' },
  users: { title: 'Users', subtitle: 'Manage accounts across renters, landlords, and admins' },
  user_details: { title: 'User Details', subtitle: 'Profile, activity, and access overview' },
  listings: { title: 'Listings', subtitle: 'Moderate and approve properties on the platform' },
  listing_details: { title: 'Listing Details', subtitle: 'Review property information and moderation status' },
  bookings: { title: 'Bookings', subtitle: 'Track reservations and their payment status' },
  booking_details: { title: 'Booking Details', subtitle: 'Inspect reservation value, stay dates, and payment state' },
  incomes: { title: 'Incomes', subtitle: 'Revenue, service charge, and payout overview' },
  reports: { title: 'Reports', subtitle: 'Platform performance, approval flow, and booking trends' },
  settings: { title: 'Settings', subtitle: 'Business defaults, support contacts, and admin configuration' },
};

function App() {
  const defaultApiUrl = useMemo(() => {
    const configured = import.meta.env.VITE_API_URL;
    return normalizeApiUrl(typeof configured === 'string' ? configured : 'http://localhost:3000');
  }, []);

  const [apiUrl, setApiUrl] = useState(() => {
    const stored = localStorage.getItem(API_URL_KEY);
    return normalizeApiUrl(stored || defaultApiUrl);
  });

  const [session, setSession] = useState<Session | null>(() => {
    const stored = safeParseJson<Session>(localStorage.getItem(SESSION_KEY));
    if (!stored?.accessToken || !stored?.user?.email) return null;
    return stored;
  });

  const [view, setView] = useState<View>('dashboard');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(() => {
    const stored = safeParseJson<AdminSettings>(localStorage.getItem(SETTINGS_KEY));
    return stored ?? getDefaultSettings();
  });
  const [navOpen, setNavOpen] = useState(false);
  const { isDark, toggle } = useDarkMode();

  useEffect(() => {
    localStorage.setItem(API_URL_KEY, apiUrl);
  }, [apiUrl]);

  useEffect(() => {
    if (!session) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  if (!session) {
    return (
      <LoginView
        apiUrl={apiUrl}
        isDark={isDark}
        onToggleTheme={toggle}
        onApiUrlChange={setApiUrl}
        onLoggedIn={(next) => {
          setSession(next);
          setView('dashboard');
        }}
      />
    );
  }

  const demoMode = isDemoSession(session);
  const meta = PAGE_META[view];

  const navigate = (next: View) => {
    setView(next);
    if (next !== 'user_details') {
      setSelectedUserId(null);
    }
    if (next !== 'listing_details') {
      setSelectedListingId(null);
    }
    if (next !== 'booking_details') {
      setSelectedBookingId(null);
    }
    setNavOpen(false);
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return (
    <div className="app">
      {navOpen ? <div className="scrim" onClick={() => setNavOpen(false)} /> : null}

      <aside className={`sidebar ${navOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebarBrand">
          <BrandMark />
          <div className="sidebarBrandText">
            <span className="sidebarBrandName">BlueRock</span>
            <span className="sidebarBrandSub">Admin Console</span>
          </div>
        </div>

        <nav className="nav">
          <span className="navLabel">Manage</span>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`navItem ${view === item.key ? 'navItem--active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebarFooter">
          <div className="connectionCard">
            <div className="connectionTop">
              <span className="connectionLabel">
                <Icon name="server" size={14} />
                Backend
              </span>
              <span className={`statusDot ${demoMode ? 'statusDot--demo' : 'statusDot--live'}`}>
                {demoMode ? 'Demo' : 'Live'}
              </span>
            </div>
            <input
              className="connectionInput"
              value={apiUrl}
              onChange={(e) => setApiUrl(normalizeApiUrl(e.target.value))}
              placeholder={defaultApiUrl}
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>

          <div className="userChip">
            <span className="avatar">{initialsFor(session.user.name, session.user.email)}</span>
            <div className="userChipText">
              <span className="userChipName">{session.user.name?.trim() || session.user.email}</span>
              <span className="userChipRole">{session.user.role}</span>
            </div>
            <button type="button" className="iconBtn" onClick={signOut} title="Sign out" aria-label="Sign out">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbarLeft">
            <button
              type="button"
              className="iconBtn topbarMenu"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
            >
              <Icon name="menu" size={20} />
            </button>
            <div className="topbarHeading">
              <h1 className="topbarTitle">{meta.title}</h1>
              <p className="topbarSubtitle">{meta.subtitle}</p>
            </div>
          </div>
          <div className="topbarActions">
            <button
              type="button"
              className="iconBtn"
              onClick={toggle}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              <Icon name={isDark ? 'sun' : 'moon'} size={18} />
            </button>
          </div>
        </header>

        <main className="content">
          {view === 'dashboard' ? (
            <DashboardView apiUrl={apiUrl} session={session} onNavigate={navigate} />
          ) : view === 'users' ? (
            <UsersView
              apiUrl={apiUrl}
              session={session}
              onViewUser={(userId) => {
                setSelectedUserId(userId);
                setView('user_details');
              }}
            />
          ) : view === 'user_details' && selectedUserId ? (
            <UserDetailView
              apiUrl={apiUrl}
              session={session}
              userId={selectedUserId}
              onBack={() => {
                setView('users');
                setSelectedUserId(null);
              }}
            />
          ) : view === 'listings' ? (
            <ListingsView
              apiUrl={apiUrl}
              session={session}
              onViewListing={(listingId) => {
                setSelectedListingId(listingId);
                setView('listing_details');
              }}
            />
          ) : view === 'listing_details' && selectedListingId ? (
            <ListingDetailView
              apiUrl={apiUrl}
              session={session}
              listingId={selectedListingId}
              onBack={() => {
                setView('listings');
                setSelectedListingId(null);
              }}
            />
          ) : view === 'bookings' ? (
            <BookingsView
              apiUrl={apiUrl}
              session={session}
              onViewBooking={(bookingId) => {
                setSelectedBookingId(bookingId);
                setView('booking_details');
              }}
            />
          ) : view === 'booking_details' && selectedBookingId ? (
            <BookingDetailView
              apiUrl={apiUrl}
              session={session}
              bookingId={selectedBookingId}
              onBack={() => {
                setView('bookings');
                setSelectedBookingId(null);
              }}
            />
          ) : view === 'incomes' ? (
            <IncomesView apiUrl={apiUrl} session={session} settings={settings} onSettingsChange={setSettings} />
          ) : view === 'reports' ? (
            <ReportsView apiUrl={apiUrl} session={session} settings={settings} />
          ) : view === 'settings' ? (
            <SettingsView settings={settings} onSettingsChange={setSettings} />
          ) : (
            <DashboardView apiUrl={apiUrl} session={session} onNavigate={navigate} />
          )}
        </main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Login                                                                      */
/* -------------------------------------------------------------------------- */

function LoginView({
  apiUrl,
  isDark,
  onToggleTheme,
  onApiUrlChange,
  onLoggedIn,
}: {
  apiUrl: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onApiUrlChange: (next: string) => void;
  onLoggedIn: (session: Session) => void;
}) {
  const [email, setEmail] = useState(DEMO_ADMIN_EMAIL);
  const [password, setPassword] = useState(DEMO_ADMIN_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="login">
      <aside className="loginAside">
        <div className="loginAsideTop">
          <BrandMark size={44} />
          <span className="loginAsideBrand">BlueRock</span>
        </div>
        <div className="loginAsideBody">
          <h2 className="loginAsideTitle">Manage your rentals with confidence.</h2>
          <p className="loginAsideText">
            One console for users, listings, and bookings across the BlueRock platform.
          </p>
          <ul className="loginFeatureList">
            <li>
              <Icon name="users" size={16} /> Approve accounts and moderate access
            </li>
            <li>
              <Icon name="home" size={16} /> Review and publish property listings
            </li>
            <li>
              <Icon name="wallet" size={16} /> Track bookings and revenue in real time
            </li>
          </ul>
        </div>
        <div className="loginAsideFoot">© {new Date().getFullYear()} BlueRock</div>
      </aside>

      <div className="loginMain">
        <div className="loginTopbar">
          <button
            type="button"
            className="iconBtn"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={18} />
          </button>
        </div>

        <div className="loginCard">
          <div className="loginBrandMobile">
            <BrandMark size={40} />
          </div>
          <h1 className="loginTitle">Welcome back</h1>
          <p className="loginSubtitle">Sign in with an admin account to continue.</p>

          <div className="demoHint">
            <Icon name="sparkles" size={15} />
            <span>
              Demo: <strong>{DEMO_ADMIN_EMAIL}</strong> / <strong>{DEMO_ADMIN_PASSWORD}</strong>
            </span>
          </div>

          <form
            className="loginForm"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setBusy(true);
              try {
                const resolvedApiUrl = normalizeApiUrl(apiUrl);
                if (!resolvedApiUrl) throw new Error('API URL is required');
                onApiUrlChange(resolvedApiUrl);
                if (isDemoCredentials(email, password)) {
                  try {
                    const payload = await apiFetch<LoginResponse>(resolvedApiUrl, null, '/auth/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: email.trim(), password }),
                    });

                    if (payload.user.role !== 'ADMIN') {
                      throw new Error('This account is not an admin');
                    }

                    onLoggedIn({ accessToken: payload.accessToken, user: payload.user });
                    return;
                  } catch {
                    onLoggedIn(createDemoSession());
                    return;
                  }
                }

                const payload = await apiFetch<LoginResponse>(resolvedApiUrl, null, '/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: email.trim(), password }),
                });

                if (payload.user.role !== 'ADMIN') {
                  throw new Error('This account is not an admin');
                }

                onLoggedIn({ accessToken: payload.accessToken, user: payload.user });
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Login failed');
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="fieldGroup">
              <span className="fieldLabel">API URL</span>
              <div className="inputWithIcon">
                <Icon name="server" size={16} className="inputIcon" />
                <input
                  className="textInput"
                  value={apiUrl}
                  onChange={(e) => onApiUrlChange(normalizeApiUrl(e.target.value))}
                  placeholder="http://localhost:3000/api/v1"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>
            </label>

            <label className="fieldGroup">
              <span className="fieldLabel">Email</span>
              <div className="inputWithIcon">
                <Icon name="mail" size={16} className="inputIcon" />
                <input
                  className="textInput"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bluerock.com"
                  type="email"
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="fieldGroup">
              <span className="fieldLabel">Password</span>
              <div className="inputWithIcon">
                <Icon name="lock" size={16} className="inputIcon" />
                <input
                  className="textInput"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                />
              </div>
            </label>

            {error ? <ErrorBanner message={error} /> : null}

            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

function DashboardView({
  apiUrl,
  session,
  onNavigate,
}: {
  apiUrl: string;
  session: Session;
  onNavigate: (view: View) => void;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);
  const adminName = session.user.name?.trim() || session.user.email;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setStats(getDemoStats());
        return;
      }
      const data = await apiFetch<AdminStats>(apiUrl, session.accessToken, '/admin/stats');
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const statCards = [
    {
      label: 'Users',
      value: loading ? '—' : String(stats?.users ?? '—'),
      tone: 'brand',
      icon: 'users' as IconName,
      note: 'Accounts across admins, landlords, and renters',
    },
    {
      label: 'Listings',
      value: loading ? '—' : String(stats?.listings ?? '—'),
      tone: 'violet',
      icon: 'home' as IconName,
      note: 'Properties currently tracked by the platform',
    },
    {
      label: 'Bookings',
      value: loading ? '—' : String(stats?.bookings ?? '—'),
      tone: 'amber',
      icon: 'calendar' as IconName,
      note: 'Reservations moving through the pipeline',
    },
    {
      label: 'Revenue',
      value: loading ? '—' : formatMoney('NGN', stats?.revenue ?? 0),
      tone: 'emerald',
      icon: 'wallet' as IconName,
      note: 'Paid booking volume recorded so far',
    },
  ] as const;

  return (
    <div className="stack">
      <section className="hero">
        <div className="heroBody">
          <span className="heroEyebrow">
            <Icon name="sparkles" size={14} /> Operations overview
          </span>
          <h2 className="heroTitle">Welcome back, {adminName}</h2>
          <p className="heroSubtitle">
            A cleaner view of platform activity across users, listings, bookings, and revenue.
          </p>
        </div>
        <button type="button" className="btn btn--ghost btn--onHero" onClick={() => void load()}>
          <Icon name="refresh" size={16} />
          Refresh
        </button>
      </section>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="statGrid">
        {statCards.map((card) => (
          <div key={card.label} className={`statCard statCard--${card.tone}`}>
            <div className="statCardTop">
              <span className="statIcon">
                <Icon name={card.icon} size={20} />
              </span>
              <span className="statLabel">{card.label}</span>
            </div>
            <div className="statValue">{card.value}</div>
            <div className="statNote">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="dashGrid">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Quick actions</span>
              <h3 className="panelTitle">Move faster through admin tasks</h3>
            </div>
          </div>
          <div className="actionList">
            <button type="button" className="actionRow" onClick={() => onNavigate('users')}>
              <span className="actionIcon actionIcon--brand">
                <Icon name="users" size={18} />
              </span>
              <span className="actionText">
                <strong>Review users</strong>
                <small>Suspend, activate, and inspect account status.</small>
              </span>
              <span className="actionMeta">{loading ? '—' : (stats?.users ?? 0)}</span>
              <Icon name="chevron" size={16} className="actionChevron" />
            </button>
            <button type="button" className="actionRow" onClick={() => onNavigate('listings')}>
              <span className="actionIcon actionIcon--violet">
                <Icon name="home" size={18} />
              </span>
              <span className="actionText">
                <strong>Moderate listings</strong>
                <small>Approve pending homes and clean up rejected ones.</small>
              </span>
              <span className="actionMeta">{loading ? '—' : (stats?.listings ?? 0)}</span>
              <Icon name="chevron" size={16} className="actionChevron" />
            </button>
            <button type="button" className="actionRow" onClick={() => onNavigate('bookings')}>
              <span className="actionIcon actionIcon--amber">
                <Icon name="calendar" size={18} />
              </span>
              <span className="actionText">
                <strong>Track bookings</strong>
                <small>Follow reservation flow and payment status.</small>
              </span>
              <span className="actionMeta">{loading ? '—' : (stats?.bookings ?? 0)}</span>
              <Icon name="chevron" size={16} className="actionChevron" />
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">System snapshot</span>
              <h3 className="panelTitle">What the platform looks like right now</h3>
            </div>
          </div>
          <div className="insightList">
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="activity" size={16} /> Workspace status
              </span>
              <strong>{demoMode ? 'Ready for demo review' : 'Connected to live services'}</strong>
            </div>
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="grid" size={16} /> Total managed records
              </span>
              <strong>
                {loading ? '—' : (stats?.users ?? 0) + (stats?.listings ?? 0) + (stats?.bookings ?? 0)}
              </strong>
            </div>
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="trend" size={16} /> Revenue health
              </span>
              <strong>{loading ? '—' : stats?.revenue ? 'Generating value' : 'Awaiting paid activity'}</strong>
            </div>
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="shield" size={16} /> Admin identity
              </span>
              <strong className="truncate">{session.user.email}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

function UsersView({
  apiUrl,
  session,
  onViewUser,
}: {
  apiUrl: string;
  session: Session;
  onViewUser: (userId: string) => void;
}) {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setItems(cloneData(demoUsers));
        return;
      }
      const data = await apiFetch<AdminUser[]>(apiUrl, session.accessToken, '/admin/users');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const updateStatus = async (userId: string, next: UserStatus) => {
    setError(null);
    if (demoMode) {
      setItems((prev) => prev.map((u) => (u.id === userId ? { ...u, status: next } : u)));
      return;
    }
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
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
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
              ) : filtered.length === 0 ? (
                <EmptyRow span={6} label="No users found." />
              ) : (
                filtered.map((u) => (
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
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onViewUser(u.id)}>
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
    </div>
  );
}

function UserDetailView({
  apiUrl,
  session,
  userId,
  onBack,
}: {
  apiUrl: string;
  session: Session;
  userId: string;
  onBack: () => void;
}) {
  const [item, setItem] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        const detail = getDemoUserDetail(userId);
        if (!detail) throw new Error('User not found');
        setItem(detail);
        return;
      }

      const data = await apiFetch<AdminUserDetail>(apiUrl, session.accessToken, `/admin/users/${userId}`);
      setItem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (next: UserStatus) => {
    if (!item) return;
    setError(null);

    if (demoMode) {
      setItem((prev) => (prev ? { ...prev, status: next } : prev));
      return;
    }

    try {
      const data = await apiFetch<{ id: string; email: string; status: UserStatus }>(
        apiUrl,
        session.accessToken,
        `/admin/users/${item.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        },
      );
      setItem((prev) => (prev ? { ...prev, status: data.status } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const summaryCards = item
    ? [
        { label: 'Listings Owned', value: String(item.counts.listingsOwned), tone: 'brand', icon: 'home' as IconName },
        {
          label: 'Bookings Made',
          value: String(item.counts.bookingsAsRenter),
          tone: 'amber',
          icon: 'calendar' as IconName,
        },
        { label: 'Reviews', value: String(item.counts.reviewsWritten), tone: 'violet', icon: 'activity' as IconName },
        { label: 'Tokens', value: String(item.counts.accessTokens), tone: 'emerald', icon: 'shield' as IconName },
      ]
    : [];

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbarActions">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            <Icon name="chevron" size={16} />
            Back to Users
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading && !item ? (
        <div className="panel userDetailEmpty">Loading user details…</div>
      ) : !item ? (
        <div className="panel userDetailEmpty">User not found.</div>
      ) : (
        <>
          <section className="userHero">
            <div className="userHeroIdentity">
              <span className="avatar userHeroAvatar">{initialsFor(item.name, item.email)}</span>
              <div className="userHeroText">
                <span className="panelEyebrow">User profile</span>
                <h2 className="userHeroTitle">{item.name?.trim() || item.email}</h2>
                <p className="userHeroSubtitle">{item.email}</p>
              </div>
            </div>

            <div className="userHeroActions">
              <span className="roleTag">{item.role}</span>
              <Badge tone={userStatusTone(item.status)}>{item.status}</Badge>
              {item.status === 'ACTIVE' ? (
                <button type="button" className="btn btn--danger" onClick={() => void updateStatus('SUSPENDED')}>
                  Suspend User
                </button>
              ) : (
                <button type="button" className="btn btn--soft" onClick={() => void updateStatus('ACTIVE')}>
                  Activate User
                </button>
              )}
            </div>
          </section>

          <div className="statGrid">
            {summaryCards.map((card) => (
              <div key={card.label} className={`statCard statCard--${card.tone}`}>
                <div className="statCardTop">
                  <span className="statIcon">
                    <Icon name={card.icon} size={18} />
                  </span>
                  <span className="statLabel">{card.label}</span>
                </div>
                <div className="statValue">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="userDetailGrid">
            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Account summary</span>
                  <h3 className="panelTitle">Profile and access information</h3>
                </div>
              </div>

              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Email address</span>
                  <strong className="truncate">{item.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Phone number</span>
                  <strong>{item.phone?.trim() || 'Not provided'}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Verification</span>
                  <strong>{item.emailVerified ? 'Verified' : 'Pending verification'}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Joined</span>
                  <strong>{formatDate(item.createdAt)}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Last updated</span>
                  <strong>{formatDate(item.updatedAt)}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Recent listings</span>
                  <h3 className="panelTitle">Latest properties from this user</h3>
                </div>
              </div>

              <div className="detailFeed">
                {item.recentListings.length === 0 ? (
                  <div className="feedEmpty">No listings yet.</div>
                ) : (
                  item.recentListings.map((listing) => (
                    <div key={listing.id} className="feedCard">
                      <div className="feedCardTop">
                        <strong>{listing.title}</strong>
                        <Badge tone={listingStatusTone(listing.status)}>{listing.status}</Badge>
                      </div>
                      <span className="feedMeta">{listing.location}</span>
                      <span className="feedMeta">
                        {formatMoney(listing.currency, listing.pricePerNight)} • {formatDate(listing.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Recent bookings</span>
                  <h3 className="panelTitle">Reservations made by this user</h3>
                </div>
              </div>

              <div className="detailFeed">
                {item.recentBookings.length === 0 ? (
                  <div className="feedEmpty">No bookings yet.</div>
                ) : (
                  item.recentBookings.map((booking) => (
                    <div key={booking.id} className="feedCard">
                      <div className="feedCardTop">
                        <strong>{booking.listing.title}</strong>
                        <Badge tone={bookingStatusTone(booking.status)}>{booking.status}</Badge>
                      </div>
                      <span className="feedMeta">{booking.listing.location}</span>
                      <span className="feedMeta">
                        {formatMoney('NGN', booking.total)} • {formatDate(booking.createdAt)}
                      </span>
                      <span className="feedMeta">Payment: {booking.paymentStatus}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Listings                                                                   */
/* -------------------------------------------------------------------------- */

function ListingsView({
  apiUrl,
  session,
  onViewListing,
}: {
  apiUrl: string;
  session: Session;
  onViewListing: (listingId: string) => void;
}) {
  const [items, setItems] = useState<AdminListing[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setItems(cloneData(demoListings));
        return;
      }
      const data = await apiFetch<AdminListing[]>(apiUrl, session.accessToken, '/admin/listings');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((l) => {
      return (
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        l.owner.email.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const setStatus = async (listingId: string, status: 'APPROVED' | 'REJECTED') => {
    setError(null);
    if (demoMode) {
      setItems((prev) => prev.map((l) => (l.id === listingId ? { ...l, status } : l)));
      return;
    }
    try {
      const data = await apiFetch<AdminListing>(
        apiUrl,
        session.accessToken,
        `/listings/${listingId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      setItems((prev) => prev.map((l) => (l.id === data.id ? { ...l, status: data.status } : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'listing' : 'listings'}`}
        </span>
        <div className="toolbarActions">
          <SearchField value={query} onChange={setQuery} placeholder="Search title, location, owner…" />
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
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
                <th>Property</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Price / night</th>
                <th>Status</th>
                <th>Created</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow span={7} label="Loading listings…" />
              ) : filtered.length === 0 ? (
                <EmptyRow span={7} label="No listings found." />
              ) : (
                filtered.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{l.title}</span>
                        <span className="cellUserSub">
                          {l.type} · {l.rooms} bd · {l.bathrooms} ba
                        </span>
                      </div>
                    </td>
                    <td className="cellMuted">{l.owner.email}</td>
                    <td>
                      <span className="cellLocation">
                        <Icon name="pin" size={14} />
                        {l.location}
                      </span>
                    </td>
                    <td className="cellStrong">{formatMoney(l.currency, l.pricePerNight)}</td>
                    <td>
                      <Badge tone={listingStatusTone(l.status)}>{l.status}</Badge>
                    </td>
                    <td className="cellMuted">{formatDate(l.createdAt)}</td>
                    <td className="colActions">
                      <div className="actionCluster">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => onViewListing(l.id)}>
                          View
                        </button>
                        {l.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              className="btn btn--soft btn--sm"
                              onClick={() => void setStatus(l.id, 'APPROVED')}
                            >
                              <Icon name="check" size={14} />
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => void setStatus(l.id, 'REJECTED')}
                            >
                              <Icon name="x" size={14} />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="cellDash">—</span>
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bookings                                                                   */
/* -------------------------------------------------------------------------- */

function ListingDetailView({
  apiUrl,
  session,
  listingId,
  onBack,
}: {
  apiUrl: string;
  session: Session;
  listingId: string;
  onBack: () => void;
}) {
  const [item, setItem] = useState<AdminListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        const detail = getDemoListingDetail(listingId);
        if (!detail) throw new Error('Listing not found');
        setItem(cloneData(detail));
        return;
      }

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
  }, [apiUrl, demoMode, listingId, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!item) return;
    setError(null);
    if (demoMode) {
      setItem((prev) => (prev ? { ...prev, status } : prev));
      return;
    }
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
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bookings                                                                   */
/* -------------------------------------------------------------------------- */

function BookingsView({
  apiUrl,
  session,
  onViewBooking,
}: {
  apiUrl: string;
  session: Session;
  onViewBooking: (bookingId: string) => void;
}) {
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setItems(cloneData(demoBookings));
        return;
      }
      const data = await apiFetch<AdminBooking[]>(apiUrl, session.accessToken, '/admin/bookings');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((b) => {
      return (
        b.listing.title.toLowerCase().includes(q) ||
        b.listing.location.toLowerCase().includes(q) ||
        b.renter.email.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q) ||
        b.paymentStatus.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="toolbarCount">
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'booking' : 'bookings'}`}
        </span>
        <div className="toolbarActions">
          <SearchField value={query} onChange={setQuery} placeholder="Search listing, renter, status…" />
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
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
                <th>Listing</th>
                <th>Renter</th>
                <th>Stay</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Created</th>
                <th className="colActions" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow span={8} label="Loading bookings…" />
              ) : filtered.length === 0 ? (
                <EmptyRow span={8} label="No bookings found." />
              ) : (
                filtered.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="cellUserText">
                        <span className="cellUserName">{b.listing.title}</span>
                        <span className="cellUserSub">
                          <Icon name="pin" size={12} /> {b.listing.location}
                        </span>
                      </div>
                    </td>
                    <td className="cellMuted">{b.renter.email}</td>
                    <td>
                      <div className="cellUserText">
                        <span className="cellStrong">
                          {b.nights} {b.nights === 1 ? 'night' : 'nights'}
                        </span>
                        <span className="cellUserSub">
                          {formatDate(b.startDate)} → {formatDate(b.endDate)}
                        </span>
                      </div>
                    </td>
                    <td className="cellStrong">{formatMoney('NGN', b.total)}</td>
                    <td>
                      <Badge tone={bookingStatusTone(b.status)}>{b.status}</Badge>
                    </td>
                    <td>
                      <Badge tone={paymentTone(b.paymentStatus)}>{b.paymentStatus}</Badge>
                    </td>
                    <td className="cellMuted">{formatDate(b.createdAt)}</td>
                    <td className="colActions">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => onViewBooking(b.id)}>
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
    </div>
  );
}

function BookingDetailView({
  apiUrl,
  session,
  bookingId,
  onBack,
}: {
  apiUrl: string;
  session: Session;
  bookingId: string;
  onBack: () => void;
}) {
  const [item, setItem] = useState<AdminBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        const detail = getDemoBookingDetail(bookingId);
        if (!detail) throw new Error('Booking not found');
        setItem(cloneData(detail));
        return;
      }
      const data = await apiFetch<AdminBooking[]>(apiUrl, session.accessToken, '/admin/bookings');
      const detail = data.find((booking) => booking.id === bookingId) ?? null;
      if (!detail) throw new Error('Booking not found');
      setItem(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, bookingId, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="toolbarActions">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            <Icon name="chevron" size={16} />
            Back to Bookings
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading && !item ? (
        <div className="panel userDetailEmpty">Loading booking details…</div>
      ) : !item ? (
        <div className="panel userDetailEmpty">Booking not found.</div>
      ) : (
        <>
          <section className="userHero">
            <div className="userHeroIdentity">
              <span className="avatar userHeroAvatar">{item.listing.title.slice(0, 2).toUpperCase()}</span>
              <div className="userHeroText">
                <span className="panelEyebrow">Reservation details</span>
                <h2 className="userHeroTitle">{item.listing.title}</h2>
                <p className="userHeroSubtitle">{item.renter.name?.trim() || item.renter.email}</p>
              </div>
            </div>

            <div className="userHeroActions">
              <Badge tone={bookingStatusTone(item.status)}>{item.status}</Badge>
              <Badge tone={paymentTone(item.paymentStatus)}>{item.paymentStatus}</Badge>
            </div>
          </section>

          <div className="statGrid">
            <div className="statCard statCard--brand">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="wallet" size={18} />
                </span>
                <span className="statLabel">Total</span>
              </div>
              <div className="statValue">{formatMoney('NGN', item.total)}</div>
            </div>
            <div className="statCard statCard--amber">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="calendar" size={18} />
                </span>
                <span className="statLabel">Nights</span>
              </div>
              <div className="statValue">{item.nights}</div>
            </div>
            <div className="statCard statCard--violet">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="chart" size={18} />
                </span>
                <span className="statLabel">Service Fee</span>
              </div>
              <div className="statValue">{formatMoney('NGN', item.serviceFee)}</div>
            </div>
            <div className="statCard statCard--emerald">
              <div className="statCardTop">
                <span className="statIcon">
                  <Icon name="activity" size={18} />
                </span>
                <span className="statLabel">Subtotal</span>
              </div>
              <div className="statValue">{formatMoney('NGN', item.subtotal)}</div>
            </div>
          </div>

          <div className="userDetailGrid userDetailGrid--two">
            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Stay information</span>
                  <h3 className="panelTitle">Reservation breakdown</h3>
                </div>
              </div>
              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Location</span>
                  <strong>{item.listing.location}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Check in</span>
                  <strong>{formatDate(item.startDate)}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Check out</span>
                  <strong>{formatDate(item.endDate)}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Created</span>
                  <strong>{formatDate(item.createdAt)}</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">Renter profile</span>
                  <h3 className="panelTitle">Guest information</h3>
                </div>
              </div>
              <div className="detailList">
                <div className="detailRow">
                  <span className="detailLabel">Name</span>
                  <strong>{item.renter.name?.trim() || item.renter.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Email</span>
                  <strong className="truncate">{item.renter.email}</strong>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Phone</span>
                  <strong>{item.renter.phone?.trim() || 'Not provided'}</strong>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function IncomesView({
  apiUrl,
  session,
  settings,
  onSettingsChange,
}: {
  apiUrl: string;
  session: Session;
  settings: AdminSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<AdminSettings>>;
}) {
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setItems(cloneData(demoBookings));
        return;
      }
      const data = await apiFetch<AdminBooking[]>(apiUrl, session.accessToken, '/admin/bookings');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load income data');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const paidBookings = items.filter((item) => item.paymentStatus === 'PAID');
  const grossRevenue = paidBookings.reduce((sum, item) => sum + item.total, 0);
  const currentServiceCharge = paidBookings.reduce((sum, item) => sum + item.serviceFee, 0);
  const projectedServiceCharge = Math.round((grossRevenue * settings.serviceChargePercent) / 100);
  const landlordPayout = Math.max(0, grossRevenue - projectedServiceCharge);

  return (
    <div className="stack">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="statGrid">
        <div className="statCard statCard--brand">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="wallet" size={18} />
            </span>
            <span className="statLabel">Gross Revenue</span>
          </div>
          <div className="statValue">{loading ? '—' : formatMoney('NGN', grossRevenue)}</div>
          <div className="statNote">Total paid booking value across the platform.</div>
        </div>
        <div className="statCard statCard--violet">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="chart" size={18} />
            </span>
            <span className="statLabel">Current Fee Income</span>
          </div>
          <div className="statValue">{loading ? '—' : formatMoney('NGN', currentServiceCharge)}</div>
          <div className="statNote">Service fee captured from paid bookings so far.</div>
        </div>
        <div className="statCard statCard--amber">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="settings" size={18} />
            </span>
            <span className="statLabel">Configured Charge</span>
          </div>
          <div className="statValue">{settings.serviceChargePercent}%</div>
          <div className="statNote">Editable service charge used for future planning.</div>
        </div>
        <div className="statCard statCard--emerald">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="trend" size={18} />
            </span>
            <span className="statLabel">Projected Payouts</span>
          </div>
          <div className="statValue">{loading ? '—' : formatMoney('NGN', landlordPayout)}</div>
          <div className="statNote">Approximate landlord payout after configured service charge.</div>
        </div>
      </div>

      <div className="userDetailGrid userDetailGrid--two">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Service charge</span>
              <h3 className="panelTitle">Update platform fee percentage</h3>
            </div>
          </div>
          <div className="detailList">
            <label className="fieldGroup">
              <span className="fieldLabel">Service charge percent</span>
              <input
                className="textInput"
                type="number"
                min={0}
                max={100}
                value={settings.serviceChargePercent}
                onChange={(e) =>
                  onSettingsChange((prev) => ({
                    ...prev,
                    serviceChargePercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  }))
                }
              />
            </label>
            <div className="detailRow">
              <span className="detailLabel">Projected fee income</span>
              <strong>{formatMoney('NGN', projectedServiceCharge)}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Recent paid bookings</span>
              <h3 className="panelTitle">Revenue-driving reservations</h3>
            </div>
          </div>
          <div className="detailFeed">
            {paidBookings.length === 0 ? (
              <div className="feedEmpty">No paid bookings yet.</div>
            ) : (
              paidBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="feedCard">
                  <div className="feedCardTop">
                    <strong>{booking.listing.title}</strong>
                    <Badge tone="success">Paid</Badge>
                  </div>
                  <span className="feedMeta">{booking.renter.email}</span>
                  <span className="feedMeta">
                    Total: {formatMoney('NGN', booking.total)} • Fee: {formatMoney('NGN', booking.serviceFee)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportsView({
  apiUrl,
  session,
  settings,
}: {
  apiUrl: string;
  session: Session;
  settings: AdminSettings;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demoMode = isDemoSession(session);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (demoMode) {
        setUsers(cloneData(demoUsers));
        setListings(cloneData(demoListings));
        setBookings(cloneData(demoBookings));
        return;
      }
      const [usersData, listingsData, bookingsData] = await Promise.all([
        apiFetch<AdminUser[]>(apiUrl, session.accessToken, '/admin/users'),
        apiFetch<AdminListing[]>(apiUrl, session.accessToken, '/admin/listings'),
        apiFetch<AdminBooking[]>(apiUrl, session.accessToken, '/admin/bookings'),
      ]);
      setUsers(usersData);
      setListings(listingsData);
      setBookings(bookingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
      setUsers([]);
      setListings([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, demoMode, session.accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length;
  const pendingListings = listings.filter((listing) => listing.status === 'PENDING').length;
  const paidBookings = bookings.filter((booking) => booking.paymentStatus === 'PAID').length;
  const unverifiedUsers = users.filter((user) => !user.emailVerified).length;
  const averageBookingValue = bookings.length
    ? Math.round(bookings.reduce((sum, booking) => sum + booking.total, 0) / bookings.length)
    : 0;

  return (
    <div className="stack">
      {error ? <ErrorBanner message={error} /> : null}

      <div className="statGrid">
        <div className="statCard statCard--brand">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="users" size={18} />
            </span>
            <span className="statLabel">Active Users</span>
          </div>
          <div className="statValue">{loading ? '—' : activeUsers}</div>
        </div>
        <div className="statCard statCard--amber">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="home" size={18} />
            </span>
            <span className="statLabel">Pending Listings</span>
          </div>
          <div className="statValue">{loading ? '—' : pendingListings}</div>
        </div>
        <div className="statCard statCard--emerald">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="wallet" size={18} />
            </span>
            <span className="statLabel">Paid Bookings</span>
          </div>
          <div className="statValue">{loading ? '—' : paidBookings}</div>
        </div>
        <div className="statCard statCard--violet">
          <div className="statCardTop">
            <span className="statIcon">
              <Icon name="chart" size={18} />
            </span>
            <span className="statLabel">Avg Booking Value</span>
          </div>
          <div className="statValue">{loading ? '—' : formatMoney('NGN', averageBookingValue)}</div>
        </div>
      </div>

      <div className="dashGrid">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Platform reports</span>
              <h3 className="panelTitle">Operational highlights</h3>
            </div>
          </div>
          <div className="insightList">
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="shield" size={16} /> Unverified users
              </span>
              <strong>{loading ? '—' : unverifiedUsers}</strong>
            </div>
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="settings" size={16} /> Current service charge
              </span>
              <strong>{settings.serviceChargePercent}%</strong>
            </div>
            <div className="insightRow">
              <span className="insightLabel">
                <Icon name="activity" size={16} /> Approval pressure
              </span>
              <strong>{loading ? '—' : pendingListings > 0 ? 'Needs review' : 'Under control'}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Recent exceptions</span>
              <h3 className="panelTitle">Items that need attention</h3>
            </div>
          </div>
          <div className="detailFeed">
            {listings.filter((listing) => listing.status !== 'APPROVED').slice(0, 4).map((listing) => (
              <div key={listing.id} className="feedCard">
                <div className="feedCardTop">
                  <strong>{listing.title}</strong>
                  <Badge tone={listingStatusTone(listing.status)}>{listing.status}</Badge>
                </div>
                <span className="feedMeta">{listing.location}</span>
              </div>
            ))}
            {!loading && listings.filter((listing) => listing.status !== 'APPROVED').length === 0 ? (
              <div className="feedEmpty">No flagged listings right now.</div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingsView({
  settings,
  onSettingsChange,
}: {
  settings: AdminSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<AdminSettings>>;
}) {
  return (
    <div className="stack">
      <div className="userDetailGrid userDetailGrid--two">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Business settings</span>
              <h3 className="panelTitle">Support and payout defaults</h3>
            </div>
          </div>
          <div className="detailList">
            <label className="fieldGroup">
              <span className="fieldLabel">Support email</span>
              <input
                className="textInput"
                value={settings.companyEmail}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, companyEmail: e.target.value }))}
              />
            </label>
            <label className="fieldGroup">
              <span className="fieldLabel">Support phone</span>
              <input
                className="textInput"
                value={settings.supportPhone}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, supportPhone: e.target.value }))}
              />
            </label>
            <label className="fieldGroup">
              <span className="fieldLabel">Default payout day</span>
              <input
                className="textInput"
                value={settings.payoutDay}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, payoutDay: e.target.value }))}
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Platform controls</span>
              <h3 className="panelTitle">Operational toggles</h3>
            </div>
          </div>
          <div className="detailList">
            <label className="toggleRow">
              <span>
                <strong>Maintenance mode</strong>
                <small>Restrict platform access for maintenance windows.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, maintenanceMode: e.target.checked }))}
              />
            </label>
            <div className="detailRow">
              <span className="detailLabel">Service charge source</span>
              <strong>Managed from Incomes tab</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function EmptyRow({ span, label }: { span: number; label: string }) {
  return (
    <tr>
      <td colSpan={span}>
        <div className="tableEmpty">{label}</div>
      </td>
    </tr>
  );
}

export default App;
