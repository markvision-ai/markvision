import markvisionLogo from '@/assets/markvision-logo.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, Loader2,
  ArrowLeft, AlertTriangle, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] border-2 border-primary/20 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.3em]">MarkVision <span className="text-primary italic">OS</span></h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Initializing Neural Core...</p>
        </div>
      </div>
    );
  }

  // ── Connection error ───────────────────────────────────────────────────────
  if (connectionError) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-red-500/5 backdrop-blur-3xl border border-red-500/20 shadow-interstellar rounded-[2.5rem] p-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Критический сбой</h2>
          </div>
          <p className="text-sm text-white/40 mb-6 font-medium leading-relaxed">
            Не удалось установить соединение с нейронной сетью. Проверьте конфигурацию переменных окружения или статус сервера.
          </p>
          <div className="rounded-2xl p-4 font-mono text-[10px] break-all text-red-400 bg-red-500/10 border border-red-500/10 mb-8 lowercase tracking-tighter">
            {connectionError}
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="w-full h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/5 uppercase text-[10px] font-black tracking-[0.2em]"
          >
            Перезагрузить ядро
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Main Auth form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-primary/30 selection:text-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] opacity-30 animate-pulse" />
        <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] opacity-20" />
        {/* Animated grid effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + Brand */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 mx-auto relative flex items-center justify-center mb-6 group">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl group-hover:opacity-100 opacity-50 transition-opacity duration-1000" />
            <img src={markvisionLogo} alt="MarkVision AI" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-[0.3em] mb-2">
            MARK<span className="text-primary italic">VISION</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic">
            Artificial Marketing Intelligence
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="bg-[#020617]/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-interstellar relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

            {/* Back button (forgot-password) */}
            {mode === 'forgot-password' && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                type="button"
                onClick={() => setMode('login')}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white mb-8 transition-all group/back"
              >
                <ArrowLeft className="w-3 h-3 transition-transform group-hover/back:-translate-x-1" />
                Возврат
              </motion.button>
            )}

            {/* Tab switcher */}
            {mode !== 'forgot-password' && (
              <div className="flex gap-2 mb-10 p-1.5 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative overflow-hidden ${mode === m
                      ? 'text-white bg-primary shadow-lg shadow-primary/20'
                      : 'text-white/30 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {m === 'login' ? 'Вход' : 'Доступ'}
                  </button>
                ))}
              </div>
            )}

            {/* Title Section */}
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-black uppercase tracking-widest mb-2 text-white">
                {getTitle()}
              </h2>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                {getSubtitle()}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Name field (signup only) */}
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Идентификатор</Label>
                  <div className="relative group/input">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary z-10 transition-colors" />
                    <Input
                      type="text"
                      placeholder="Ваше имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-14 h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-sm font-medium"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Канал связи (EMAIL)</Label>
                <div className="relative group/input">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary z-10 transition-colors" />
                  <Input
                    type="email"
                    placeholder="shafand@core.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-14 h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-sm font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'forgot-password' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-4">Ключ доступа (PASSWORD)</Label>
                  <div className="relative group/input">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/input:text-primary z-10 transition-colors" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-14 pr-14 h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Forgot password link */}
              {mode === 'login' && (
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary transition-all underline-offset-4 hover:underline"
                  >
                    Забыли ключ?
                  </button>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] bg-primary hover:bg-primary/90 text-white border-0 shadow-interstellar transition-all duration-500 mt-6 active:scale-[0.98] disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  : <Sparkles className="w-4 h-4 mr-3" />
                }
                {getButtonText()}
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 space-y-4"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
            © 2026 MARKVISION NEURAL SYSTEMS
          </p>
          <div className="flex items-center justify-center gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-500">
            <div className="h-[1px] w-8 bg-white/20" />
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            <div className="h-[1px] w-8 bg-white/20" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
