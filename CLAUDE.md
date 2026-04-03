# CLAUDE.md — MarkVision AI v2.1

## Project Overview

MarkVision AI is a full-stack medical marketing automation platform for clinics. It provides AI-powered analytics, CRM with Kanban lead management, content factory, competitor monitoring, multi-channel marketing, financial dashboards, and automation workflows.

**Language:** TypeScript (React SPA, no SSR)
**Primary locale:** Russian (UI strings, comments, and variable names often in Russian)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 with TypeScript |
| Build | Vite 5 with SWC (`@vitejs/plugin-react-swc`) |
| Styling | Tailwind CSS 3 (dark mode via class strategy) |
| UI Components | shadcn/ui + Radix UI primitives |
| Animations | Framer Motion |
| Charts | Recharts (dark-theme compatible) |
| State (async) | TanStack React Query |
| State (client) | Zustand (available), React Context |
| Forms | react-hook-form + zod validation |
| Routing | React Router DOM 6 |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Edge Functions) |
| Automation | N8N webhooks (`n8n.zapoinov.com`) |
| AI | Anthropic Claude SDK |
| Deployment | Vercel (primary), GitHub Pages (secondary) |
| PWA | vite-plugin-pwa with Workbox |

## Quick Commands

```bash
npm run dev          # Start dev server at http://localhost:8080
npm run build        # Production build → dist/
npm run build:dev    # Development-mode build (for debugging)
npm run lint         # ESLint (flat config, TS files only)
npm run test         # Vitest unit tests (jsdom environment)
npm run preview      # Preview production build locally
npx playwright test  # E2E tests (Chromium, requires dev server)
```

## Project Structure

```
markvision/
├── src/
│   ├── main.tsx                    # Entry point (ThemeProvider, Analytics)
│   ├── App.tsx                     # Router + QueryClient + OAuth handler
│   ├── index.css                   # Global CSS variables and Tailwind layers
│   ├── pages/                      # Route-level page components (16 pages)
│   │   ├── Index.tsx               # Main app shell — tab-based navigation
│   │   ├── Auth.tsx                # Login page
│   │   ├── Signup.tsx              # Registration
│   │   ├── Setup.tsx               # Onboarding wizard
│   │   └── ...                     # Blog, Careers, Knowledge, etc.
│   ├── components/                 # Feature-organized components (~36 modules)
│   │   ├── ui/                     # shadcn/ui primitives (50+ components)
│   │   ├── dashboard/              # Dashboard widgets (28 components)
│   │   ├── crm/                    # CRM module (25 components, Kanban)
│   │   ├── factory/                # Content factory (17 components)
│   │   ├── analytics/              # Advanced analytics + AI chat
│   │   ├── agents/                 # AI agents interface
│   │   ├── ads/                    # Ad management
│   │   ├── competitors/            # Competitor analysis
│   │   ├── finance/                # Financial dashboards
│   │   ├── landing/                # Marketing landing page
│   │   ├── settings/               # Settings & admin hub
│   │   └── ...                     # 25+ more feature modules
│   ├── hooks/                      # Custom React hooks (44 hooks)
│   │   ├── useAuth.ts              # Authentication state
│   │   ├── useProjectData.ts       # Main data fetching hook (large)
│   │   ├── useProjects.ts          # Project CRUD
│   │   ├── usePermissions.ts       # RBAC permissions
│   │   ├── useCRM*.ts              # CRM-related hooks
│   │   ├── useNotifications.ts     # Notification system
│   │   └── ...
│   ├── integrations/supabase/      # Supabase client + auto-generated types
│   │   ├── client.ts               # Client initialization, realtime config
│   │   └── types.ts                # DB types (auto-generated, ~6000 lines)
│   ├── lib/                        # Utilities and helpers
│   │   ├── agents/agentTypes.ts    # AI agent definitions
│   │   ├── utils.ts                # General utilities (cn(), etc.)
│   │   ├── dateUtils.ts            # Date formatting helpers
│   │   ├── chartUtils.ts           # Chart configuration
│   │   ├── validation.ts           # Shared validators
│   │   └── ...
│   ├── constants/                  # App constants
│   ├── services/                   # Service layer (healthCheck)
│   └── test/                       # Test setup and utilities
├── supabase/
│   ├── functions/                  # 16 Supabase Edge Functions
│   └── migrations/                 # Database migrations (SQL)
├── e2e/                            # Playwright E2E tests
├── sql/                            # Additional SQL migration files
├── scripts/                        # Build and migration scripts
├── n8n-workflows/                  # N8N automation workflow exports
├── public/                         # Static assets (icons, manifest)
├── docs/                           # Project documentation
└── .github/workflows/              # CI/CD (deploy, health-check)
```

## Architecture & Patterns

### Routing

All authenticated routes funnel through `src/pages/Index.tsx`, which acts as the main app shell. The URL path determines which tab/module is displayed. Standalone pages (Auth, Signup, Blog, Presentation, etc.) have their own route components.

Critical pages (Index, Auth, Signup, Setup) are eagerly loaded. All others use `React.lazy()` with `<Suspense>`.

### Data Flow

1. **Hooks** in `src/hooks/` fetch data from Supabase via the client in `src/integrations/supabase/client.ts`
2. **React Query** (`@tanstack/react-query`) manages caching, with 1-minute stale time, 1 retry, no refetch on window focus
3. **Components** consume hook data and render the UI
4. **Mutations** go through Supabase client directly
5. **Realtime subscriptions** use Supabase channels for live updates

### Supabase Conventions

- **Always filter by `project_id`** — this is a hard rule for all queries
- Row Level Security (RLS) is enforced on all tables
- Types are auto-generated in `src/integrations/supabase/types.ts` — do not edit manually
- Edge Functions live in `supabase/functions/`

### UI Conventions

- Use **Framer Motion** for all UI animations
- Use **Recharts** for charts (must be dark-theme compatible)
- Styling follows **deep dark mode + glassmorphism** (Aceternity UI aesthetic)
- shadcn/ui components live in `src/components/ui/`
- Use `cn()` from `src/lib/utils.ts` for conditional class merging (Tailwind)
- Icons: **lucide-react** exclusively
- Toasts: **Sonner** (`sonner` library, top-right position)

### Component Patterns

- Feature modules are organized by domain in `src/components/<feature>/`
- Heavy modules use lazy loading with code splitting (Reports, CRM, Competitors, Agents, Factory)
- Forms use `react-hook-form` with `zod` schema validation
- Modals use Radix UI `Dialog`
- Drag-and-drop uses `@dnd-kit` (CRM Kanban board)

### Code Splitting

Vite is configured with manual chunks:
- `react-vendor` — React, React Router
- `ui-vendor` — Framer Motion, Radix UI
- `chart-vendor` — Recharts
- `date-vendor` — date-fns
- `pdf-vendor` — html2canvas, jspdf
- `supabase-vendor` — Supabase, React Query
- Feature chunks: Reports, CRM, Competitors, Agents, Factory

## TypeScript Configuration

- **Strict mode is OFF** (`noImplicitAny: false`, `strictNullChecks: false`)
- Path alias: `@/*` maps to `./src/*`
- Target: ES2020, Module: ESNext
- `any` is allowed (ESLint rule `@typescript-eslint/no-explicit-any` is off)
- Unused variables are not flagged by ESLint

## ESLint

Flat config in `eslint.config.js`. Many strict rules are intentionally disabled:
- `@typescript-eslint/no-unused-vars`: off
- `@typescript-eslint/no-explicit-any`: off
- `@typescript-eslint/ban-ts-comment`: off
- `react-refresh/only-export-components`: off

Ignored paths: `dist`, `dev-dist`, `n8n-workflows`, `public`, `supabase/.temp`

## Testing

### Unit Tests (Vitest)
- Config: `vitest.config.ts`
- Environment: jsdom with global APIs
- Setup file: `src/test/setup.ts`
- Run: `npm run test`
- E2E directory is excluded from unit test runs

### E2E Tests (Playwright)
- Config: `playwright.config.ts`
- Browser: Chromium (Desktop Chrome)
- Base URL: `http://localhost:8080`
- Retries: 2 in CI, 0 in local dev
- Auto-starts the dev server if not running
- Run: `npx playwright test`

## Deployment

### Vercel (Primary)
- Config in `vercel.json`
- Build: `npm run build` → `dist/`
- SPA rewrites: all non-asset routes → `/index.html`
- Service worker files served directly
- Base path: `/markvision/` on Vercel, `/` in dev

### GitHub Pages (Secondary)
- Workflow: `.github/workflows/deploy.yml`
- Triggers on push to `main`
- Node 18, `npm ci && npm run build`

### Health Check
- Workflow: `.github/workflows/health-check.yml`
- Verifies Supabase environment variables are available
- Checks HTTP 200 from deployment URL

## Environment Variables

All client-side env vars use the `VITE_` prefix:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anonymous key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project identifier
- `ANTHROPIC_API_KEY` — Claude API key (server-side only, used in Edge Functions)

## Node Version

- `.nvmrc`: Node 22
- `package.json engines`: `>=20 <25`

## Key Files for AI Assistants

When working on this codebase, these files are the most important to understand:

| File | Purpose |
|------|---------|
| `src/App.tsx` | All routing definitions and provider tree |
| `src/pages/Index.tsx` | Main app shell, tab switching by URL path |
| `src/integrations/supabase/client.ts` | Supabase client setup, realtime config |
| `src/integrations/supabase/types.ts` | Auto-generated DB types (read-only) |
| `src/hooks/useAuth.ts` | Authentication state and session management |
| `src/hooks/useProjectData.ts` | Primary data fetching hook |
| `src/lib/utils.ts` | Shared utilities (`cn()` class merger) |
| `src/index.css` | CSS variables, theme tokens, Tailwind layers |
| `vite.config.ts` | Build config, proxies, code splitting, PWA |
| `tailwind.config.ts` | Custom theme (colors, animations, effects) |

## Rules for AI Assistants

1. **Always filter Supabase queries by `project_id`** — never fetch data without this filter
2. **Use Framer Motion** for any UI animations
3. **Use Recharts** for charts — must work with dark theme
4. **Follow the glassmorphism / deep dark mode aesthetic** — use existing CSS variables and the GlassCard component pattern
5. **Do not edit `src/integrations/supabase/types.ts`** — it is auto-generated
6. **Use `@/` path alias** for all imports (maps to `src/`)
7. **Use `cn()` from `@/lib/utils`** for conditional Tailwind classes
8. **Use Sonner** for toast notifications (not native alerts)
9. **Use lucide-react** for icons (not other icon libraries)
10. **Lazy-load new heavy components** — follow the existing `React.lazy()` pattern in `App.tsx`
11. **Russian is normal** — comments, UI strings, and some variable names are in Russian; this is intentional
12. **Keep TypeScript loose** — strict mode is off by design; don't add strict annotations unless specifically requested
