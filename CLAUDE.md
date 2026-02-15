# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BullishBanana Trading Tracker — a trading journal for tracking trades, accounts (personal + prop firm), funding cycles, and analytics dashboards.

## Monorepo Structure (Nx)

- **`apps/web`** — Angular 21 frontend (standalone components, zoneless, PrimeNG v21, Tailwind v4, SCSS)
- **`apps/api`** — NestJS backend (Prisma ORM, PostgreSQL, JWT auth)
- **`apps/web-e2e`** — Playwright e2e tests for web
- **`apps/api-e2e`** — API e2e tests

No shared libs directory — all code lives in the apps.

## Common Commands

```bash
# Start everything (API + Web concurrently)
npm run dev

# Individual apps
npx nx serve web          # Angular dev server on :4200, proxies /api → :3000
npx nx serve api          # NestJS on :3000

# Build
npx nx build web
npx nx build api

# Test
npx nx test web           # Jest (jest-preset-angular)
npx nx test api           # Jest
npx nx test web --testPathPattern="trades"  # Run specific test files

# Lint
npx nx lint web
npx nx lint api

# E2E
npx nx e2e web-e2e        # Playwright

# Database
npm run db:up                          # Start PostgreSQL (Docker, port 5433)
npx prisma db push --schema apps/api/prisma/schema.prisma  # Apply schema
npx prisma generate --schema apps/api/prisma/schema.prisma # Generate client
npx prisma studio --schema apps/api/prisma/schema.prisma   # DB GUI

# Demo environment
npm run demo:setup        # Create demo DB + migrate + seed
npm run demo:start        # Start with demo DB
```

## Architecture

### Web (Angular 21)

- **Zoneless** change detection (`provideZonelessChangeDetection()`)
- **Standalone** components everywhere — no NgModules
- **Signals** for state management (no BehaviorSubject patterns)
- **Lazy-loaded** feature routes in `apps/web/src/app/app.routes.ts`
- **PrimeNG v21** with custom preset at `apps/web/src/app/core/theme/bullish-banana-preset.ts`
- **CSS layers**: `reset, theme, base, primeng, layout, components, utilities` — app styles always win over PrimeNG
- **Dark mode**: `.dark` class selector
- **Proxy**: `/api` requests proxy to `localhost:3000` via `apps/web/proxy.conf.json`
- Component prefix: `app-`

Feature modules: `auth`, `dashboard`, `accounts`, `trades`, `funding`, `analytics`

Key services:
- `core/auth/` — AuthService, authGuard, authInterceptor (JWT)
- `core/filter.store.ts` — Global filter state (signals)
- `core/theme/theme.service.ts` — Theme toggling

### API (NestJS)

- **Prisma** ORM with schema at `apps/api/prisma/schema.prisma`
- **PostgreSQL** on port 5433 (Docker)
- Modules: Auth, Users, Accounts, Trades, Funding, UserPreferences
- JWT auth with access + refresh tokens
- `DATABASE_URL` from `.env` file

### Database

Key entities: User, Account (PERSONAL/PROP_FIRM), Trade, AccountCycle, DailyAccountStatus, AccountStateSnapshot, PayoutRequest, CalendarEvent. Funding models are derived from accounts + trades.

## CSS Conventions

- Single source of truth: PrimeNG design tokens via `definePreset(Aura, {...})`
- Zero `!important`, zero `::ng-deep`
- SCSS structure in `apps/web/src/styles/` (abstracts, base, layout, components, utilities)
- Global PrimeNG overrides go in `_utilities.scss`
- Calendar popover styles in `styles.scss` (global scope, `appendTo="body"`)
- `.label-micro` class for 10px uppercase tracking labels

## Git Conventions

- **Language**: commit messages always in English
- **Length**: max 120 characters per line; use body for extra context
- **Flow**: git flow — work on `feature/*` branches from `develop`, merge back with `git flow feature finish`
- **No AI references** in commit messages
