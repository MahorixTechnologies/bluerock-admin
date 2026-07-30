# bluerock-admin

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Set API URL:

```bash
cp .env.example .env
```

`VITE_API_URL` should point to the backend host (the app will call `/api/v1/*` automatically).

3. Start dev server:

```bash
npm run dev
```

## Backend requirements

- Backend must be running with prefix `/api/v1` (default in this repo).
- Admin UI expects these endpoints:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/admin/stats`
  - `GET /api/v1/admin/users`
  - `PATCH /api/v1/admin/users/:id/status`
  - `GET /api/v1/admin/listings`
  - `GET /api/v1/admin/bookings`
  - `PATCH /api/v1/listings/:id/status` (approve/reject listing)

## Creating an admin account (dev)

If you don’t already have an admin user in the database, either run the backend seed, or create one via the existing register endpoint:

Seeded credentials:

- `admin@bluerock.com` / `admin123`

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@bluerock.com","password":"admin123","role":"ADMIN"}'
```

Then sign in via the Admin UI.
# bluerock-admin
