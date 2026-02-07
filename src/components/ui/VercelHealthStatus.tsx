import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export const VercelHealthStatus = () => {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      fetch('/api/health')
        .then(r => r.json())
        .then((j) => {
          const u = Boolean(j?.env?.VITE_SUPABASE_URL);
          const k = Boolean(j?.env?.VITE_SUPABASE_ANON_KEY);
          setOk(Boolean(j?.status === 'ok' && u && k));
        })
        .catch(() => setOk(false));
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <a href="/health-check" aria-label="Open health check">
        <Badge className={`gap-1 ${ok ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
          {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {ok ? 'Vercel OK' : 'Vercel Check'}
        </Badge>
      </a>
    </div>
  );
};
