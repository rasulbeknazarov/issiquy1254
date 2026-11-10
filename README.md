# IssiqUy — Thermal Audit & Retrofit Platform

B2C/B2B thermal energy auditing, pre-cut basalt insulation kitting, and consolidated milk-run logistics partner for **Thermo Plus** (Khorezm Insulation Group JV), Urgench, Uzbekistan.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS (dark basalt-and-infrared theme)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js v4 with Google OAuth 2.0
- **Icons:** Lucide React
- **Validation:** Zod

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local or cloud)
- Google Cloud Console project with OAuth 2.0 credentials

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

- `DATABASE_URL` — your PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — from Google Cloud Console

### 3. Set up Google OAuth 2.0

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret into `.env`

### 4. Push database schema

```bash
npx prisma db push
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Role System

| Role | How Assigned | Access |
|------|-------------|--------|
| `CUSTOMER` | Default for all users | Thermal Audit calculator, Kit Builder, own orders |
| `AUDITOR` | Manual DB assignment | All customer views + Logistics dashboard + all audits/orders |
| `INSTALLER_CREW` | Manual DB assignment | Customer views + assigned installation orders |
| `THERMOPLUS_ADMIN` | Automatic for `@thermoplus.uz` emails | Full access: Admin Consignment Portal, all data |

## Project Structure

```
prisma/schema.prisma          — Database schema (User, ThermalAudit, RetrofitOrder, MilkRunRoute)
src/lib/prisma.ts              — Prisma client singleton
src/lib/auth.ts                — NextAuth config with Google OAuth + role callbacks
src/lib/thermal-physics.ts     — Physics engine, SKU calculator, unit economics
src/app/api/auth/              — NextAuth route handler
src/app/api/audits/            — Thermal audit CRUD
src/app/api/orders/            — Retrofit order creation with consignment tracking
src/app/api/logistics/         — Milk-run route management
src/components/                — React components (Navbar, AuditCalculator, KitBuilder, etc.)
src/app/page.tsx               — Landing page + tab-based dashboard
```

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel project settings
4. Add production redirect URI in Google Cloud Console: `https://your-domain.vercel.app/api/auth/callback/google`

## Thermal Physics Reference

Based on the 2026 Uzbekistan Residential Building Basalt Insulation Study:

- Thermal conductivity: λ = 0.040 W/(m·°C)
- 6 cm walls + 10 cm roof → 80.6% envelope heat loss reduction
- Saves ~3,000 m³ natural gas per house per year
- Reduces summer AC demand by up to 3x
