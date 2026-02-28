import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      if (!navigator.onLine) {
        setIsSupabaseReachable(false);
        return;
      }
      if (document.visibilityState === 'hidden') {
        return;
      }
      try {
        // Lightweight network check: HEAD-only query (no row payload).
        const { error } = await supabase
          .from('daily_data')
          .select('id', { head: true })
          .limit(1);
        
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSupabase();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check immediately and then periodically (keep it sparse to avoid DB load)
    checkSupabase();
    const interval = setInterval(checkSupabase, 2 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && isSupabaseReachable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-2">
      {!isOnline && (
        <Alert variant="destructive" className="mb-2 shadow-2xl shadow-blue-900/5 bg-destructive text-destructive-foreground border-none">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Нет интернета</AlertTitle>
          <AlertDescription>
            Проверьте подключение к сети.
          </AlertDescription>
        </Alert>
      )}
      
      {isOnline && !isSupabaseReachable && (
        <Alert variant="destructive" className="shadow-2xl shadow-blue-900/5 bg-destructive text-destructive-foreground border-none">
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
