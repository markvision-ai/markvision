import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Facebook, CheckCircle, Loader2, Unlink, Instagram, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FacebookIntegrationProps {
  projectId: string;
}

interface FacebookConnection {
  id: string;
  access_token: string;
  connected_at: string;
  platform: 'facebook';
}

const MetaLogo = () => (
  <svg viewBox="0 0 36 36" className="w-6 h-6" fill="currentColor">
    <path d="M20.664 1.872l-8.986 13.5c-.419.628.04 1.478.828 1.478h5.997v17.278c0 .911 1.108 1.363 1.75.714l8.986-13.5c.419-.628-.04-1.478-.828-1.478h-5.997V2.586c0-.911-1.108-1.363-1.75-.714z"/>
  </svg>
);

export const FacebookIntegration = ({ projectId }: FacebookIntegrationProps) => {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connection, setConnection] = useState<FacebookConnection | null>(null);

  const fetchConnection = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('ad_accounts')
        .select('id, access_token, created_at, platform')
        .eq('project_id', projectId)
        .eq('platform', 'facebook')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error fetching Facebook connection:', error);
      }

      if (data) {
        setConnection({
          id: data.id,
          access_token: data.access_token || '',
          connected_at: data.created_at,
          platform: 'facebook'
        });
      } else {
        setConnection(null);
      }
    } catch (error) {
      console.error('Error fetching connection:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  // Обработка OAuth ошибок из URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      const errorMessage = errorDescription 
        ? decodeURIComponent(errorDescription) 
        : 'Ошибка авторизации через Facebook';
      
      toast.error(errorMessage, {
        duration: 5000,
        description: error === 'server_error' ? 'Попробуйте еще раз или обратитесь в поддержку' : undefined
      });
      
      // Очищаем URL от параметров ошибки
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Обработка OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // КРИТИЧЕСКИЙ ЛОГ для отладки
      console.log('🔍 AuthProvider Session:', session);
      console.log('👤 User:', session?.user);
      console.log('📧 Email:', session?.user?.email || 'NO EMAIL');
      console.log('🆔 User ID:', session?.user?.id || 'NO ID');
      console.log('🔗 Identities:', session?.user?.identities);
      console.log('🎫 Provider Token:', session?.provider_token ? 'FOUND ✅' : 'NOT FOUND ❌');
      console.log('🔄 Refresh Token:', session?.provider_refresh_token ? 'FOUND ✅' : 'NOT FOUND ❌');
      
      // Проверяем наличие Facebook identity
      let facebookToken = session?.provider_token;
      
      // Если нет provider_token, ищем в identities
      if (!facebookToken && session?.user?.identities) {
        const facebookIdentity = session.user.identities.find((id: any) => id.provider === 'facebook');
        if (facebookIdentity) {
          console.log('🔍 Found Facebook identity:', facebookIdentity);
          // Токен может быть в identity_data
          facebookToken = facebookIdentity.identity_data?.access_token;
        }
      }
      
      console.log('🎯 Final Facebook token:', facebookToken ? 'FOUND ✅' : 'NOT FOUND ❌');
      
      // Если есть сессия с токеном (даже без email)
      if (facebookToken && session?.user) {
        console.log('📱 Facebook OAuth успешен, сохраняем токен...');
        console.log('💾 Saving to project:', projectId);
        
        try {
          // Используем user.id как уникальный идентификатор
          const userId = session.user.id;
          const userEmail = session.user.email || `facebook_user_${userId}`;
          
          console.log('✍️ User identifier:', userId);
          console.log('📧 Using email:', userEmail);
          
          // Сохраняем в ad_accounts для твоего проекта
          const targetProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';
          
          const { data, error } = await supabase
            .from('ad_accounts')
            .upsert({
              project_id: targetProjectId,
              platform: 'facebook',
              external_id: `facebook_oauth_${userId}`,
              access_token: facebookToken, // Используем найденный токен
              status: 'active'
            }, { 
              onConflict: 'project_id,platform,external_id'
            })
            .select()
            .single();

          if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
          }

          if (data) {
            console.log('✅ Token saved successfully:', data.id);
            setConnection({
              id: data.id,
              access_token: data.access_token || '',
              connected_at: data.created_at,
              platform: 'facebook'
            });
          }

          toast.success('Facebook & Instagram подключены! 🎉', {
            description: 'Теперь можно синхронизировать данные о рекламе'
          });

          // Очистка URL от OAuth параметров
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error: any) {
          console.error('❌ Error saving Facebook token:', error);
          toast.error('Ошибка сохранения токена: ' + (error.message || 'Неизвестная ошибка'));
        }
      } else if (session?.user && !session?.provider_token) {
        console.log('⚠️ User found but NO provider token');
      }
    };

    handleOAuthCallback();
  }, [projectId]);

  const handleConnect = async () => {
    setConnecting(true);
    
    try {
      // Проверяем текущую сессию
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      console.log('🔍 Current session:', currentSession?.user?.email);
      
      // Если пользователь уже авторизован - используем linkIdentity
      if (currentSession?.user) {
        console.log('👤 User already logged in, using linkIdentity');
        
        // Определяем правильный redirect URL
        const isProduction = window.location.hostname === 'markvision-alpha.vercel.app';
        const redirectUrl = isProduction 
          ? 'https://markvision-alpha.vercel.app/integrations'
          : `${window.location.origin}/integrations`;
        
        console.log('🔗 OAuth redirect URL:', redirectUrl);
        
        // Используем linkIdentity для связывания аккаунтов
        const { data, error } = await supabase.auth.linkIdentity({
          provider: 'facebook',
          options: {
            redirectTo: redirectUrl,
            scopes: 'ads_read,instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement',
          },
        });

        if (error) {
          console.error('❌ linkIdentity error:', error);
          toast.error('Ошибка связывания аккаунта: ' + error.message);
        } else {
          console.log('✅ linkIdentity success:', data);
        }
      } else {
        // Если пользователь не авторизован - используем signInWithOAuth
        console.log('🆕 No user session, using signInWithOAuth');
        
        const isProduction = window.location.hostname === 'markvision-alpha.vercel.app';
        const redirectUrl = isProduction 
          ? 'https://markvision-alpha.vercel.app/integrations'
          : `${window.location.origin}/integrations`;
        
        console.log('🔗 OAuth redirect URL:', redirectUrl);
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            redirectTo: redirectUrl,
            scopes: 'ads_read,instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement',
          },
        });

        if (error) {
          console.error('❌ OAuth error:', error);
          toast.error('Ошибка подключения к Facebook: ' + error.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      toast.error('Ошибка подключения: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;

    setDisconnecting(true);
    
    try {
      const { error } = await supabase
        .from('ad_accounts')
        .delete()
        .eq('id', connection.id);

      if (error) throw error;

      setConnection(null);
      toast.success('Facebook & Instagram отключены');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Ошибка отключения');
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = !!connection;

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-lg border border-border/50 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
        "bg-card/50 backdrop-blur-lg border",
        isConnected 
          ? "border-blue-500/30 shadow-lg shadow-blue-500/10" 
          : "border-border/50 hover:border-border"
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            isConnected 
              ? "from-blue-500 via-indigo-500 to-purple-500" 
              : "from-blue-500/20 via-indigo-500/20 to-purple-500/20"
          )}
        />
      </div>

      {/* Pulsing effect when connected */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <motion.div
              className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-blue-500/20 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
              isConnected 
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30" 
                : "bg-blue-500/10 text-blue-500"
            )}>
              <MetaLogo />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Facebook & Instagram
                {isConnected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </motion.div>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                Реклама, Insights и Instagram контент
              </p>
            </div>
          </div>

          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className={cn(
              "transition-all",
              isConnected && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            )}
          >
            {isConnected ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Активно
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mr-2" />
                Не подключено
              </>
            )}
          </Badge>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/50">
            <Facebook className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-muted-foreground">Facebook Ads</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/50">
            <Instagram className="w-3.5 h-3.5 text-pink-500" />
            <span className="text-muted-foreground">Instagram</span>
          </div>
        </div>

        {/* Connection Info */}
        {isConnected && connection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-muted-foreground bg-background/30 rounded-lg p-3 border border-border/30"
          >
            <div className="flex items-center justify-between">
              <span>Подключено:</span>
              <span className="font-mono">
                {new Date(connection.connected_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 transition-all"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Подключение...
                </>
              ) : (
                <>
                  <MetaLogo />
                  <span className="ml-2">Привязать Facebook & Instagram</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              disabled={disconnecting}
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отключение...
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4 mr-2" />
                  Отключить
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
