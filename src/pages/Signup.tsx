import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MarkVisionLogo } from '@/components/ui/MarkVisionLogo';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Gift,
  Loader2,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema
const signupSchema = z.object({
  clinicName: z.string().min(2, 'Название клиники должно быть минимум 2 символа').max(100),
  ownerName: z.string().min(2, 'Имя должно быть минимум 2 символа').max(100),
  email: z.string().email('Введите корректный email'),
  phone: z.string().min(10, 'Введите корректный номер телефона').max(20),
  password: z.string().min(6, 'Пароль должен быть минимум 6 символов'),
  confirmPassword: z.string(),
  promoCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  
  const [formData, setFormData] = useState({
    clinicName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    promoCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoValid, setPromoValid] = useState<boolean | null>(null);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });
  }, [navigate]);

  // Validate promo code
  useEffect(() => {
    if (formData.promoCode.toUpperCase() === 'MARK7') {
      setPromoValid(true);
    } else if (formData.promoCode.length > 0) {
      setPromoValid(false);
    } else {
      setPromoValid(null);
    }
  }, [formData.promoCode]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: formData.ownerName,
            phone: formData.phone,
            clinic_name: formData.clinicName,
            promo_code: formData.promoCode.toUpperCase() === 'MARK7' ? 'MARK7' : null,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('Этот email уже зарегистрирован. Попробуйте войти.');
        } else {
          toast.error('Ошибка регистрации: ' + signUpError.message);
        }
        return;
      }

      // 2. If user was created and session exists (auto-confirm enabled)
      if (signUpData.session && signUpData.user) {
        // Create project for the user
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: formData.clinicName,
            owner_id: signUpData.user.id,
          })
          .select()
          .single();

        if (projectError) {
          console.error('Failed to create project:', projectError);
        } else if (projectData) {
          // Add user to project_access
          await supabase.from('project_access').insert({
            user_id: signUpData.user.id,
            project_id: projectData.id,
          });
        }

        // Log signup event
        await supabase.from('audit_logs').insert({
          user_id: signUpData.user.id,
          user_email: formData.email,
          action: 'create',
          entity_type: 'user',
          new_values: { 
            clinic_name: formData.clinicName,
            promo_code: promoValid ? 'MARK7' : null,
          },
        });

        toast.success('Регистрация успешна! Добро пожаловать!');
        navigate('/');
        return;
      }

      // 3. If no session but user exists, email confirmation is required
      if (signUpData.user && !signUpData.session) {
        setShowSuccessScreen(true);
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error('Произошла ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccessScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/60 backdrop-blur-3xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center"
        >
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Проверьте почту для активации доступа
          </h2>
          <p className="text-slate-500 mb-6">
            Мы отправили письмо с подтверждением на <strong>{formData.email}</strong>. 
            Перейдите по ссылке в письме, чтобы активировать аккаунт.
          </p>
          {promoValid && (
            <div className="bg-success/10 border border-success/20 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-success">
                <Gift className="w-5 h-5" />
                <span className="font-medium">Промокод MARK7 активирован!</span>
              </div>
              <p className="text-sm text-success mt-1">7 дней бесплатного использования</p>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => navigate('/auth')}
            className="w-full rounded-xl"
          >
            Перейти к входу
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться на главную
        </button>

        {/* Form Card */}
        <div className="bg-white/60 backdrop-blur-3xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mx-auto flex items-center justify-center mb-4 shadow-2xl shadow-blue-900/5">
              <MarkVisionLogo className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Создайте аккаунт</h1>
            <p className="text-slate-500 mt-1">Начните 7-дневный бесплатный период</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Clinic Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Название клиники</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Клиника &quot;Здоровье&quot;"
                  value={formData.clinicName}
                  onChange={(e) => handleChange('clinicName', e.target.value)}
                  className={`pl-11 rounded-xl h-12 ${errors.clinicName ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.clinicName && <p className="text-xs text-destructive">{errors.clinicName}</p>}
            </div>

            {/* Owner Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Имя владельца</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Иван Петров"
                  value={formData.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  className={`pl-11 rounded-xl h-12 ${errors.ownerName ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`pl-11 rounded-xl h-12 ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Номер телефона (WhatsApp)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  type="tel"
                  placeholder="+7 777 123 45 67"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`pl-11 rounded-xl h-12 ${errors.phone ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`pl-11 pr-11 rounded-xl h-12 ${errors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Подтвердите пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`pl-11 pr-11 rounded-xl h-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            {/* Promo Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Промокод (если есть)</label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <Input
                  type="text"
                  placeholder="MARK7"
                  value={formData.promoCode}
                  onChange={(e) => handleChange('promoCode', e.target.value.toUpperCase())}
                  className={`pl-11 rounded-xl h-12 ${promoValid === true ? 'border-success bg-success/10' : promoValid === false ? 'border-destructive/50' : ''}`}
                />
                {promoValid === true && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
              {promoValid === true && (
                <p className="text-xs text-success">🎉 Промокод активирован! 7 дней бесплатно</p>
              )}
              {promoValid === false && (
                <p className="text-xs text-slate-500">Промокод не найден</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium text-lg mt-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Регистрация...
                </>
              ) : (
                'Зарегистрироваться'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <span className="text-slate-500">Уже есть аккаунт? </span>
            <button
              onClick={() => navigate('/auth')}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Войти
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
