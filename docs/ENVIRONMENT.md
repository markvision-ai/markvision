# Environment Variables Documentation

**CRITICAL**: You must add these variables to your Vercel Project Settings (Settings -> Environment Variables) for the application to function correctly.

## 1. Supabase (Required)
These are used to connect to your backend.
- `VITE_SUPABASE_URL`: `https://pyscczcuersdjvpmkiec.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (The long key you provided)

## 2. Social Auth (Provider Configuration)
**Note:** The `FB_APP_ID`, `FB_APP_SECRET`, and `FB_ACCESS_TOKEN` are **NOT** used in the frontend code directly.
These usually belong in **Supabase Dashboard → Authentication → Providers → Facebook**.
*   `FB_ACCESS_TOKEN`: The long user token you provided is for server-side API calls.

## 3. N8N Integration (Optional but Recommended)
Used for automation workflows.
- `VITE_N8N_DISPATCHER_URL`
  - *Default if missing:* `https://n8n.zapoinov.com/webhook/execute-any-flow-new`
- `N8N_API_TOKEN`: The JWT you provided is for securing n8n. If you enable auth on n8n webhook nodes, you'll need to add a header in `src/components/automation/AutomationPage.tsx`. Currently, it is **open**.

## 4. Deployment specific
- `VERCEL="1"` (Set automatically by Vercel)
