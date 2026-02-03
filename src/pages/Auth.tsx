import markvisionLogo from '@/assets/markvision-logo-new.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, checkConnection } from '@/lib/externalSupabase';
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

  // Проверка подключения к базе при загрузке с RETRY логикой (3 попытки)
  useEffect(() => {
    const verifyConnection = async () => {
      setCheckingConnection(true);
      const MAX_RETRIES = 3;
      let lastError: string | null = null;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const {
            error
          } = await supabase.from('projects').select('count').limit(1);
          if (!error) {
            setConnectionError(null);
            setCheckingConnection(false);
            return;
          }
          lastError = error.message;
        } catch (e: any) {
          lastError = e.message || 'Ошибка подключения к базе данных';
        }

        // Ждём перед следующей попыткой (кроме последней)
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      // Все попытки исчерпаны
      setConnectionError(lastError);
      setCheckingConnection(false);
    };
    verifyConnection();
  }, []);
  useEffect(() => {
    const checkUserProjects = async (userId: string) => {
      try {
        // КРИТИЧНО: Проверка OAuth параметров перед редиректом
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = hashParams.has('access_token') || searchParams.has('code') || searchParams.has('error');
        
        if (hasOAuthParams) {
          console.log('🚨 OAuth params detected in Auth.tsx, redirecting to /integrations');
          navigate('/integrations');
          return;
        }

        // Check if user has any projects
        const { data: accessData } = await supabase
          .from('project_access')
          .select('project_id')
          .eq('user_id', userId)
          .limit(1);

        // Check if user is admin/super_admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        const isAdmin = roleData?.role === 'admin' || roleData?.role === 'super_admin';

        // Redirect to setup if no projects and not admin
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

    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await checkUserProjects(session.user.id);
      }
    });
    
    supabase.auth.getSession().then(async ({
      data: {
        session
      }
    }) => {
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
        const {
          error
        } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) {
          toast.error('Ошибка отправки письма. Попробуйте позже.');
          return;
        }
        toast.success('Письмо для сброса пароля отправлено на вашу почту!');
        setMode('login');
      } else if (mode === 'login') {
        const {
          data,
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          // Показываем точный текст ошибки пользователю
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

        // Log successful login
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        if (session?.user) {
          logAuthEvent(session.user.id, session.user.email || email, 'login');
        }
        toast.success('Добро пожаловать!');
      } else {
        // Sign up the user
        const {
          data: signUpData,
          error: signUpError
        } = await supabase.auth.signUp({
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

        // Check if user was created and session exists (auto-confirm enabled)
        if (signUpData.session) {
          // Auto-login worked, session is active
          logAuthEvent(signUpData.user!.id, signUpData.user!.email || email, 'create');
          toast.success('Регистрация успешна! Добро пожаловать!');
          navigate('/');
          return;
        }

        // If no session but user exists, try to sign in immediately
        // (this works when email confirmation is disabled in Supabase)
        if (signUpData.user && !signUpData.session) {
          const {
            data: signInData,
            error: signInError
          } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (signInError) {
            // If sign-in fails, it means email confirmation is required
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

  // Показываем ошибку подключения или загрузку
  if (checkingConnection) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="text-center">
          <div className="relative mx-auto mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 animate-pulse" />
          </div>
          <p className="text-muted-foreground">Подключение к базе данных...</p>
        </motion.div>
      </div>;
  }
  if (connectionError) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="w-full max-w-md bg-destructive/10 border border-destructive/30 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <h2 className="text-xl font-semibold text-destructive">Ошибка подключения</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Не удалось подключиться к базе данных. Возможные причины:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside mb-4 space-y-1">
            <li>Неверный VITE_SUPABASE_URL</li>
            <li>Неверный VITE_SUPABASE_ANON_KEY</li>
            <li>База данных недоступна</li>
          </ul>
          <div className="bg-muted rounded-lg p-3 font-mono text-xs break-all">
            {connectionError}
          </div>
          <Button onClick={() => window.location.reload()} className="w-full mt-4" variant="outline">
            Попробовать снова
          </Button>
        </motion.div>
      </div>;
  }
  return <div className="min-h-screen bg-background flex items-center justify-center p-4 safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.5
    }} className="w-full max-w-lg relative z-10">
        {/* Logo Section */}
        <motion.div initial={{
        scale: 0.8,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} transition={{
        delay: 0.1,
        duration: 0.5
      }} className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto relative flex items-center justify-center">
              <img src={markvisionLogo} alt="MarkVision AI" className="w-full h-full object-contain drop-shadow-2xl" />
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-purple-500/30 blur-2xl rounded-full -z-10 scale-150" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent">
              MarkVision AI
            </span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Умный маркетинг для медицинских клиник
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2,
        duration: 0.5
      }} className="relative">
          {/* Card Glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 via-purple-500/50 to-primary/50 rounded-3xl blur-sm opacity-50" />
          
          <div className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-primary/5">
            {mode === 'forgot-password' && <motion.button initial={{
            opacity: 0,
            x: -10
          }} animate={{
            opacity: 1,
            x: 0
          }} type="button" onClick={() => setMode('login')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Назад к входу
              </motion.button>}

            {/* Mode Switcher */}
            {mode !== 'forgot-password' && (
              <div className="flex gap-2 mb-6 p-1 bg-muted/50  rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === 'login'
                      ? 'bg-background  text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === 'signup'
                      ? 'bg-background  text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Регистрация
                </button>
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-2">
              {getTitle()}
            </h2>
            
            <p className="text-sm text-muted-foreground text-center mb-6">
              {mode === 'login' && 'Войдите в свой аккаунт для продолжения'}
              {mode === 'signup' && 'Создайте аккаунт для начала работы'}
              {mode === 'forgot-password' && 'Введите email для получения ссылки восстановления'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && <motion.div initial={{
              opacity: 0,
              height: 0
            }} animate={{
              opacity: 1,
              height: 'auto'
            }} exit={{
              opacity: 0,
              height: 0
            }} className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Имя</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input type="text" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} className="pl-11 h-12 bg-secondary/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                </motion.div>}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-11 h-12 bg-secondary/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>

              {mode !== 'forgot-password' && <motion.div initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Пароль</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-11 pr-11 h-12 bg-secondary/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>}

              {mode === 'login' && <div className="text-right">
                  <button type="button" onClick={() => setMode('forgot-password')} className="text-sm text-primary hover:text-primary/80 transition-colors">
                    Забыли пароль?
                  </button>
                </div>}

              <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white font-medium rounded-xl shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {getButtonText()}
              </Button>
            </form>

          </div>
        </motion.div>

        {/* Footer */}
        <motion.p initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.4
      }} className="text-center text-xs text-muted-foreground mt-6">
          © 2025 MarkVision AI. Все права защищены.
        </motion.p>
      </motion.div>
    </div>;
}