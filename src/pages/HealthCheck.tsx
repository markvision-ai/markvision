import { useEffect, useState } from 'react';

export default function HealthCheck() {
  const [api, setApi] = useState<{ status?: string; env?: any; time?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(setApi)
      .catch(() => setError('API недоступен'));
  }, []);

  const env = {
    VITE_SUPABASE_URL: Boolean(import.meta.env.VITE_SUPABASE_URL),
    VITE_SUPABASE_ANON_KEY: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
  };

  return (
    <div className="min-h-screen bg-slate-50 text-foreground p-6">
      <h1 className="text-2xl font-bold mb-4">Health Check</h1>
      <div className="space-y-2">
        <div>Client ENV: URL {env.VITE_SUPABASE_URL ? 'OK' : 'Missing'} / KEY {env.VITE_SUPABASE_ANON_KEY ? 'OK' : 'Missing'}</div>
        <div>Server API: {api?.status || (error || 'Loading...')}</div>
        {api?.env && <pre className="text-xs bg-muted p-3 rounded-lg border border-white/50">{JSON.stringify(api.env, null, 2)}</pre>}
      </div>
    </div>
  );
}
