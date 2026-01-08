import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, checkConnection, clearAuthData } from '@/lib/externalSupabase';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'forgot-password';

// Standalone audit log function for auth events (can't use hook before user exists)
const logAuthEvent = async (userId: string, userEmail: string, action: 'login' | 'logout' | 'create') => {
  try {
    await supabase.from('audit_logs').insert([{
      user_id: userId,
      user_email: userEmail,
      action,
      entity_type: 'session',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
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

  // Проверка подключения к базе при загрузке
  useEffect(() => {
    const verifyConnection = async () => {
      setCheckingConnection(true);
      // Очищаем старые токены перед проверкой
      clearAuthData();
      
      const result = await checkConnection();
      if (!result.ok) {
        setConnectionError(result.error || 'Ошибка подключения к базе данных');
      } else {
        setConnectionError(null);
      }
      setCheckingConnection(false);
    };
    
    verifyConnection();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
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
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          console.error('Reset password error:', error.code || error.message);
          toast.error('Ошибка отправки письма. Попробуйте позже.');
          return;
        }

        toast.success('Письмо для сброса пароля отправлено на вашу почту!');
        setMode('login');
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Подробное логирование ошибки только в dev режиме
          if (import.meta.env.DEV) {
            console.error('❌ Login error details:', {
              code: error.code,
              message: error.message,
              status: error.status,
              name: error.name
            });
          }
          
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
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          logAuthEvent(session.user.id, session.user.email || email, 'login');
        }

        toast.success('Добро пожаловать!');
      } else {
        // Sign up the user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name || email.split('@')[0],
            },
          },
        });

        if (signUpError) {
          console.error('Signup error:', signUpError.code || signUpError.message);
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
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
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
      case 'login': return 'Вход в аккаунт';
      case 'signup': return 'Регистрация';
      case 'forgot-password': return 'Восстановление пароля';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'login': return 'Войти';
      case 'signup': return 'Зарегистрироваться';
      case 'forgot-password': return 'Отправить ссылку';
    }
  };

  // Показываем ошибку подключения или загрузку
  if (checkingConnection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Проверка подключения к базе данных...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-destructive/10 border border-destructive rounded-2xl p-6">
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
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full mt-4"
            variant="outline"
          >
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
            <BarChart3 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">AdMetrics</h1>
          <p className="text-muted-foreground mt-1">Аналитика рекламы</p>
        </div>

        {/* Form Card */}
        <div className="bg-card border rounded-2xl p-6 shadow-lg">
          {mode === 'forgot-password' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к входу
            </button>
          )}

          <h2 className="text-xl font-semibold text-center mb-6">
            {getTitle()}
          </h2>

          {mode === 'forgot-password' && (
            <p className="text-sm text-muted-foreground text-center mb-4">
              Введите email, привязанный к вашему аккаунту. Мы отправим ссылку для сброса пароля.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Имя</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm text-primary hover:underline"
                >
                  Забыли пароль?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {getButtonText()}
            </Button>
          </form>

          {mode !== 'forgot-password' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sm text-primary hover:underline"
              >
                {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
