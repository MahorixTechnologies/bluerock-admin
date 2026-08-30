# BlueRock Admin · AGENTS.md

> Living playbook for anyone — human or agent — working in `bluerock-admin`.
> Stick to the patterns below so the admin console stays visually aligned with `bluerock-web`, and functionally aligned with the backend's real admin endpoints.

---

## 1. Stack & Versions (read this first)

| Area | Package / Version |
|---|---|
| Framework | **React 19.2.6** + **Vite 8.0.12** (not Next.js) |
| Language | **TypeScript 6.0.2** |
| Build | `tsc -b && vite build` (typecheck first, then vite) |
| Styling | Plain CSS in `src/index.css` + `src/App.css` — *not* Tailwind or CSS-in-JS |
| Linting | ESLint via `eslint.config.js` · typescript-eslint parser |
| Icons | Inline SVG via `/public/icons.svg` sprite · referenced by `<use href="/icons.svg#icon-id" />` |

The admin app is a **single-page application mounted at `src/App.tsx`** with client-side hash-based view switching. It is not using React Router yet. All tabs are routed through the `view` state in `App.tsx`.

---

## 2. Project Structure

```
bluerock-admin/
├── public/
│   ├── favicon.svg
│   └── icons.svg             # SVG sprite (heroicons set)
├── src/
│   ├── assets/               # static images (hero, etc.)
│   ├── components/           # standalone views split out of App.tsx (OwnerApplicationsView, AuditLogView, …)
│   ├── lib/
│   │   └── adminCore.tsx     # shared types, demo data, apiFetch, Icon/Badge/ErrorBanner primitives,
│   │                         # useAdminResource + usePagedItems/Pagination hooks
│   ├── App.css               # admin-specific component styles
│   ├── App.tsx               # SPA shell, routing, and the views not yet split out
│   ├── index.css             # global tokens + resets (mirrors bluerock-web)
│   └── main.tsx              # ReactDOM.createRoot entry
├── .env.example
├── eslint.config.js
├── index.html                # sets theme-color, <title>, mounts #root
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

Most views still live in `App.tsx` (sidebar, tabs, tables, modals, login, detail views, data state), but the shared list-fetch/demo-fallback/error-state pattern now lives in the `useAdminResource` hook in `src/lib/adminCore.tsx`, and newer views (owner applications, audit log) are split into `src/components/<Feature>View.tsx`. New tabs should follow that pattern — pull shared types/helpers/hooks from `adminCore`, define the view in its own file under `src/components/`, and only grow `App.tsx` for its routing/nav wiring.

---

## 3. Design System (mirrors `bluerock-web`)

The admin design has been restyled to match `bluerock-web`'s aesthetic. **Do not deviate from these tokens:**

### 3.1 Core colors

Tokens live in `src/index.css` and match `bluerock-web`'s real, live palette (`bluerock-web/src/app/globals.css`) — not an approximation of it:

| Token | Value | Purpose |
|---|---|---|
| `--bg` | `#eef2f5` | page background |
| `--surface-2` | `#ffffff` | cards, content panels |
| `--sidebar` | `#0a2a8c` | sidebar background (navy, matches bluerock-web) |
| `--sidebar-active` | `#1442c4` | active nav item background |
| `--sidebar-accent` | `#7ca8ff` | icons/highlights on the dark sidebar |
| `--primary` | `#1e5bff` | primary buttons, links, active states |
| `--primary-600` | `#1849d6` | button hover / pressed |
| `--primary-soft` | `rgba(30,91,255,0.10)` | pills, chip backgrounds |
| `--accent` | `#0b2466` | headings, strong text |
| `--text` | `#111827` | body text |
| `--text-muted` | `#6b7280` | secondary text, placeholders |
| `--border` | `rgba(17,24,39,0.08)` | card hairlines, dividers |
| `--danger` | `#ef4444` · `--danger-soft: rgba(239,68,68,0.10)` | errors, destructive actions |
| `--success` | `#16a34a` · `--success-soft: rgba(22,163,74,0.12)` | success, active (kept green — a semantic color independent of brand) |
| `--warning` | `#d97706` · `--warning-soft: rgba(217,119,6,0.14)` | warnings |

`--violet`, `--amber`, and `--teal` are additional stat-card accent colors kept visually distinct from `--primary`; they carry no semantic meaning of their own.

### 3.2 Typography

- Headings: `font-weight: 700–800`, color `var(--accent)`.
- Section titles: `18–24px`, eyebrow labels `11px / 800 / uppercase / tracking 0.4`.
- Body: `14–15px`, color `var(--text)`. Line height `1.55`.

### 3.3 Surfaces & elevation

- Card radius: `18–24px`, border `1px solid var(--border)`, soft shadow.
- Buttons: `16px` radius, primary uses `var(--primary)` with white text.
- Inputs: `14px` radius, `42–48px` height, `1px solid var(--border)`.

---

## 4. Views / Tabs

The current view set (in `view` state + sidebar):

| View slug | Sidebar label | Purpose |
|---|---|---|
| `dashboard` | Dashboard | Overview hero, stat cards, quick actions, system snapshot |
| `users` | Users | Client-paginated (20/page) users table with status actions + `View user` |
| `listings` | Listings | Client-paginated (20/page) listings table with moderation + `View listing` |
| `bookings` | Bookings | Client-paginated (20/page) bookings table + `View booking` |
| `owner_applications` | Owner Applications | Pending renter→landlord applications with Approve/Reject (`src/components/OwnerApplicationsView.tsx`) |
| `audit_logs` | Audit Log | Recent admin actions, newest first (`src/components/AuditLogView.tsx`) |
| `incomes` | Incomes | Revenue summary, service charge editor, fee income per booking |
| `reports` | Reports | Aggregated metrics and attention items |
| `settings` | Settings | Platform support details, payout day, maintenance mode |
| `login` | *(guarded)* | Sign-in form; auto redirects |

Pagination is client-side: the full list is still fetched in one call and chunked in the browser (`usePagedItems` in `adminCore.tsx`), not paged via query params against the backend.

### 4.1 Detail views

The three entity detail views are embedded in the same `App.tsx` render path via a parallel `detail` state:

| Detail state | Opens from | Contents |
|---|---|---|
| `{ kind: 'user', id }` | Users → View | profile summary, status, booking/listing counts, listings, bookings, status actions |
| `{ kind: 'listing', id }` | Listings → View | title, images, host, description, amenities, rules, status actions, moderation, **Reviews panel** (fetches `GET /listings/:id/reviews`, flag/unflag via `PATCH /admin/reviews/:id/moderate`) |
| `{ kind: 'booking', id }` | Bookings → View | stay window, renter, listing, cost breakdown, fee, status, payment |

Note: the public reviews list excludes `REJECTED` reviews, so the Reviews panel updates moderation state optimistically in local state rather than refetching after a flag/unflag — a refetch would make a freshly-rejected review disappear from the list before it could be unflagged.

---

## 5. Authentication & Access

### 5.1 Live backend path

Login first tries:
```
POST  <VITE_API_URL>/api/v1/auth/login
{ email, password }  →  { accessToken, user }
```

Then verifies ADMIN role via:
```
GET  <VITE_API_URL>/api/v1/admin/users  (Authorization: Bearer <token>)
```

**Any successful login whose user.role is `ADMIN` is admitted.** If that request 403/401s, admin access is denied and the token is wiped.

### 5.2 Demo mode (when backend is unavailable)

If the `VITE_API_URL` is missing or fails, the admin falls back to a **demo / fake-credentials mode** so sign-in still works for QA. Only these credentials trigger demo mode:

```
email:    admin@bluerock.com
password: admin123
```

When signed in via demo mode, a `Demo mode` badge is rendered in the header, and tables populate from local demo arrays.

### 5.3 Storage

Token + current admin profile are stored in `localStorage` under a `bluerock.admin.v1` prefixed key, and the page hydrates them on load. Logout clears both.

---

## 6. Admin REST Endpoints (Backend)

Always prefer the live endpoint. When the backend is reachable, `bluerock-admin` talks to:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/login` | issue JWT |
| `GET`  | `/users/me` | current user info |
| `GET`  | `/admin/users` | list users (requires ADMIN JWT) |
| `GET`  | `/admin/users/:id` | single user detail (added for View User) |
| `PATCH`| `/admin/users/:id/status` | set ACTIVE/SUSPENDED |
| `GET`  | `/admin/listings` | list listings |
| `PATCH`| `/listings/:id/status` | approve / reject listing (ADMIN only; lives in the listings module, not admin, despite historically being documented under `/admin/listings`) |
| `GET`  | `/admin/bookings` | list bookings |
| `GET`  | `/admin/owner-applications?status=PENDING\|APPROVED\|REJECTED\|NONE` | list renter→landlord applications (defaults to PENDING) |
| `PATCH`| `/admin/owner-applications/:userId/decision` | `{ decision: 'APPROVE' \| 'REJECT' }` — approve flips role to LANDLORD |
| `GET`  | `/listings/:listingId/reviews` | list a listing's reviews (public route, lives in the listings/reviews module, excludes `REJECTED` reviews) |
| `PATCH`| `/admin/reviews/:id/moderate` | `{ status: 'APPROVED' \| 'REJECTED' }` — hide/show a review from public listing pages |
| `GET`  | `/admin/audit-logs?limit=50` | recent admin actions, newest first (limit clamped 1–200) |

The backend controllers/services live in `../bluerock-backend/src/modules/admin/*` (owner applications, review moderation, audit logs) and `../bluerock-backend/src/modules/reviews/*` (review listing). Any new admin page you add must have a matching endpoint added there first before wiring from the admin UI.

**Role changes require re-login.** A user's role is baked into their JWT at login, so a renter approved to LANDLORD will not see landlord-gated tools until they log out and back in. Any UI that triggers a role change (e.g. the owner application decision) must say so rather than implying it takes effect immediately.

---

## 7. Admin-Specific State

Beyond signed-in session, the admin keeps some persistent settings in localStorage to make them sticky between reloads:

| Key | Stored by | Reads |
|---|---|---|
| `bluerock.admin.serviceCharge.v1` | `incomes` tab service-charge editor | Incomes + Reports projected fee income |
| `bluerock.admin.settings.v1` | `settings` tab | support email/phone, payout day, maintenance mode |

⚠️ **Important:** Service charge is used to compute fee income from booking totals. Keep the editor bounded: `0 ≤ value ≤ 50`. Validations live in the input on the Incomes tab.

---

## 8. Running & Verifying

```bash
cd bluerock-admin

# install deps
npm install

# (optional) wire the backend
cp .env.example .env
# → set VITE_API_URL=http://localhost:3000

# dev server on Vite default port 5173
npm run dev

# critical gate before commit:
npm run build
```

The de facto verification loop after any change is:
1. `npm run build` — **must exit with 0**
2. smoke-check the login form (demo mode fallback), dashboard cards, users list view, and one detail view.

---

## 9. Things You Will NOT Do

- Do **not** install Tailwind or add CSS-in-JS libraries; the admin uses raw CSS tokens.
- Do **not** add a new view without a sidebar nav item + a loading/skeleton + empty state.
- Do **not** skip the ADMIN role check; any future dashboard data call must be gated behind a real ADMIN JWT or explicit demo mode.
- Do **not** expose PII in a way that the mobile app never sees — user emails and phones only appear in admin.
- Do **not** persist JWT in cookies or query params; localStorage only.
- Do **not** add service charge logic without also feeding the same value back into reports income math.
- Do **not** add inline code comments unless requested.

---

## 10. Environment

```
VITE_API_URL=http://localhost:3000
```

Without `VITE_API_URL`, the app still boots and uses demo mode. This matches the mobile app's design philosophy of "UI stays populated even without the backend."
