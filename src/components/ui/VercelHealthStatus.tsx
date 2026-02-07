import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle, Globe } from 'lucide-react';

export const VercelHealthStatus = () => {
  const [ok, setOk] = useState<boolean | null>(null);
  const [details, setDetails] = useState<{ time?: string; env?: any } | null>(null);

  useEffect(() => {
    const check = () => {
      fetch('/api/health')
        .then(r => r.json())
        .then((j) => {
          const u = Boolean(j?.env?.VITE_SUPABASE_URL);
          const k = Boolean(j?.env?.VITE_SUPABASE_ANON_KEY);
          setOk(Boolean(j?.status === 'ok' && u && k));
          setDetails({ time: j?.time, env: j?.env });
        })
        .catch(() => {
          setOk(false);
          setDetails(null);
        });
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <a href="/health-check" aria-label="Open health check">
            <Badge className={`gap-1 ${ok ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
              {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {ok ? 'Vercel OK' : 'Vercel Check'}
            </Badge>
          </a>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-3 h-3" />
            <span>Server Health</span>
          </div>
          <div>Time: {details?.time || '—'}</div>
          <div>URL: {details?.env?.VITE_SUPABASE_URL ? 'OK' : 'Missing'}</div>
          <div>KEY: {details?.env?.VITE_SUPABASE_ANON_KEY ? 'OK' : 'Missing'}</div>
          <div className="mt-1 opacity-70">Click badge for full check</div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
