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
            <div className={`mt-4 px-3 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300 ${ok
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40'
              } backdrop-blur-md`}>
              <div className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-medium tracking-wide">{ok ? 'SYSTEM ONLINE' : 'CHECKING...'}</span>
            </div>
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
