import markvisionLogo from '@/assets/markvision-logo.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, Loader2,
  ArrowLeft, AlertTriangle, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type AuthMode = 'login' | 'signup' | 'forgot-password';

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
    if (import.meta.env.DEV) console.error('Failed to log auth event:', error);
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
        description: error === 'server_error' ? 'Попробуйте ещё раз или обратитесь в поддержку' : undefined
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Connection check
  useEffect(() => {
    const verifyConnection = async () => {
      setCheckingConnection(true);
      const MAX_RETRIES = 3;
      let lastError: string | null = null;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const { error } = await supabase.from('projects').select('count').limit(1);
          if (!error) { setConnectionError(null); setCheckingConnection(false); return; }
          lastError = error.message;
        } catch (e: any) {
          lastError = e.message || 'Ошибка подключения к базе данных';
        }
        if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * attempt));
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
        if (hasOAuthParams) { navigate('/integrations'); return; }

        const { data: accessData } = await supabase
          .from('project_access').select('project_id').eq('user_id', userId).limit(1);
        const { data: roleData } = await supabase
          .from('user_roles').select('role').eq('user_id', userId).maybeSingle();
        const isAdmin = roleData?.role === 'admin' || roleData?.role === 'super_admin';

        navigate(!isAdmin && (!accessData || accessData.length === 0) ? '/setup' : '/');
      } catch { navigate('/'); }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) await checkUserProjects(session.user.id);
    });
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await checkUserProjects(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Введите email'); return; }
    if (mode !== 'forgot-password' && !password) { toast.error('Введите пароль'); return; }
    if (mode !== 'forgot-password' && password.length < 6) { toast.error('Пароль должен быть минимум 6 символов'); return; }

    setLoading(true);
    try {
      if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) { toast.error('Ошибка отправки письма. Попробуйте позже.'); return; }
        toast.success('Письмо для сброса пароля отправлено!');
        setMode('login');

      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) toast.error('Неверный email или пароль');
          else if (error.message.includes('Email not confirmed')) toast.error('Email не подтверждён. Проверьте почту.');
          else toast.error('Ошибка входа: ' + error.message);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) logAuthEvent(session.user.id, session.user.email || email, 'login');
        toast.success('Добро пожаловать!');

      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: name || email.split('@')[0] }
          }
        });
        if (signUpError) {
          if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered'))
            toast.error('Этот email уже зарегистрирован. Попробуйте войти.');
          else toast.error('Ошибка регистрации: ' + signUpError.message);
          return;
        }
        if (signUpData.session) {
          logAuthEvent(signUpData.user!.id, signUpData.user!.email || email, 'create');
          toast.success('Регистрация успешна! Добро пожаловать!');
          navigate('/');
          return;
        }
        if (signUpData.user && !signUpData.session) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) { toast.info('Проверьте почту для подтверждения регистрации'); return; }
          if (signInData.session) {
            logAuthEvent(signInData.user.id, signInData.user.email || email, 'create');
            toast.success('Регистрация успешна! Добро пожаловать!');
            navigate('/');
            return;
          }
        }
        toast.success('Регистрация успешна!');
      }
    } catch { toast.error('Произошла ошибка'); }
    finally { setLoading(false); }
  };

  const getTitle = () => {
    if (mode === 'login') return 'Вход в систему';
    if (mode === 'signup') return 'Создание аккаунта';
    return 'Восстановление';
  };

  const getSubtitle = () => {
    if (mode === 'login') return 'Войдите в свой аккаунт для продолжения';
    if (mode === 'signup') return 'Создайте аккаунт для начала работы';
    return 'Введите email для получения ссылки восстановления';
  };

  const getButtonText = () => {
    if (mode === 'login') return 'Войти';
    if (mode === 'signup') return 'Зарегистрироваться';
    return 'Отправить ссылку';
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (checkingConnection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 interstellar-glass border border-white/10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Подключение к базе данных…</p>
        </motion.div>
      </div>
    );
  }

  // ── Connection error ───────────────────────────────────────────────────────
  if (connectionError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md interstellar-glass border border-rose-500/20 rounded-3xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
            <h2 className="text-xl font-semibold text-rose-400">Ошибка подключения</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Не удалось подключиться к базе данных. Возможные причины:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside mb-4 space-y-1">
            <li>Неверный VITE_SUPABASE_URL</li>
            <li>Неверный VITE_SUPABASE_ANON_KEY</li>
            <li>База данных недоступна</li>
          </ul>
          <div className="rounded-xl p-3 font-mono text-xs break-all text-rose-300 bg-rose-500/10 border border-rose-500/20 mb-4">
            {connectionError}
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full border-white/10 hover:bg-white/5">
            Попробовать снова
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Main Auth form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">

      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-40 w-[600px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-40 w-[500px] h-[400px] rounded-full bg-cyan-500/8 blur-[100px]" />
        <div className="absolute top-3/4 left-1/2 -translate-x-1/2 w-[800px] h-[200px] rounded-full bg-emerald-500/5 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + Brand */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto relative flex items-center justify-center overflow-hidden rounded-2xl interstellar-glass border border-white/10 shadow-2xl mb-4">
            <img src={markvisionLogo} alt="MarkVision AI" className="w-full h-full object-contain scale-110" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="bg-gradient-to-r from-primary via-cyan-300 to-primary bg-clip-text text-transparent">
              MarkVision AI
            </span>
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Умный маркетинг для медицинских клиник
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="interstellar-glass border border-white/[0.07] rounded-3xl p-6 sm:p-8 shadow-2xl">

            {/* Back button (forgot-password) */}
            {mode === 'forgot-password' && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                type="button"
                onClick={() => setMode('login')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад ко входу
              </motion.button>
            )}

            {/* Tab switcher */}
            {mode !== 'forgot-password' && (
              <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5 border border-white/[0.06]">
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${mode === m
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }`}
                  >
                    {m === 'login' ? 'Вход' : 'Регистрация'}
                  </button>
                ))}
              </div>
            )}

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-1.5 text-foreground">
              {getTitle()}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              {getSubtitle()}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name field (signup only) */}
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <label className="text-sm font-medium text-foreground/80">Имя</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Input
                      type="text"
                      placeholder="Ваше имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 focus-visible:border-primary/40"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 focus-visible:border-primary/40"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'forgot-password' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-11 h-12 rounded-xl bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 focus-visible:border-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Forgot password link */}
              {mode === 'login' && (
                <div className="text-right -mt-1">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-sm text-primary/80 hover:text-primary transition-colors"
                  >
                    Забыли пароль?
                  </button>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white border-0 shadow-lg shadow-primary/25 transition-all duration-300 mt-2"
                disabled={loading}
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  : <Sparkles className="w-4 h-4 mr-2" />
                }
                {getButtonText()}
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground/50 mt-6"
        >
          © 2026 MarkVision AI. Все права защищены.
        </motion.p>
      </motion.div>
    </div>
  );
}
