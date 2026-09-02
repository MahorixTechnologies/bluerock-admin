import type { IconName } from '../lib/adminCore';

export type NavKey =
  | 'dashboard'
  | 'users'
  | 'listings'
  | 'bookings'
  | 'owner_applications'
  | 'audit_logs'
  | 'moderation_reports'
  | 'disputes'
  | 'incomes'
  | 'reports'
  | 'payments'
  | 'payouts'
  | 'reviews'
  | 'conversations'
  | 'settings';

export const NAV_ITEMS: { key: NavKey; label: string; icon: IconName; path: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid', path: '/' },
  { key: 'users', label: 'Users', icon: 'users', path: '/users' },
  { key: 'listings', label: 'Listings', icon: 'home', path: '/listings' },
  { key: 'bookings', label: 'Bookings', icon: 'calendar', path: '/bookings' },
  { key: 'owner_applications', label: 'Owner Applications', icon: 'flag', path: '/owner-applications' },
  { key: 'moderation_reports', label: 'Reports Queue', icon: 'shield', path: '/reports-queue' },
  { key: 'disputes', label: 'Disputes', icon: 'activity', path: '/disputes' },
  { key: 'payments', label: 'Payments', icon: 'wallet', path: '/payments' },
  { key: 'payouts', label: 'Payouts', icon: 'wallet', path: '/payouts' },
  { key: 'reviews', label: 'Reviews', icon: 'star', path: '/reviews' },
  { key: 'conversations', label: 'Conversations', icon: 'mail', path: '/conversations' },
  { key: 'audit_logs', label: 'Audit Log', icon: 'clipboard', path: '/audit-log' },
  { key: 'incomes', label: 'Incomes', icon: 'wallet', path: '/incomes' },
  { key: 'reports', label: 'Reports', icon: 'chart', path: '/reports' },
  { key: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
];

export const ROUTE_META: { test: (path: string) => boolean; navKey: NavKey; title: string; subtitle: string }[] = [
  { test: (p) => p === '/', navKey: 'dashboard', title: 'Dashboard', subtitle: 'Overview of platform activity and health' },
  { test: (p) => p === '/users', navKey: 'users', title: 'Users', subtitle: 'Manage accounts across renters, landlords, and admins' },
  { test: (p) => /^\/users\/[^/]+$/.test(p), navKey: 'users', title: 'User Details', subtitle: 'Profile, activity, and access overview' },
  { test: (p) => p === '/listings', navKey: 'listings', title: 'Listings', subtitle: 'Moderate and approve properties on the platform' },
  { test: (p) => /^\/listings\/[^/]+$/.test(p), navKey: 'listings', title: 'Listing Details', subtitle: 'Review property information and moderation status' },
  { test: (p) => p === '/bookings', navKey: 'bookings', title: 'Bookings', subtitle: 'Track reservations and their payment status' },
  { test: (p) => /^\/bookings\/[^/]+$/.test(p), navKey: 'bookings', title: 'Booking Details', subtitle: 'Inspect reservation value, stay dates, and payment state' },
  {
    test: (p) => p === '/owner-applications',
    navKey: 'owner_applications',
    title: 'Owner Applications',
    subtitle: 'Review renter requests to become landlords',
  },
  { test: (p) => p === '/audit-log', navKey: 'audit_logs', title: 'Audit Log', subtitle: 'Recent administrative actions across the platform' },
  {
    test: (p) => p === '/reports-queue',
    navKey: 'moderation_reports',
    title: 'Reports Queue',
    subtitle: 'User-filed reports against listings and accounts',
  },
  { test: (p) => p === '/disputes', navKey: 'disputes', title: 'Disputes', subtitle: 'Booking disputes raised by renters and landlords' },
  { test: (p) => p === '/payments', navKey: 'payments', title: 'Payments', subtitle: 'Transactions processed through Paystack and Flutterwave' },
  { test: (p) => /^\/payments\/[^/]+$/.test(p), navKey: 'payments', title: 'Payment Details', subtitle: 'Inspect a single transaction and issue refunds' },
  { test: (p) => p === '/payouts', navKey: 'payouts', title: 'Payouts', subtitle: 'Owner payouts and transfer status' },
  { test: (p) => p === '/reviews', navKey: 'reviews', title: 'Reviews', subtitle: 'Moderate guest feedback across all listings' },
  { test: (p) => p === '/conversations', navKey: 'conversations', title: 'Conversations', subtitle: 'Read-only visibility into renter and owner messaging' },
  { test: (p) => /^\/conversations\/[^/]+$/.test(p), navKey: 'conversations', title: 'Conversation Thread', subtitle: 'Full message history between renter and owner' },
  { test: (p) => p === '/incomes', navKey: 'incomes', title: 'Incomes', subtitle: 'Revenue, service charge, and payout overview' },
  { test: (p) => p === '/reports', navKey: 'reports', title: 'Reports', subtitle: 'Platform performance, approval flow, and booking trends' },
  { test: (p) => p === '/settings', navKey: 'settings', title: 'Settings', subtitle: 'Business defaults, support contacts, and admin configuration' },
];
