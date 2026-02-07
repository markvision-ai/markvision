import markvisionLogo from '@/assets/markvision-logo.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
type AuthMode = 'login' | 'signup' | 'forgot-password';

// Standalone audit log function for auth events (can't use hook before user exists)
const logAuthEvent = async (userId: string, userEmail: string, action: 'login' | 'logout' | 'create') => {
  try {
    await supabase.from('audit_logs').insert([{
      user_id: userId,
      user_email: userEmail,
      action,
      entity_type: 'session',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    }]);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to log auth event:', error);
    }
  }
};
export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // OAuth error handling from URL
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

      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Connection check with retry logic
  useEffect(() => {
    const verifyConnection = async () => {
      setCheckingConnection(true);
      const MAX_RETRIES = 3;
      let lastError: string | null = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          // Проверяем доступность Supabase.
          // Если получаем ошибку прав доступа (PGRST301) или 401/403 - значит сервер ответил, все ок.
          // Если ошибка сети (Failed to fetch) - значит проблема.
          const { error } = await supabase.from('projects').select('count', { count: 'exact', head: true });

          if (!error) {
            setConnectionError(null);
            setCheckingConnection(false);
            return;
          }

          // Анализируем ошибку
          const msg = error.message.toLowerCase();
          // Признаки того, что сервер живой, просто нет прав (это нормально для страницы входа)
          if (error.code === 'PGRST301' || error.code === '401' || error.code === '403' ||
            msg.includes('policy') || msg.includes('permission') || msg.includes('authorized')) {
            setConnectionError(null);
            setCheckingConnection(false);
            return;
          }

          lastError = error.message;
        } catch (e: any) {
          lastError = e.message || 'Ошибка подключения к базе данных';
        }

        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      // Если мы здесь, значит все попытки провалились с реальной ошибкой (сеть и т.д.)
      setConnectionError(lastError);
      setCheckingConnection(false);
    };
    verifyConnection();
  }, []);

  useEffect(() => {
    const checkUserProjects = async (userId: string) => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = hashParams.has('access_token') || searchParams.has('code') || searchParams.has('error');

        if (hasOAuthParams) {
          console.log('OAuth params detected in Auth.tsx, redirecting to /integrations');
          navigate('/integrations');
          return;
        }

        const { data: accessData } = await supabase
          .from('project_access')
          .select('project_id')
          .eq('user_id', userId)
          .limit(1);

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        const isAdmin = roleData?.role === 'admin' || roleData?.role === 'super_admin';

        if (!isAdmin && (!accessData || accessData.length === 0)) {
          navigate('/setup');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking user projects:', error);
        navigate('/');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await checkUserProjects(session.user.id);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await checkUserProjects(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Введите email');
      return;
    }
    if (mode !== 'forgot-password' && !password) {
      toast.error('Введите пароль');
      return;
    }
    if (mode !== 'forgot-password' && password.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) {
          toast.error('Ошибка отправки письма. Попробуйте позже.');
          return;
        }
        toast.success('Письмо для сброса пароля отправлено на вашу почту!');
        setMode('login');
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Неверный email или пароль');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Email не подтверждён. Проверьте почту.');
          } else if (error.message.includes('Invalid API key')) {
            toast.error('Ошибка API ключа. Ключи Supabase неверные.');
          } else if (error.message.includes('Database') || error.message.includes('not found')) {
            toast.error('База данных не найдена: ' + error.message);
          } else {
            toast.error('Ошибка входа: ' + error.message);
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          logAuthEvent(session.user.id, session.user.email || email, 'login');
        }
        toast.success('Добро пожаловать!');
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name || email.split('@')[0]
            }
          }
        });
        if (signUpError) {
          if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
            toast.error('Этот email уже зарегистрирован. Попробуйте войти.');
          } else if (signUpError.message.includes('Password')) {
            toast.error('Пароль не соответствует требованиям');
          } else {
            toast.error('Ошибка регистрации: ' + signUpError.message);
          }
          return;
        }

        if (signUpData.session) {
          logAuthEvent(signUpData.user!.id, signUpData.user!.email || email, 'create');
          toast.success('Регистрация успешна! Добро пожаловать!');
          navigate('/');
          return;
        }

        if (signUpData.user && !signUpData.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (signInError) {
            toast.info('Проверьте почту для подтверждения регистрации');
            return;
          }
          if (signInData.session) {
            logAuthEvent(signInData.user.id, signInData.user.email || email, 'create');
            toast.success('Регистрация успешна! Добро пожаловать!');
            navigate('/');
            return;
          }
        }
        toast.success('Регистрация успешна!');
      }
    } catch (error: any) {
      toast.error('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Вход в систему';
      case 'signup':
        return 'Создание аккаунта';
      case 'forgot-password':
        return 'Восстановление';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'login':
        return 'Войти';
      case 'signup':
        return 'Зарегистрироваться';
      case 'forgot-password':
        return 'Отправить ссылку';
    }
  };

  // Loading state - Interstellar theme
  if (checkingConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(230 30% 3%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="relative mx-auto mb-6"
            animate={{
              boxShadow: [
                "0 0 30px hsl(192 100% 50% / 0.2)",
                "0 0 50px hsl(192 100% 50% / 0.4)",
                "0 0 30px hsl(192 100% 50% / 0.2)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </motion.div>
          <p className="text-white/60">Подключение к базе данных...</p>
        </motion.div>
      </div>
    );
  }

  // Connection error - Interstellar theme
  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(230 30% 3%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 0 40px rgba(239, 68, 68, 0.1)'
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <h2 className="text-xl font-semibold text-red-400">Ошибка подключения</h2>
          </div>
          <p className="text-sm text-white/60 mb-4">
            Не удалось подключиться к базе данных. Возможные причины:
          </p>
          <ul className="text-sm text-white/50 list-disc list-inside mb-4 space-y-1">
            <li>Неверный VITE_SUPABASE_URL</li>
            <li>Неверный VITE_SUPABASE_ANON_KEY</li>
            <li>База данных недоступна</li>
          </ul>
          <div className="rounded-lg p-3 font-mono text-xs break-all text-white/70"
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {connectionError}
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="w-full mt-4 interstellar-button-ghost"
          >
            Попробовать снова
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 safe-area-top safe-area-bottom relative overflow-hidden"
      style={{ background: 'hsl(230 30% 3%)' }}>

      {/* Interstellar Nebula Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated nebula clouds */}
        <motion.div
          className="absolute top-1/4 -left-32 w-[600px] h-[500px] rounded-full"
          style={{ background: 'hsl(192 100% 50% / 0.08)', filter: 'blur(100px)' }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[500px] h-[400px] rounded-full"
          style={{ background: 'hsl(270 60% 50% / 0.06)', filter: 'blur(80px)' }}
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full"
          style={{ background: 'hsl(220 80% 50% / 0.04)', filter: 'blur(120px)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            className="w-24 h-24 sm:w-32 sm:h-32 mx-auto relative flex items-center justify-center overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            animate={{
              boxShadow: [
                "0 0 30px hsl(192 100% 50% / 0.2)",
                "0 0 50px hsl(192 100% 50% / 0.35)",
                "0 0 30px hsl(192 100% 50% / 0.2)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src={markvisionLogo} alt="MarkVision AI" className="w-full h-full object-contain drop-shadow-md scale-125" />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-bold -mt-2">
            <span
              className="bg-gradient-to-r from-primary via-cyan-300 to-primary bg-clip-text text-transparent"
              style={{ textShadow: '0 0 30px hsl(192 100% 50% / 0.5)' }}
            >
              MarkVision AI
            </span>
          </h1>
          <p className="text-white/50 mt-2 text-sm sm:text-base">
            Умный маркетинг для медицинских клиник
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative group"
        >
          {/* Hover glow effect */}
          <div
            className="absolute -inset-[1px] rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, hsl(192 100% 50% / 0.2), transparent 50%, hsl(270 60% 50% / 0.1))',
              filter: 'blur(2px)'
            }}
          />

          <div
            className="relative rounded-3xl p-6 sm:p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(24px) saturate(1.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 16px 48px rgba(0, 0, 0, 0.4)'
            }}
          >
            {mode === 'forgot-password' && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                type="button"
                onClick={() => setMode('login')}
                className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад к входу
              </motion.button>
            )}

            {/* Mode Switcher */}
            {mode !== 'forgot-password' && (
              <div
                className="flex gap-2 mb-6 p-1 rounded-xl"
                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
              >
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${mode === 'login'
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}
                  style={mode === 'login' ? {
                    background: 'hsl(192 100% 50% / 0.15)',
                    border: '1px solid hsl(192 100% 50% / 0.3)',
                    boxShadow: '0 0 20px hsl(192 100% 50% / 0.15)'
                  } : {}}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${mode === 'signup'
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}
                  style={mode === 'signup' ? {
                    background: 'hsl(192 100% 50% / 0.15)',
                    border: '1px solid hsl(192 100% 50% / 0.3)',
                    boxShadow: '0 0 20px hsl(192 100% 50% / 0.15)'
                  } : {}}
                >
                  Регистрация
                </button>
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2 text-white">
              {getTitle()}
            </h2>

            <p className="text-sm text-white/50 text-center mb-6">
              {mode === 'login' && 'Войдите в свой аккаунт для продолжения'}
              {mode === 'signup' && 'Создайте аккаунт для начала работы'}
              {mode === 'forgot-password' && 'Введите email для получения ссылки восстановления'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-white/70">Имя</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      type="text"
                      placeholder="Ваше имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-11 h-12 rounded-xl interstellar-input"
                    />
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors z-10" />
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl interstellar-input"
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Пароль</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-12 rounded-xl interstellar-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-sm text-primary/80 hover:text-primary transition-colors"
                  >
                    Забыли пароль?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold relative overflow-hidden
                           bg-gradient-to-r from-primary to-cyan-400 text-black
                           hover:-translate-y-0.5 transition-all duration-300 border-0"
                style={{
                  boxShadow: '0 4px 20px hsl(192 100% 50% / 0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
                disabled={loading}
              >
                {/* Shimmer effect */}
                <span
                  className="absolute inset-0 animate-[interstellar-shimmer_3s_ease-in-out_infinite]"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    transform: 'translateX(-100%)'
                  }}
                />
                <span className="relative flex items-center justify-center">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {getButtonText()}
                </span>
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-white/30 mt-6"
        >
          © 2025 MarkVision AI. Все права защищены.
        </motion.p>
      </motion.div>
    </div>
  );
}
