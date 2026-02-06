import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSupabaseReachable, setIsSupabaseReachable] = useState(true);

  useEffect(() => {
    // Check browser online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Supabase reachability
    const checkSupabase = async () => {
      try {
        // Simple health check: try to get session or just ping
        // Since we can't ping standard health endpoints easily without CORS issues on some setups,
        // we'll try a lightweight public query or auth check.
        // auth.getSession is fast and local-first usually, but if we want to check NETWORK,
        // we should try a real request.
        
        // We'll try to select from a public table or just check system status if possible.
        // Or simply try to access auth configuration.
        const { error } = await supabase.from('daily_data').select('id').limit(1).maybeSingle();
        
        // If we get a network error (like TypeError: Failed to fetch), it means blocked or offline.
        // Supabase-js usually returns { data, error } but throws on network failure in some versions,
        // or returns error with specific message.
        if (error && error.message && (
            error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('Failed to fetch')
        )) {
            setIsSupabaseReachable(false);
            // Only warn in dev, don't error
            if (import.meta.env.DEV) {
               console.warn('Supabase connectivity check failed (network):', error.message);
            }
        } else {
            setIsSupabaseReachable(true);
        }
      } catch (err) {
        // This catches fetch errors (ERR_ABORTED often throws here)
        // Suppress console error for polling checks to avoid noise
        if (import.meta.env.DEV && (err as Error).message !== 'Failed to fetch') {
           console.warn('Supabase connectivity check failed:', err);
        }
        setIsSupabaseReachable(false);
      }
    };

    // Check immediately and then every 30 seconds
    checkSupabase();
    const interval = setInterval(checkSupabase, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && isSupabaseReachable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-2">
      {!isOnline && (
        <Alert variant="destructive" className="mb-2 shadow-lg bg-destructive text-destructive-foreground border-none">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Нет интернета</AlertTitle>
          <AlertDescription>
            Проверьте подключение к сети.
          </AlertDescription>
        </Alert>
      )}
      
      {isOnline && !isSupabaseReachable && (
        <Alert variant="destructive" className="shadow-lg bg-destructive text-destructive-foreground border-none">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ошибка подключения к серверу</AlertTitle>
          <AlertDescription>
            Не удается связаться с базой данных. Возможные причины:
            <ul className="list-disc list-inside mt-1 text-xs opacity-90">
              <li>Блокировщик рекламы (AdBlock/uBlock) блокирует запросы</li>
              <li>Сетевые ограничения (VPN/Firewall)</li>
              <li>Проблемы на сервере Supabase</li>
            </ul>
            <div className="mt-2 text-xs font-bold underline cursor-pointer" onClick={() => window.location.reload()}>
              Попробовать обновить страницу
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
