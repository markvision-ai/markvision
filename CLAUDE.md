# CLAUDE.md — MarkVision AI

## Project Overview

MarkVision AI is an AI-powered marketing platform for medical clinics. It provides multi-channel marketing management (Instagram, Facebook Ads), CRM, AI analytics (Anthropic Claude), content automation, financial tracking, team management, and real-time dashboards. The UI is in Russian; code is in English.

**Stack**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Supabase (PostgreSQL, Auth, Edge Functions, Realtime) + TanStack Query + n8n (workflow automation) + Anthropic Claude API + OpenAI (embeddings/RAG).

## Quick Reference

```bash
nvm use 22              # Node 22 required (.nvmrc)
npm install             # Install dependencies
npm run dev             # Dev server at http://localhost:8080
npm run build           # Production build to /dist
npm run lint            # ESLint check
npm run test            # Vitest unit tests
npx playwright test     # E2E tests (Playwright/Chromium)
```

## Repository Structure

```
/src
├── components/        # ~244 React components organized by feature
│   ├── ui/            # shadcn/ui primitives (Button, Dialog, etc.)
│   ├── dashboard/     # Main dashboard widgets & metrics
│   ├── analytics/     # Analytics visualizations
│   ├── ads/           # Facebook/Meta ads management
│   ├── crm/           # Lead management
│   ├── factory/       # Content factory automation
│   ├── agents/        # AI agents interface
│   ├── automation/    # n8n workflow automation UI
│   ├── reports/       # Report generation (PDF/HTML)
│   ├── calendar/      # Calendar/scheduling
│   ├── layout/        # Navigation, sidebar, header
│   ├── landing/       # Marketing landing page
│   ├── settings/      # User settings
│   ├── integrations/  # OAuth & 3rd-party integrations
│   └── ...            # 35+ feature modules
├── hooks/             # ~43 custom React hooks (useAuth, useLeads, useCampaigns, etc.)
├── pages/             # Route-level page components
├── lib/               # Utilities, validation (Zod), helpers
│   ├── agents/        # AI agent configurations
│   ├── __tests__/     # Unit tests
│   └── validation.ts  # Zod schemas
├── integrations/
│   └── supabase/      # Supabase client setup + auto-generated DB types
├── constants/         # App constants (e.g., ads.ts)
├── services/          # Service layer (healthCheckService.ts)
├── assets/            # Static images & media
├── test/              # Test setup (Vitest)
├── App.tsx            # Root router — all routes defined here
├── main.tsx           # React DOM mount point
└── index.css          # Global styles (Tailwind)

/supabase
├── functions/         # 18 Edge Functions (TypeScript/Deno)
│   ├── ai-analytics-chat/
│   ├── generate-ai-report/
│   ├── sync-meta-ads/
│   ├── generate-embeddings/
│   ├── webhook-receiver/
│   └── ...
└── migrations/        # SQL database migrations

/api                   # Vercel serverless API endpoints
/scripts               # Database migration Node.js scripts
/e2e                   # Playwright E2E tests
/public                # Static assets (fonts, PWA icons, logos)
/docs                  # Project documentation
/.github/workflows     # CI/CD (deploy.yml, health-check.yml)
/n8n-workflows         # n8n automation workflow JSON configs
```

## Architecture

```
Frontend (React SPA)  ──HTTP/WS──>  Supabase (PostgreSQL + Auth + Realtime)
        │                                    │
        │                           Edge Functions (Deno)
        │                             │            │
        │                    Anthropic Claude   OpenAI Embeddings
        │
        └───── Vite proxy ──────>  n8n (workflow automation)
                                        │
                                   Meta Graph API
```

- **SPA with client-side routing** via React Router. Most authenticated routes render `Index.tsx` which switches tabs by URL path.
- **Data fetching**: Custom hooks wrapping `@tanstack/react-query` for caching + Supabase client for DB queries and realtime subscriptions.
- **State**: No Redux. Server state via TanStack Query; minimal client state via Zustand; auth via `useAuth` hook + Supabase session.
- **Feature-based component organization**: Each domain (ads, crm, factory, etc.) has its own directory under `components/`.

## Code Conventions

### TypeScript
- Path alias: `@/*` maps to `./src/*` (configured in tsconfig.json and vite.config.ts)
- Strict mode is relaxed: `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`
- ESLint rules are loose: `no-unused-vars` OFF, `no-explicit-any` OFF, `ban-ts-comment` OFF

### Components & Styling
- UI primitives from **shadcn/ui** (Radix + Tailwind) in `src/components/ui/`
- Styling via **Tailwind CSS** with custom theme (dark mode, glassmorphism, medical-themed colors)
- Animations: **Framer Motion** for transitions; `canvas-confetti` for celebrations
- Icons: **Lucide React** (primary), **Tabler Icons** (secondary)
- Toast notifications: **Sonner** (`sonner` package)
- Charts: **Recharts** (dark-theme compatible)

### Data Patterns
- Forms: `react-hook-form` + `@hookform/resolvers` + `zod` validation
- Supabase client: initialized in `src/integrations/supabase/client.ts`
- DB types: auto-generated in `src/integrations/supabase/types.ts`
- Row-Level Security (RLS): most tables filtered by `project_id`
- Realtime: Supabase subscriptions for live dashboard updates

### Routing
- All routes defined in `src/App.tsx`
- Critical pages (Index, Auth, Signup, Setup) are eagerly loaded
- All other pages use `React.lazy()` + `<Suspense>` with a `PageLoader` fallback
- Most authenticated paths (`/dashboard`, `/crm`, `/analytics`, `/factory`, etc.) render the `Index` page which handles tab switching internally

## Environment Variables

Required in `.env` (see `.env.example`):

```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
ANTHROPIC_API_KEY=<anthropic-api-key>          # Used by Edge Functions
OPENAI_API_KEY=<openai-api-key>                # Optional, for embeddings/RAG
NODE_ENV=development|production
```

Vite exposes `VITE_*` vars to the client. Non-prefixed vars are server-side only (Edge Functions, migration scripts).

## Build & Deployment

### Vite Configuration (`vite.config.ts`)
- Dev server: port 8080 with IPv6 support
- Proxy: `/n8n` routes proxied to `https://n8n.zapoinov.com` (avoids CORS)
- Production drops `console` and `debugger` statements
- Manual chunk splitting: react-vendor, ui-vendor, chart-vendor, date-vendor, pdf-vendor, supabase-vendor + lazy feature chunks
- PWA: auto-updating service worker via Workbox; NetworkFirst caching for Supabase API
- Image optimization: WebP conversion at 85% quality in production
- GZIP compression via `vite-plugin-compression`

### Deployment Targets
- **Primary**: Vercel (SPA + serverless `/api` endpoints); config in `vercel.json`
- **Secondary**: GitHub Pages (static build at `/markvision/` base path)
- **n8n**: Docker Compose with Caddy reverse proxy

### CI/CD (`.github/workflows/`)
- `deploy.yml`: Build + deploy to GitHub Pages on push to `main`
- `health-check.yml`: Post-deploy health verification via curl
- Vercel auto-deploys from the connected repo

## Testing

### Unit Tests (Vitest)
- Config: `vitest.config.ts`
- Environment: jsdom
- Setup: `src/test/setup.ts`
- Test files: `src/lib/__tests__/`, `src/components/dashboard/`
- Run: `npm run test`

### E2E Tests (Playwright)
- Config: `playwright.config.ts`
- Browser: Chromium only
- Test directory: `/e2e`
- Auto-starts dev server at `http://localhost:8080`
- 2 retries in CI, 0 locally
- Run: `npx playwright test`

### E2E Test Mode
- Components check `localStorage.getItem('E2E_TEST_MODE') === 'true'` to enable test-specific behavior

## Supabase Edge Functions

18 Edge Functions in `/supabase/functions/` (TypeScript/Deno runtime):
- `ai-analytics-chat` — AI-powered analytics Q&A
- `generate-ai-report` — AI report generation
- `sync-meta-ads` — Facebook/Meta ads sync
- `generate-embeddings` — RAG embedding generation
- `webhook-receiver` — n8n event ingestion
- `ads-manager`, `crm-automation`, `analyze-competitor`, `generate-ad-copy`, `fetch-facebook-profiles`, `sync-organic-leads`, `weekly-report`, etc.

## Database

- 60+ PostgreSQL tables with Row-Level Security
- Key tables: `projects`, `leads`, `daily_data`, `instagram_posts`, `ad_accounts`, `automation_flows`, `ab_tests`, `ai_agents`, `content_items`, `financial_plans`, `system_notifications`
- Migration scripts in `/scripts/` (Node.js, run via `npm run db:migrate:*`)
- SQL migrations also in `/supabase/migrations/`

## Key Dependencies

| Category | Packages |
|----------|----------|
| UI Framework | react, react-dom, @radix-ui/*, tailwindcss, framer-motion, lucide-react |
| Routing/State | react-router-dom, @tanstack/react-query, zustand |
| Backend | @supabase/supabase-js |
| AI | @anthropic-ai/sdk, openai |
| Forms | react-hook-form, @hookform/resolvers, zod |
| Charts | recharts |
| PDF/Export | html2canvas, jspdf |
| Dates | date-fns |
| DnD | @dnd-kit/core, @dnd-kit/sortable |
| Build | vite, @vitejs/plugin-react-swc, vite-plugin-pwa, vite-plugin-compression |
| Testing | vitest, @playwright/test, @testing-library/react, jsdom |

## Common Patterns for AI Assistants

1. **Adding a new feature page**: Create component in `src/components/<feature>/`, add route in `src/App.tsx` (most authenticated routes point to `Index` which switches tabs).
2. **Adding a new hook**: Place in `src/hooks/`, follow existing pattern of wrapping Supabase queries with `useQuery`/`useMutation` from TanStack Query.
3. **Adding UI components**: Use `shadcn/ui` primitives from `src/components/ui/`. Import via `@/components/ui/<component>`.
4. **Database changes**: Add SQL migration in `/supabase/migrations/` and/or create a migration script in `/scripts/`.
5. **Edge Functions**: Add new function directory under `/supabase/functions/<name>/` with `index.ts` entry point (Deno runtime).
6. **Never commit** `.env` files or API keys. Use `.env.example` as the template.
7. **Build verification**: Always run `npm run build` after changes to ensure no TypeScript/bundler errors break the production build.
8. **Lint check**: Run `npm run lint` — ESLint rules are intentionally loose, so any remaining errors are likely real issues.
