# CLAUDE.md — MarkVision AI

Guidelines for AI assistants working on this codebase.

## Project Overview

MarkVision AI is a marketing analytics platform for medical clinic networks. It provides CRM, ad management, content factory, A/B testing, financial analytics, AI agents, and multi-channel communication — all in a single SPA.

## Tech Stack

- **Framework**: React 18 + TypeScript 5.8 + Vite 5
- **UI**: Tailwind CSS 3 + shadcn/ui (Radix primitives) + Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **State**: TanStack React Query (server state) + Zustand (client state)
- **Charts**: Recharts (dark-mode compatible)
- **AI**: Anthropic SDK + OpenAI (embeddings/RAG)
- **Deploy**: Vercel (frontend) + Supabase (backend)
- **Node**: v22 (see `.nvmrc`)

## Quick Start

```bash
npm install
npm run dev        # Dev server on http://localhost:8080
npm run build      # Production build
npm run lint       # ESLint
npm test           # Vitest unit tests
```

## Project Structure

```
src/
├── components/    # Feature-organized React components (35+ domains)
│   ├── ui/        # Base shadcn/ui primitives (40+ components)
│   ├── dashboard/ # Dashboard widgets
│   ├── ads/       # Ad management (Meta/QuantumAds)
│   ├── crm/       # CRM & lead management
│   ├── factory/   # Content factory with AI
│   ├── finance/   # Financial analytics
│   ├── analytics/ # Analytics & AI assistant
│   └── ...
├── hooks/         # Custom React hooks (43 hooks)
├── lib/           # Utilities (utils, validation, dateUtils, chartUtils, RAG)
├── pages/         # Route-level page components (16 pages)
├── services/      # Service layer (healthCheckService)
├── integrations/  # Supabase client & generated types
├── constants/     # App-wide constants
├── App.tsx        # Root component with lazy-loaded routes
└── main.tsx       # Entry point
supabase/          # Migrations & edge functions
e2e/               # Playwright end-to-end tests
api/               # Vercel API routes
```

## Key Conventions

### Path Aliases
All imports use `@/` alias mapped to `src/`:
```ts
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
```

### Naming
- **Components**: PascalCase files (`AnalyticsPlatform.tsx`)
- **Hooks**: `use` prefix, camelCase (`useProjectData.ts`)
- **Utilities**: camelCase (`chartUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE values

### Component Patterns
- Functional components with hooks only (no class components)
- `React.lazy()` + `Suspense` for heavy route-level code splitting
- Custom hooks extract all data-fetching and business logic
- `cn()` utility for conditional Tailwind class merging
- Toast notifications via Sonner (`toast.success/error/info`)

### State Management
- **Server state**: TanStack React Query for cacheable queries/mutations
- **Client state**: Zustand stores for UI-only state
- **Auth**: `useAuth()` hook → Supabase Auth with role checks from `user_roles` table
- **Project context**: `useProjects()` → project list + active project ID in localStorage

### Data Access
- All queries filter by `project_id` (multi-tenant isolation)
- Supabase RLS enforces row-level security
- Realtime subscriptions via Supabase channels (with proper cleanup)
- Types generated from Supabase schema in `src/integrations/supabase/types.ts`

## Critical Rules

### No Meta API Calls from UI
Meta Ads sync MUST NOT be triggered from React components. The UI only reads from `daily_data` and `ad_performance_logs` Supabase tables. Sync should happen server-side via:
- Supabase Edge Function + cron (recommended)
- Vercel Cron + serverless function

The manual "Live Sync" button in ActiveAdsManager is the ONLY exception (user-initiated).

### useEffect Discipline
These patterns caused production infinite loops and must be avoided:

1. **Never put mutable state in useCallback deps when that callback sets that state**:
   ```ts
   // BAD — infinite loop
   const fetch = useCallback(() => { setFoo(...) }, [foo]);
   useEffect(() => { fetch() }, [fetch]);

   // GOOD — use ref to read current value
   const fooRef = useRef(foo);
   const fetch = useCallback(() => { /* read fooRef.current */ }, []);
   ```

2. **Never use object/array in useCallback/useEffect deps**:
   ```ts
   // BAD — dateRange is new object every render
   useCallback(fn, [projectId, dateRange]);

   // GOOD — derive a stable primitive key
   const dateRangeKey = useMemo(() => `${from}_${to}`, [from, to]);
   useCallback(fn, [projectId, dateRangeKey]);
   ```

3. **Always add re-entry guards for async effects**:
   ```ts
   const loadingRef = useRef(false);
   const fetch = useCallback(async () => {
     if (loadingRef.current) return;
     loadingRef.current = true;
     try { ... } finally { loadingRef.current = false; }
   }, [deps]);
   ```

4. **Throttle realtime subscription handlers** (min 30s between refetches).

5. **One log per operation**: one `console.log` at start, one at completion. No intermediate spam.

### TypeScript
- `strict: false` in tsconfig (loose mode for rapid development)
- Many ESLint rules disabled (`no-unused-vars`, `no-explicit-any`)
- Use `@ts-nocheck` sparingly and only in existing files that already have it

### Testing
- **Unit**: Vitest + @testing-library/react (`npm test`)
- **E2E**: Playwright (`npx playwright test`), test dir: `e2e/`
- E2E uses `E2E_TEST_MODE` localStorage flag to bypass auth in dev
- Vitest setup mocks `ResizeObserver` for Recharts compatibility

## Build & Deploy

- **Dev server**: `npm run dev` → port 8080, IPv6 enabled
- **Build**: `npm run build` → Vite production build to `dist/`
- **Code splitting**: Manual chunks in `vite.config.ts` (react-vendor, ui-vendor, chart-vendor, etc.)
- **PWA**: Workbox service worker with NetworkFirst strategy for Supabase API
- **Vercel**: Auto-deploy from main branch, SPA rewrites in `vercel.json`
- **GitHub Pages**: Alternative deploy via `.github/workflows/deploy.yml`

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-key     # For AI features
OPENAI_API_KEY=your-key        # For RAG embeddings
```

## Common Tasks

### Adding a new feature page
1. Create component in `src/components/<feature>/`
2. Add lazy import in `src/App.tsx`
3. Add route in the router configuration
4. Create custom hook in `src/hooks/` for data fetching

### Adding a new hook
1. Create in `src/hooks/useMyHook.ts`
2. Use `useCallback` with stable primitive deps
3. Add `loadingRef` guard for async operations
4. Keep console logs minimal (dev-only if needed)

### Working with Supabase
- Client: `src/integrations/supabase/client.ts`
- Types: `src/integrations/supabase/types.ts`
- Migrations: `supabase/migrations/`
- Always filter by `project_id` in queries
