# CLAUDE.md — MarkVision AI

This document describes the MarkVision AI codebase for AI assistants working in this repository.

## Project Overview

MarkVision AI is a marketing analytics platform for medical clinics. It provides a dashboard with AI agents, CRM, content factory, ad management, automation, competitor analysis, and reporting. The application is a React SPA deployed as a PWA.

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase + shadcn/ui

## Common Commands

```bash
npm run dev          # Start dev server on http://localhost:8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint (flat config, TS files only)
npm run test         # Vitest unit tests (single run)
npx vitest           # Vitest in watch mode
npx playwright test  # E2E tests (requires dev server on :8080)
```

## Project Structure

```
src/
├── App.tsx                  # Root component, routing, QueryClient setup
├── main.tsx                 # React DOM entry point
├── index.css                # Global styles, CSS custom properties
├── components/
│   ├── ui/                  # shadcn/ui primitives (Button, Dialog, etc.)
│   ├── dashboard/           # Main dashboard layout and widgets
│   ├── agents/              # AI agent roster and management
│   ├── analytics/           # Data visualization and metrics
│   ├── crm/                 # CRM module
│   ├── factory/             # Content factory
│   ├── reports/             # Report generation
│   ├── finance/             # Financial analysis
│   ├── ads/                 # Ad campaign management
│   ├── automation/          # Automation workflows
│   ├── competitors/         # Competitor analysis
│   ├── settings/            # Application settings
│   ├── inbox/               # Messaging
│   ├── audit/               # Audit logging
│   ├── abtesting/           # A/B testing
│   ├── landing/             # Public landing pages
│   ├── mobile/              # Mobile-optimized components
│   └── ...                  # Other feature modules
├── hooks/                   # 40+ custom React hooks (useAuth, useProjectData, etc.)
├── lib/                     # Utilities, helpers, agent types, RAG
│   ├── agents/              # Agent type definitions and RAG implementation
│   ├── utils.ts             # cn() helper (clsx + tailwind-merge)
│   └── __tests__/           # Unit tests for lib modules
├── pages/                   # Route page components
├── services/                # Service layer (healthCheckService)
├── integrations/supabase/   # Supabase client and generated types
├── constants/               # App constants
├── test/                    # Test setup (Vitest + JSDOM)
└── assets/                  # Static assets

supabase/
├── functions/               # 18+ Deno Edge Functions
├── migrations/              # Database migration SQL files
└── config.toml              # Supabase CLI configuration

e2e/                         # Playwright E2E tests
scripts/                     # Migration and utility scripts
n8n-workflows/               # N8N automation workflow definitions (JSON)
```

## Architecture

### Routing

The app uses React Router v6. Most authenticated routes render the `Index` page component, which switches visible content based on the URL path. A few pages are standalone (Auth, Signup, Setup, Presentation, HealthCheck, AgentSetup). Non-critical pages are lazy-loaded with `React.lazy()`.

### State Management

- **Zustand** for global client state
- **TanStack React Query** for server state (Supabase data). Default staleTime is 1 minute, retry 1, no refetch on window focus.
- **Custom hooks** for domain logic (see `src/hooks/`)

### Data Layer

- **Supabase** is the backend (PostgreSQL + Auth + Storage + Realtime)
- All Supabase queries must filter by `project_id`
- Types are generated and stored in `src/integrations/supabase/types.ts`
- Edge Functions in `supabase/functions/` run on Deno

### AI Integration

- Anthropic SDK and OpenAI SDK are both used
- 4 agent types: `manager`, `rop`, `nps`, `comments` (defined in `src/lib/agents/agentTypes.ts`)
- RAG implementation in `src/lib/agents/rag.ts` (OpenAI embeddings + pgvector)

## Coding Conventions

### TypeScript

- **Strict mode is OFF** (`noImplicitAny: false`, `strictNullChecks: false`)
- `any` is allowed — ESLint `@typescript-eslint/no-explicit-any` is disabled
- Unused variables are allowed — ESLint `@typescript-eslint/no-unused-vars` is disabled
- Path alias: `@/*` maps to `./src/*`

### Components

- Functional components with hooks only
- PascalCase filenames matching the component name (e.g., `ProjectSelector.tsx`)
- Props interfaces use `Props` suffix (e.g., `ProjectSelectorProps`)
- Feature components live in `src/components/{feature}/`
- Reusable UI primitives live in `src/components/ui/`

### Styling

- Tailwind CSS utility classes everywhere
- Class Variance Authority (CVA) for component variants
- Dark mode only — class-based (`darkMode: ["class"]`)
- Design system: "Interstellar Glass" / Aceternity UI / Deep Dark Mode / Glassmorphism
- Colors use HSL CSS custom properties (e.g., `hsl(var(--primary))`)
- Custom color families: `medical` (blue, teal), `space` (void, nebula, dust), `glow` (cyan, purple, blue), `glass`
- Animations: Framer Motion for UI transitions; Tailwind keyframes for subtle effects
- Fonts: Inter (sans), JetBrains Mono (mono)

### Naming

- `use*` prefix for hooks
- `*Page`, `*Card`, `*Dialog`, `*Selector` suffixes for components
- snake_case for database columns/tables
- camelCase for JS/TS variables and functions

### Notifications

- Toast notifications via Sonner (`sonner` package)
- Positioned top-right with rich colors and close button

## Testing

### Unit Tests (Vitest)

- Config: `vitest.config.ts`
- Environment: JSDOM
- Setup: `src/test/setup.ts` (includes `@testing-library/jest-dom` matchers, mocks `ResizeObserver`)
- Tests colocated with source or in `__tests__/` directories
- Run: `npm run test`

### E2E Tests (Playwright)

- Config: `playwright.config.ts`
- Test directory: `e2e/`
- Browser: Chromium only
- Base URL: `http://localhost:8080`
- Dev server auto-started via `npm run dev`
- CI: single worker, 2 retries, `forbidOnly: true`
- Uses semantic selectors (`getByRole`, `getByLabel`)
- E2E test mode flag: `localStorage.setItem('E2E_TEST_MODE', 'true')`

## Linting

- ESLint 9 flat config (`eslint.config.js`)
- Applies to `**/*.{ts,tsx}` files
- Extends: `@eslint/js` recommended + `typescript-eslint` recommended
- Plugins: `react-hooks`, `react-refresh`
- Many strict rules are OFF (unused vars, explicit any, ban-ts-comment, no-case-declarations)
- Ignored paths: `dist`, `dev-dist`, `n8n-workflows`, `public`, `supabase/.temp`, `FacebookIntegration.tsx`

## Build & Deployment

### Vite Configuration

- Dev server: port 8080, IPv6 (`::`)
- Proxy: `/n8n` routes to `https://n8n.zapoinov.com` (CORS workaround)
- Production drops `console` and `debugger` statements
- Manual chunk splitting for large vendor libs and feature modules
- PWA with auto-update, offline caching, Supabase API runtime cache (NetworkFirst, 24h)
- Image optimization: WebP conversion in production via `vite-imagetools`
- Gzip compression via `vite-plugin-compression`
- Assets < 4KB are inlined

### Deployment Targets

- **Vercel** (primary) — auto-deploys, base path `/`
- **GitHub Pages** (secondary) — base path `/markvision/`

### Node Version

- Required: `>=20 <25` (see `engines` in package.json)
- `.nvmrc` specifies Node 22

## Environment Variables

Required variables (see `.env.example`):

```
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_ANON_KEY   # Supabase anonymous key
ANTHROPIC_API_KEY         # Anthropic API key (for AI features)
OPENAI_API_KEY            # OpenAI API key (for embeddings)
```

## Key Patterns to Follow

1. **Always filter Supabase queries by `project_id`** — this is a multi-tenant system
2. **Use Framer Motion** for all UI animations
3. **Use Recharts** for charts (dark-theme compatible)
4. **Use the `@/` import alias** for all src imports
5. **Use `cn()` from `@/lib/utils`** to merge Tailwind classes
6. **Lazy-load** non-critical page components
7. **Keep the Interstellar Glass design** — dark backgrounds, glassmorphism effects, glow accents
