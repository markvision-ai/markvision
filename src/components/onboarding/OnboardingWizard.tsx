import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Megaphone, 
  MessageCircle, 
  Users, 
  Brain,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Sparkles,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';
import { triggerConfetti } from '@/lib/confetti';

interface OnboardingWizardProps {
  projectId: string;
  projectName: string;
  onComplete: () => void;
}

interface StaffMember {
  name: string;
  position: string;
}

interface IntegrationData {
  facebook: { connected: boolean };
  google: { token: string };
  tiktok: { token: string };
}

const STEPS = [
  { id: 1, title: 'Ваша клиника', icon: Building2 },
  { id: 2, title: 'Реклама', icon: Megaphone },
  { id: 3, title: 'Связь', icon: MessageCircle },
  { id: 4, title: 'Команда', icon: Users },
  { id: 5, title: 'Обучение ИИ', icon: Brain },
];

export const OnboardingWizard = ({ projectId, projectName, onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  
  // Step 1: Clinic
  const [clinicName, setClinicName] = useState(projectName || '');
  
  // Step 2: Ads
  const [integrations, setIntegrations] = useState<IntegrationData>({
    facebook: { connected: false },
    google: { token: '' },
    tiktok: { token: '' },
  });
  
  // Step 3: WhatsApp
  const [whatsappConfig, setWhatsappConfig] = useState({
    instanceId: '',
    token: '',
  });
  
  // Step 4: Team
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    { name: '', position: 'Менеджер' }
  ]);
  
  // Step 5: AI Context
  const [aiContext, setAiContext] = useState('');

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = async () => {
    setLoading(true);
    
    try {
      if (currentStep === 1 && clinicName) {
        await supabase
          .from('projects')
          .update({ name: clinicName })
          .eq('id', projectId);
      }
      
      if (currentStep === 2) {
        if (integrations.google.token) {
          await supabase.from('integrations').upsert({
            project_id: projectId,
            name: 'Google Ads',
            type: 'google_ads',
            config: { api_token: integrations.google.token },
            status: 'pending',
          }, { onConflict: 'project_id,type' });
        }
        if (integrations.tiktok.token) {
          await supabase.from('integrations').upsert({
            project_id: projectId,
            name: 'TikTok Ads',
            type: 'tiktok_ads',
            config: { api_token: integrations.tiktok.token },
            status: 'pending',
          }, { onConflict: 'project_id,type' });
        }
      }
      
      if (currentStep === 3) {
        if (whatsappConfig.instanceId && whatsappConfig.token) {
          await supabase.from('integrations').upsert({
            project_id: projectId,
            name: 'WhatsApp (GreenAPI)',
            type: 'whatsapp',
            config: { 
              instance_id: whatsappConfig.instanceId, 
              token: whatsappConfig.token 
            },
            status: 'pending',
          }, { onConflict: 'project_id,type' });
        }
      }
      
      if (currentStep === 4) {
        const validStaff = staffMembers.filter(s => s.name.trim());
        if (validStaff.length > 0) {
          for (const staff of validStaff) {
            await supabase.from('staff').insert({
              project_id: projectId,
              name: staff.name,
              position: staff.position,
              status: 'active',
            });
          }
        }
      }
      
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error saving step data:', error);
      toast.error('Ошибка сохранения данных');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLaunch = async () => {
    setLaunching(true);
    
    try {
      if (aiContext.trim()) {
        await supabase.from('project_context').upsert({
          project_id: projectId,
          content: aiContext,
        }, { onConflict: 'project_id' });
      }
      
      await supabase
        .from('projects')
        .update({ onboarding_status: 'completed' })
        .eq('id', projectId);
      
      // Send webhook (placeholder URL)
      try {
        await fetch('https://webhook.n8n.markvision.ai/onboarding-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            clinic_name: clinicName,
            integrations: {
              facebook: integrations.facebook.connected,
              google: !!integrations.google.token,
              tiktok: !!integrations.tiktok.token,
              whatsapp: !!whatsappConfig.instanceId,
            },
            staff_count: staffMembers.filter(s => s.name.trim()).length,
            has_ai_context: !!aiContext.trim(),
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch {}
      
      triggerConfetti();
      toast.success('🚀 MarkVision AI успешно запущен!');
      
      setTimeout(() => {
        onComplete();
      }, 1500);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Ошибка завершения настройки');
      setLaunching(false);
    }
  };

  const handleFacebookConnect = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        scopes: 'ads_management,ads_read,business_management',
        redirectTo: `${window.location.origin}/`,
      },
    });
    
    if (error) {
      toast.error('Ошибка подключения Facebook');
    }
  };

  const addStaffMember = () => {
    setStaffMembers([...staffMembers, { name: '', position: 'Менеджер' }]);
  };

  const removeStaffMember = (index: number) => {
    if (staffMembers.length > 1) {
      setStaffMembers(staffMembers.filter((_, i) => i !== index));
    }
  };

  const updateStaffMember = (index: number, field: keyof StaffMember, value: string) => {
    const updated = [...staffMembers];
    updated[index][field] = value;
    setStaffMembers(updated);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 mx-auto flex items-center justify-center mb-4">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Как называется ваша клиника?</h2>
              <p className="text-slate-500 mt-2">Это название будет отображаться в системе</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <Input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Клиника «Здоровье»"
                className="h-14 text-lg rounded-2xl text-center"
              />
            </div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-pink-600 mx-auto flex items-center justify-center mb-4">
                <Megaphone className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Подключите рекламные площадки</h2>
              <p className="text-slate-500 mt-2">Мы автоматически синхронизируем расходы и лиды</p>
            </div>
            
            <div className="max-w-lg mx-auto space-y-4">
              {/* Facebook */}
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl">
                      📘
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Facebook & Instagram</h3>
                      <p className="text-sm text-slate-500">Meta Business Suite</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleFacebookConnect}
                    variant={integrations.facebook.connected ? "outline" : "default"}
                    className="rounded-xl"
                  >
                    {integrations.facebook.connected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                        Подключено
                      </>
                    ) : (
                      'Подключить OAuth'
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Google */}
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 flex items-center justify-center text-white text-2xl">
                    🔍
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Google Ads</h3>
                    <p className="text-sm text-slate-500">Введите API токен</p>
                  </div>
                </div>
                <Input
                  value={integrations.google.token}
                  onChange={(e) => setIntegrations({
                    ...integrations,
                    google: { token: e.target.value }
                  })}
                  placeholder="API Token"
                  className="rounded-xl"
                />
              </div>
              
              {/* TikTok */}
              <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white text-2xl">
                    🎵
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">TikTok Ads</h3>
                    <p className="text-sm text-slate-500">Введите API токен</p>
                  </div>
                </div>
                <Input
                  value={integrations.tiktok.token}
                  onChange={(e) => setIntegrations({
                    ...integrations,
                    tiktok: { token: e.target.value }
                  })}
                  placeholder="API Token"
                  className="rounded-xl"
                />
              </div>
            </div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 mx-auto flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Настройте WhatsApp</h2>
              <p className="text-slate-500 mt-2">Ваш ИИ-бот Марк будет общаться здесь</p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white text-2xl">
                    💬
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">GreenAPI</h3>
                    <p className="text-sm text-slate-500">Подключение WhatsApp Business</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Instance ID</label>
                    <Input
                      value={whatsappConfig.instanceId}
                      onChange={(e) => setWhatsappConfig({
                        ...whatsappConfig,
                        instanceId: e.target.value
                      })}
                      placeholder="1101234567"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Token</label>
                    <Input
                      value={whatsappConfig.token}
                      onChange={(e) => setWhatsappConfig({
                        ...whatsappConfig,
                        token: e.target.value
                      })}
                      placeholder="abc123def456..."
                      type="password"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-center text-sm text-slate-500">
                Получите данные на <a href="https://green-api.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">green-api.com</a>
              </p>
            </div>
          </motion.div>
        );
        
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 mx-auto flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Добавьте вашу команду</h2>
              <p className="text-slate-500 mt-2">Менеджеры, которые будут работать с лидами</p>
            </div>
            
            <div className="max-w-md mx-auto space-y-3">
              {staffMembers.map((member, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={member.name}
                    onChange={(e) => updateStaffMember(index, 'name', e.target.value)}
                    placeholder="Имя менеджера"
                    className="rounded-xl flex-1"
                  />
                  <select
                    value={member.position}
                    onChange={(e) => updateStaffMember(index, 'position', e.target.value)}
                    className="h-10 px-3 rounded-xl border bg-white text-slate-900"
                  >
                    <option value="Менеджер">Менеджер</option>
                    <option value="Администратор">Администратор</option>
                    <option value="Врач">Врач</option>
                    <option value="Руководитель">Руководитель</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStaffMember(index)}
                    disabled={staffMembers.length === 1}
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addStaffMember}
                className="w-full rounded-xl border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить менеджера
              </Button>
            </div>
          </motion.div>
        );
        
      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center mb-4">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Обучите вашего ИИ-ассистента</h2>
              <p className="text-slate-500 mt-2">Расскажите о вашем продукте, ценах и скриптах</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <Textarea
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder={`Пример:

🏥 Наша клиника специализируется на стоматологии.

💰 Цены:
- Консультация: 5 000 ₸
- Чистка зубов: 15 000 ₸
- Имплант: от 250 000 ₸

📝 Скрипт продаж:
1. Поприветствовать клиента
2. Уточнить проблему
3. Предложить бесплатную диагностику
4. Записать на удобное время`}
                className="min-h-[300px] rounded-2xl text-base"
              />
              <p className="text-sm text-slate-500 mt-2 text-center">
                Чем больше информации вы предоставите, тем умнее будет ваш ИИ
              </p>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">MarkVision AI</span>
            </div>
            <span className="text-sm text-slate-500">
              Шаг {currentStep} из {STEPS.length}
            </span>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between mt-4">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-blue-100' : isCompleted ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button
              onClick={handleNext}
              disabled={loading || (currentStep === 1 && !clinicName.trim())}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Далее
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleLaunch}
              disabled={launching}
              className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8"
            >
              {launching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Запуск...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Запустить MarkVision AI 🚀
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;
