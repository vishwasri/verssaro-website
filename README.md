# VERSSARO // Luxury Streetwear E-Commerce Platform

Full-stack e-commerce platform for **VERSSARO** featuring a NestJS v11 + Prisma + MySQL REST API (`verssaro-backend/`) and a Next.js 16 App Router + Tailwind CSS v4 storefront & Atelier HQ admin console (`verssaro-frontend/`).

## Architecture

- **Backend (`verssaro-backend/`)**: NestJS `v11` on `http://localhost:4000/api` (Swagger docs at `http://localhost:4000/api/docs`) backed by Prisma (`v6.19.3`) and MySQL (`verssaro_db`), auto-seeded on startup via `SeedService`.
- **Frontend (`verssaro-frontend/`)**: Next.js `16.4.6` (App Router, Turbopack, Cache Components) on `http://localhost:3000` implementing all VERSSARO Storefront, Client Dossier & NFC Vault, and Atelier HQ Admin Console screens.

## Quick Start

### 1. Configure & Start the NestJS Backend API (`:4000`)

Configure `DATABASE_URL` in `verssaro-backend/.env` (see `verssaro-backend/.env.example`, e.g., `mysql://root:1234@127.0.0.1:3306/verssaro_db`), then push the Prisma schema and start the server:

```bash
cd verssaro-backend
npm install
npx prisma db push
npm run start:dev
```

### 2. Start the Next.js Frontend (`:3000`)

```bash
cd verssaro-frontend
npm install
npm run dev
```

*(For production mode: run `npm run build && npm run start` inside `verssaro-frontend/`.)*

## Seeded Demo Data & Test Credentials

- **Primary VIP Patron**: `alexander.wright@verssaro.vip` / Password: `verssaro2025` (`DOSSIER // 0842-AW`, Tier 01 Sovereign, 5 bound NTAG 424 DNA NFC garments, pre-seeded bag & 8 wishlist items, Colombo & London Mayfair addresses)
- **Secondary VIP Patron**: `julian.desilva@verssaro.vip` / Password: `verssaro2025` (for testing P2P NFC provenance transfers)
- **Live Promo Keys**: `ARCHIVE10` (10% off), `SOVEREIGN-DROP-02`, `ATELIER-TIER1-PRIVATE`, `BASKET-THRESHOLD-3K`
- **Reference Order Confirmation**: `VR-2025-98421-COL`

## Key Routes

### Storefront & Acquisition Flow
- `/` — Campaign Hero, Foundations, Bestsellers, NFC Auth Teaser, Archive 01 Lookbook
- `/shop` (`/collections`, `/new-drops`) — Multi-facet filtering, sorting, slide-over filter matrix
- `/products/[slug]` — PDP with colorway/size stock matrix, cm/in guide, fabric drape modal, verified reviews
- `/bag` — Persistent reservation bag, collector packaging toggle, promo engine
- `/checkout` & `/checkout/confirmation` — Autofill shipping/payment pipeline & waybill manifest

### Client Dossier & NFC Provenance Vault
- `/wishlist` — Saved Archive curation with stock filters & bulk Move-to-Bag
- `/account` — Client Dossier & order tracking pipeline
- `/account/addresses` — Shipping Dossiers & destination CRUD
- `/vault` — NFC Provenance Vault, Radar Scan/Bind modal, P2P Handover modal, Immutable Ledger Receipt modal
- `/editorial`, `/about`, `/client-care`, `/privacy`, `/terms` — Supporting Atelier monographs & charters

### Atelier HQ Admin Console
- `/admin` — Operational telemetry KPIs, drop velocity chart, hub utilization & bot lockdown shield
- `/admin/catalog` — SKU matrix editor, COGS/margin pricing, batch repricing, new piece creation
- `/admin/orders` — Global fulfillment dispatch queue & batch DHL dispatch
- `/admin/nfc` — NTAG 424 DNA silicon registry & batch minting
- `/admin/inventory` — Multi-vault stock rebalancing (`Colombo Flagship` / `London Mayfair Suite` / `Dubai Private Vault`)
- `/admin/ledger` — Polygon PoS rollup handover monitor & JSON audit export
- `/admin/clients` — VIP Patron dossier onboarding & restoration pass management
- `/admin/promotions` — Whitelist campaign deployment & live status controls

