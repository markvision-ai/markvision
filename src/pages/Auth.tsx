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
          const { error } = await supabase.from('projects').select('count').limit(1);
          if (!error) {
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

  // Loading state - light theme
  if (checkingConnection) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-white border border-slate-200 shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-slate-600">Подключение к базе данных...</p>
        </motion.div>
      </div>
    );
  }

  // Connection error - light theme
  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl p-6 bg-white border border-red-200 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <h2 className="text-xl font-semibold text-red-600">Ошибка подключения</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Не удалось подключиться к базе данных. Возможные причины:
          </p>
          <ul className="text-sm text-slate-500 list-disc list-inside mb-4 space-y-1">
            <li>Неверный VITE_SUPABASE_URL</li>
            <li>Неверный VITE_SUPABASE_ANON_KEY</li>
            <li>База данных недоступна</li>
          </ul>
          <div className="rounded-lg p-3 font-mono text-xs break-all text-slate-700 bg-slate-50 border border-slate-200">
            {connectionError}
          </div>
          <Button onClick={() => window.location.reload()} className="w-full mt-4" variant="outline">
            Попробовать снова
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 safe-area-top safe-area-bottom relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-[600px] h-[500px] rounded-full bg-blue-400/10 blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[400px] rounded-full bg-purple-400/10 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative z-10"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto relative flex items-center justify-center overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-xl">
            <img src={markvisionLogo} alt="MarkVision AI" className="w-full h-full object-contain drop-shadow-md scale-125" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold -mt-2 text-slate-900">
            <span className="bg-gradient-to-r from-primary via-cyan-600 to-primary bg-clip-text text-transparent">
              MarkVision AI
            </span>
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Умный маркетинг для медицинских клиник
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          <div className="relative rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl">
            {mode === 'forgot-password' && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                type="button"
                onClick={() => setMode('login')}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад к входу
              </motion.button>
            )}

            {mode !== 'forgot-password' && (
              <div className="flex gap-2 mb-6 p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    mode === 'login'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    mode === 'signup'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  Регистрация
                </button>
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2 text-slate-900">
              {getTitle()}
            </h2>

            <p className="text-sm text-slate-600 text-center mb-6">
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
                  <label className="text-sm font-medium text-slate-700">Имя</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <Input
                      type="text"
                      placeholder="Ваше имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900"
                    />
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              {mode !== 'forgot-password' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
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
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Забыли пароль?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white transition-all duration-300 border-0 shadow-lg shadow-primary/25"
                disabled={loading}
              >
                <span className="flex items-center justify-center">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {getButtonText()}
                </span>
              </Button>
            </form>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-slate-500 mt-6"
        >
          © 2025 MarkVision AI. Все права защищены.
        </motion.p>
      </motion.div>
    </div>
  );
}
