import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
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
import { supabase } from '@/lib/externalSupabase';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Проверьте почту для активации доступа
          </h2>
          <p className="text-slate-600 mb-6">
            Мы отправили письмо с подтверждением на <strong>{formData.email}</strong>. 
            Перейдите по ссылке в письме, чтобы активировать аккаунт.
          </p>
          {promoValid && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-green-700">
                <Gift className="w-5 h-5" />
                <span className="font-medium">Промокод MARK7 активирован!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">7 дней бесплатного использования</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться на главную
        </button>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mx-auto flex items-center justify-center mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Создайте аккаунт</h1>
            <p className="text-slate-600 mt-1">Начните 7-дневный бесплатный период</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Clinic Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Название клиники</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Клиника &quot;Здоровье&quot;"
                  value={formData.clinicName}
                  onChange={(e) => handleChange('clinicName', e.target.value)}
                  className={`pl-11 rounded-xl h-12 ${errors.clinicName ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.clinicName && <p className="text-xs text-red-500">{errors.clinicName}</p>}
            </div>

            {/* Owner Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Имя владельца</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Иван Петров"
                  value={formData.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  className={`pl-11 rounded-xl h-12 ${errors.ownerName ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.ownerName && <p className="text-xs text-red-500">{errors.ownerName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`pl-11 rounded-xl h-12 ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Номер телефона (WhatsApp)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="tel"
                  placeholder="+7 777 123 45 67"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`pl-11 rounded-xl h-12 ${errors.phone ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`pl-11 pr-11 rounded-xl h-12 ${errors.password ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Подтвердите пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`pl-11 pr-11 rounded-xl h-12 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            {/* Promo Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Промокод (если есть)</label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="MARK7"
                  value={formData.promoCode}
                  onChange={(e) => handleChange('promoCode', e.target.value.toUpperCase())}
                  className={`pl-11 rounded-xl h-12 ${promoValid === true ? 'border-green-500 bg-green-50' : promoValid === false ? 'border-red-300' : ''}`}
                />
                {promoValid === true && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {promoValid === true && (
                <p className="text-xs text-green-600">🎉 Промокод активирован! 7 дней бесплатно</p>
              )}
              {promoValid === false && (
                <p className="text-xs text-slate-500">Промокод не найден</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium text-lg mt-6"
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
            <span className="text-slate-600">Уже есть аккаунт? </span>
            <button
              onClick={() => navigate('/auth')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Войти
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
