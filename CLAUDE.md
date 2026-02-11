# CLAUDE.md — MarkVision AI

## Project Overview

MarkVision AI is an AI-powered marketing automation platform for medical clinics. It provides multi-channel analytics (Facebook Ads, Instagram, WhatsApp, Telegram), CRM with lead scoring, content factory, financial analytics, A/B testing, competitor monitoring, AI agents, and real-time dashboards. The backend is Supabase (PostgreSQL + Auth + Realtime); the frontend is a React SPA.

## Tech Stack

- **Language:** TypeScript 5.8, React 18.3, ES2020 target
- **Build:** Vite 5.4 with SWC (`@vitejs/plugin-react-swc`)
- **Styling:** Tailwind CSS 3.4 + shadcn/ui (Radix UI primitives) + Framer Motion
- **State:** React Query (`@tanstack/react-query`) for server state, Zustand for client state, Context API for theme/auth
- **Forms:** React Hook Form + Zod validation
- **Backend:** Supabase (PostgreSQL, Auth, Realtime subscriptions, RLS policies)
- **Charts:** Recharts
- **Icons:** Lucide React, Tabler Icons
- **PWA:** vite-plugin-pwa with Workbox service workers
- **Node:** v22 (see `.nvmrc`), engines `>=20 <25`

## Quick Reference Commands

```bash
npm run dev          # Start dev server on http://localhost:8080
npm run build        # Production build to dist/
npm run build:dev    # Development build (with sourcemaps)
npm run lint         # ESLint (flat config)
npm run test         # Vitest unit tests (single run)
npm run preview      # Preview production build locally
```

## Project Structure

```
src/
├── components/       # Domain-organized component modules
│   ├── ui/           # shadcn/ui base components (Button, Dialog, etc.)
│   ├── dashboard/    # Main dashboard widgets and panels
│   ├── analytics/    # Analytics views and charts
│   ├── crm/          # CRM lead management
│   ├── factory/      # Content factory (creation/publishing)
│   ├── finance/      # Financial analytics, unit economics
│   ├── competitors/  # Competitor monitoring
│   ├── agents/       # AI agent configuration
│   ├── reports/      # Report generation
│   ├── integrations/ # External API integrations (Meta, WhatsApp, etc.)
│   ├── layout/       # App layout, sidebar, navigation
│   ├── mobile/       # Mobile-specific components
│   ├── ads/          # Ad management (Quantum Ads)
│   ├── abtesting/    # A/B testing
│   ├── automation/   # Workflow automation
│   ├── audit/        # Audit logging
│   ├── settings/     # App settings
│   └── ...           # Other domain modules (calendar, inbox, scoring, etc.)
├── pages/            # 16 route pages (Auth, Index, Setup, Blog, etc.)
├── hooks/            # 43 custom React hooks (useLeads, useAuth, useCampaigns, etc.)
├── lib/              # Utility modules (utils, chartUtils, dateUtils, validation, etc.)
├── integrations/     # Supabase client setup and types
├── constants/        # App-wide constants
├── services/         # Backend service modules (healthCheckService)
├── assets/           # Static assets
└── test/             # Test setup (ResizeObserver mock for Recharts)

supabase/             # 46 SQL migration files
scripts/              # Node.js migration and utility scripts
e2e/                  # Playwright E2E tests
api/                  # Edge functions (health.js)
n8n-workflows/        # n8n workflow automation JSON definitions
.github/workflows/    # CI/CD (deploy.yml, health-check.yml, vercel-auto-promote.yml)
```

## Architecture Patterns

### Routing

The app uses React Router v6. Most dashboard routes (e.g., `/dashboard`, `/crm`, `/analytics`, `/finance`) render the `Index` page, which switches tabs based on the URL path. Standalone pages like `Auth`, `Setup`, `Blog`, `Presentation` are separate components. Non-critical pages are lazy-loaded with `React.lazy()` + `Suspense`.

### Data Fetching

All Supabase data goes through React Query hooks in `src/hooks/`. Pattern:

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => supabase.from('table').select('*')
});
```

Realtime updates use Supabase channel subscriptions (e.g., `leads-all` channel for live lead updates).

### Component Organization

Each domain module in `src/components/` may contain:
- `ComponentName.tsx` — main component
- `SubComponent.tsx` — child/section components
- `types.ts` — TypeScript interfaces
- `__tests__/` — test files
- `index.ts` — barrel exports

### State Management

- **Server state** (API data): React Query with 1-minute stale time, 1 retry
- **Client state** (UI state): Zustand stores
- **Global state** (theme, auth): React Context providers

## Code Conventions

### Path Alias

All imports use `@/` as alias for `./src/`:

```typescript
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
```

### Naming

- **Components:** PascalCase (`AnalyticsPlatform.tsx`, `CRMPage.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`, `useLeads.ts`)
- **Utilities:** camelCase (`chartUtils.ts`, `dateUtils.ts`)
- **Constants:** UPPER_SNAKE_CASE for values, camelCase for files

### TypeScript Configuration

The project uses permissive TypeScript settings — `strict: false`, `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`. Do not tighten these settings without explicit direction.

### ESLint Configuration

Flat ESLint config (`eslint.config.js`). Key disabled rules:
- `@typescript-eslint/no-unused-vars`: off
- `@typescript-eslint/no-explicit-any`: off
- `@typescript-eslint/ban-ts-comment`: off
- `react-refresh/only-export-components`: off

Ignored paths: `dist`, `dev-dist`, `n8n-workflows`, `public`, `supabase/.temp`.

### Styling

- Tailwind utility classes for all styling
- Dark mode via `next-themes` (`class` strategy)
- Design system uses "Interstellar" glassmorphism theme with dark backgrounds
- `cn()` utility (from `@/lib/utils`) for conditional class merging (clsx + tailwind-merge)
- Component variants via `class-variance-authority`

### Comments

Codebase contains Russian-language comments throughout. Maintain this convention when working in existing files.

## Testing

### Unit Tests (Vitest)

- Config: `vitest.config.ts`
- Environment: JSDOM
- Setup: `src/test/setup.ts` (mocks `ResizeObserver` for Recharts compatibility)
- Run: `npm run test`
- Test files use `__tests__/` directories or `.test.ts(x)` suffix
- Libraries: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`

### E2E Tests (Playwright)

- Config: `playwright.config.ts`
- Test dir: `e2e/`
- Browser: Chromium only
- Base URL: `http://localhost:8080`
- Auto-starts dev server via `npm run dev`
- CI retries: 2; local retries: 0

## Build & Deployment

### Vite Build

- Base path: `/` on Vercel, `/markvision/` on GitHub Pages
- Manual chunk splitting for vendor libs (react, recharts, date-fns, etc.) and large feature modules (reports, crm, competitors, agents, factory)
- Chunk size warning at 600KB
- Asset inlining below 4KB
- Gzip + Brotli compression via `vite-plugin-compression`
- Image optimization via `vite-imagetools`

### CI/CD (GitHub Actions)

- **`deploy.yml`**: Builds and deploys to GitHub Pages on push to main
- **`health-check.yml`**: Curls the Vercel health endpoint after deploy
- **`vercel-auto-promote.yml`**: Auto-promotes latest Vercel deployment to production

### Deployment Targets

- **Primary:** Vercel (SPA rewrites in `vercel.json`)
- **Secondary:** GitHub Pages (`/markvision/` base path)

## Environment Variables

Prefixed with `VITE_` for client-side access via `import.meta.env`:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous JWT key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project identifier |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable auth key |
| `ANTHROPIC_API_KEY` | Claude AI API key (server-side only) |

## Database

Supabase PostgreSQL with:
- 46 migration files in `supabase/` directory
- Row-Level Security (RLS) policies for multi-tenancy
- Realtime subscriptions for live data
- Key tables: `projects`, `leads`, `daily_data`, `campaigns`, `ad_accounts`, `instagram_stats`, `content_stats`, `automation_flows`, `ai_agents`, `competitor_posts`, `ab_tests`, `system_health`, `integrations`
- Migration scripts in `scripts/` directory (Node.js + `pg` client)

## External Integrations

- **Supabase:** Database, auth, realtime
- **Meta/Facebook Ads:** Ad account data, campaign metrics
- **Instagram:** Stats, insights, post performance
- **WhatsApp/Telegram:** Messaging integrations (via Green API)
- **n8n:** Workflow automation (webhook dispatcher at `n8n.zapoinov.com`), dev proxy at `/n8n`
- **Anthropic Claude:** AI features via `@anthropic-ai/sdk`
- **Vercel:** Hosting, analytics (`@vercel/analytics`), speed insights (`@vercel/speed-insights`)

## Key Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Root component with routing and providers |
| `src/pages/Index.tsx` | Main dashboard shell (tab switching by URL) |
| `src/integrations/supabase/client.ts` | Supabase client initialization |
| `vite.config.ts` | Build config (PWA, compression, proxy, chunks) |
| `tailwind.config.ts` | Theme configuration and dark mode |
| `components.json` | shadcn/ui component registry config |
| `vercel.json` | Vercel deployment + SPA rewrites |

## Common Pitfalls

- **ResizeObserver errors in tests:** The test setup mocks `ResizeObserver` for Recharts compatibility. Ensure new chart-related tests import from `src/test/setup.ts`.
- **Workbox + Node 23+:** The Vite config automatically switches to development-mode Workbox on Node >= 23 to avoid terser crashes.
- **Base path:** Build output uses different base paths for Vercel vs GitHub Pages. The `VERCEL` env var controls this.
- **TypeScript permissiveness:** The project intentionally uses relaxed TS settings. Don't add `strict: true` or similar flags.
