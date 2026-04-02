# Workspace — CURATED.

## Project Description

**CURATED.** is a localized marketplace application with a Quiet Luxury aesthetic (slate-900 palette, Inter font, generous whitespace).

### Feature Set
- **Admin RBAC**: `welik.jakob@gmail.com` is the sole super-admin. Admin nav link hidden from all others. `/admin` route shows "Kein Zugriff" to any non-admin. Defined in `lib/admin.ts` (`ADMIN_EMAIL`, `isAdminEmail()`).
- **Static category grid**: `CategoryGrid.tsx` renders all 8 categories as a permanent link grid on the homepage for SEO internal linking. Each links to `/category/:id`.
- **Category pages** (`/category/:id`): Dedicated page per category with filtered listings, category header, fee badge, and "Be the first" empty state with CTA. SEO title/description per category.
- 4-slot image gallery uploader in CreateListing (URL-based, live previews, hover-remove, keyboard shortcuts)
- 200 active listings per user limit enforced at backend + DB CHECK constraint (cardinality ≤ 4 images)
- MyAds slot progress bar showing active listings / 200 with color escalation
- Browsable listing feed with category/location/search filtering
- Listing detail page with real-time chat (send message to seller), star ratings, report system
- Create listing (requires Replit Auth login)
- Real-time messaging inbox
- User profiles with ratings
- Report system with admin review
- Admin dashboard with financial stats (paid vs free listings, listing counts by status)
- **Replit Auth** (browser OIDC login/logout via `/api/login`, `/api/callback`, `/api/logout`)
- **Listing lifecycle**: free = 10-day expiry set at creation; paid = 30-day expiry after Stripe payment
- **Stripe checkout** — €1.00 Premium Listing upgrade (€1.00 / 30 days); webhook updates listing to `paid` + resets expiry
- **Auto-delete cron** — runs hourly in `index.ts`, marks listings `deleted` where `expiryDate < now`
- **My Ads page** — user dashboard showing own listings with age counter, expiry, and "Boost to Premium" CTA
- Age counter on listing detail (days since listing created)
- **SEO layer** — `react-helmet-async` with `<SEO>` component (meta, og, twitter), Schema.org JSON-LD (`MarketplaceSchema`, `ListingSchema`, `BreadcrumbSchema`) on Home + ListingDetail; `<article>` semantic HTML with inline microdata on listing cards; footer with site attribution; `€` currency throughout
- **Dynamic pricing** — `Vehicles & Mobility` (€5.49) and `Real Estate` (€9.49) require a one-time Stripe listing fee; other categories free. Paid listings created as `status='pending'` until Stripe confirms; `paymentStatus` + `listingFee` columns on DB; `/stripe/checkout-category` creates ad-hoc Stripe session with `price_data`; `/stripe/session-status/:listingId` verifies payment on return and activates listing; live fee summary card in the create form updates as category changes
- **Video-Proof System** — listings ≥ €500 must provide a video URL (Speed.it link); backend sets `status='pending_video'`; admin must approve via "Video-Prüfung" tab before listing goes live. Schema: `videoUrl text` column on listings table.
- **Archive** — sold listings visible at `/archive` (SEO-gold); "Verkauft" badge overlay + grayscale tint; archive link in footer. `GET /api/listings/archive` endpoint.
- **KI-Exposé** — Gemini AI (gemini-2.5-flash via Replit AI Integrations) rewrites listing descriptions in Quiet Luxury Sotheby's style. Backend: `POST /api/ai/improve-description`. Frontend button next to description label in CreateListing.
- **Silent Listing** — `is_silent boolean default false` column on listings; toggle in CreateListing; public feed filters out silent listings; only accessible via direct link.
- **Admin Video Review** — "Video-Prüfung" tab in admin dashboard shows pending_video listings with embedded video player, approve (activates listing) and reject (deletes listing) buttons. Badge counter on tab. Endpoints: `GET/POST /api/admin/pending-videos/:id/approve`, `GET/POST /api/admin/pending-videos/:id/reject`.

## Business/B2B Module
- `is_business`, `company_name`, `vat_id` columns on `profiles` table
- `business_bookings` table (profileId, listingId, amount, paymentStatus, invoiceNumber)
- BusinessBadge component (`artifacts/marketplace/src/components/BusinessBadge.tsx`)
- Profile edit dialog: business toggle + Firmenname + USt-IdNr. fields (only visible to owner)
- ListingDetail: "Gewerblicher Anbieter" block + PRO pill on seller card when `seller.isBusiness`
- Admin "B2B" tab: table of all business_bookings with "Als bezahlt markieren" button
- Auto-creates a `business_booking` record when a business user creates a paid listing

## Pending Features (implement later)

### 1. Transaktionale E-Mails
- **Service**: Resend (resend.com) — needs API key stored as `RESEND_API_KEY` secret
- **3 Templates**:
  - Willkommens-Mail wenn Gewerbe-Profil aktiviert → an Nutzer
  - Rechnungs-Benachrichtigung wenn Admin "Als bezahlt markieren" klickt → an Gewerbekunden
  - Video-Proof Status (Freischaltung / Ablehnung) → an Verkäufer
- **Trigger-Punkte**: `PATCH /api/profiles/:id` (isBusiness→true), `PATCH /admin/business-bookings/:id/mark-paid`, `POST /admin/pending-videos/:id/approve|reject`

### 2. Registrierungsfluss Privat/Gewerbe
- Toggle UI bei Registrierung (Privat / Gewerbe) mit animierten Zusatzfeldern
- Status `pending_business` für neue Gewerbekunden → manuelle Freischaltung im Admin
- DB-Felder bereits vorhanden (is_business, company_name, vat_id)

### 3. Automatische Rechnungsnummern via DB-Trigger
- SQL-Funktion `generate_invoice_number()` → Format `DKB-2026-0001` (fortlaufend pro Jahr)
- Trigger `tr_generate_invoice` auf `business_bookings` BEFORE INSERT

### 4. PDF-Rechnung für Gewerbekunden
- PDF-Generierung nach Zahlung, abrufbar im Nutzerprofil
- Button "Rechnung herunterladen" erscheint wenn paymentStatus = 'paid'

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `lib/replit-auth-web` (`@workspace/replit-auth-web`)

Thin React hook library for browser-side Replit Auth. Exports `useAuth()` which calls `GET /api/auth/user` to resolve the authenticated user, and provides `login()` / `logout()` helpers that redirect via `/api/login` and `/api/logout`.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
