# Gama Express — Exterior Auto Parts Platform

A full-stack scaffold for a Kosovo exterior auto parts e-commerce platform (bumpers, body panels,
lighting, mirrors, glass, and trim), built as two independent projects: a Next.js frontend and an
Express/Prisma backend.

```
gama-express/
├── frontend/   Next.js 15 + TypeScript + Tailwind — interactive prototype UI
└── backend/    Express + TypeScript + Prisma (PostgreSQL) — API + data model
```

## What's in here

**Frontend (`/frontend`)** is a working, click-through prototype using in-memory mock data
(`lib/mock-data.ts`) — no backend connection required to run it. It covers:
- Homepage with hero, vehicle finder, category grid, featured products, brand strip
- Vehicle Finder (Manufacturer → Model → Variant/Series → Car year, with year-range validation)
- Sticky "garage bar" showing the selected vehicle's fitment status site-wide
- Product listing with category/brand/price filters + sort
- Product detail page (gallery, OEM/part numbers, specs, compatible vehicles, reviews, related items)
- Search with autocomplete, recent/popular searches
- Cart, checkout flow (UI only), account dashboard (orders, garage, wishlist, addresses, profile)
- Admin dashboard overview (stats, low-stock alerts, recent orders, review moderation)
- Request-a-part form

**Backend (`/backend`)** is a real Express API with a complete Prisma schema modeling the
entire domain (users, business/wholesale accounts, vehicle catalog, products, fitment,
inventory across warehouses, orders, invoices, discount codes, quotes, reviews, etc.) and
route handlers wired to that schema for auth, products, vehicles, cart, wishlist, orders/
checkout (Stripe), reviews, quotes, admin analytics, and file uploads (Cloudinary).

## What's stubbed / needs your input

This is a scaffold, not a finished deployment. Before going live you'll need to:

1. **Connect a real database** — set `DATABASE_URL` in `backend/.env`, then run
   `npx prisma migrate dev` and `npm run seed`.
2. **Wire the frontend to the API** — the frontend currently reads `lib/mock-data.ts` instead
   of calling `backend`'s REST endpoints. Swap the mock imports for `fetch`/TanStack Query
   calls to `NEXT_PUBLIC_API_URL`.
3. **Add real credentials** — Stripe, PayPal, Google OAuth, Cloudinary, SMTP, and Google Maps
   keys all have placeholders in `backend/.env.example` and `frontend/.env.local.example`.
4. **VIN decoding** — `backend/src/routes/vehicles.ts` has a placeholder WMI lookup; swap in a
   licensed VIN decoding provider for full make/model/engine/year resolution.
5. **Multi-language content (SQ/EN/SR)** — the data model supports a `preferredLanguage` field,
   but translated copy and an i18n routing setup (e.g. `next-intl`) still need to be added.
6. **Email sending** — password reset and verification emails are stubbed with `// TODO`
   comments in `backend/src/routes/auth.ts`; wire up `nodemailer` with your SMTP provider.

## Running the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

## Running the backend

`npm install` is already done and `backend/.env` already exists with generated JWT secrets —
the only thing left is a working Postgres connection:

```bash
cd backend
# 1. Get Postgres running (pick one):
#    Docker:  docker run --name gama-express-db -e POSTGRES_USER=gama -e POSTGRES_PASSWORD=gama \
#             -e POSTGRES_DB=gama_express -p 5432:5432 -d postgres:16-alpine
#    Native:  use whatever local Postgres install/credentials you set up
# 2. Point backend/.env's DATABASE_URL at it, e.g.:
#    postgresql://gama:gama@localhost:5432/gama_express?schema=public
npx prisma migrate dev --name init
npm run seed
npm run dev
# → http://localhost:4000/api/health
```

Seeded admin login: `admin@gamaexpress.com` / `Admin123!`

Two pre-existing scaffold bugs were fixed along the way: `backend/tsconfig.json` had `prisma/**/*.ts`
inside `rootDir: "./src"`, which broke `npm run build`; and `prisma/seed.ts` never loaded `.env`
(unlike `src/index.ts`), so `npm run seed` would fail to find `DATABASE_URL` even with a valid one set.

## Design system

- Primary: `#B30000` (Gama Express Red) · Secondary: `#1F2937` · Success: `#10B981`
- Display font: Barlow Condensed · Body: Inter · Part numbers/SKUs/VINs: IBM Plex Mono
- 12–16px corner radius, soft shadows, light gray/white surfaces — see `frontend/tailwind.config.ts`
- Signature UI element: the sticky "garage bar" under the header, which is the fitment-first
  mental model the whole site is built around (select a vehicle once, see only compatible parts).

## Suggested next steps

For the deep backend work — real Prisma migrations against a live Postgres instance, Stripe
webhook handling, auth hardening, deployment — this project is a great fit for **Claude Code**,
where I can run `npm install`, apply migrations, and iterate against a running server directly.
