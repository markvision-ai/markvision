import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChevronRight, Building2, Users, Target, Zap, Sparkles, Rocket, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  onComplete: (projectId: string) => void;
  createProject: (name: string) => Promise<string | null>;
}

const steps = [
  { id: 1, title: 'Компания', icon: Building2, description: 'Основная информация' },
  { id: 2, title: 'Команда', icon: Users, description: 'Пригласите коллег' },
  { id: 3, title: 'Цели', icon: Target, description: 'Планы на месяц' },
  { id: 4, title: 'Интеграции', icon: Zap, description: 'Рекламные каналы' },
  { id: 5, title: 'Запуск', icon: Rocket, description: 'Готово к работе' },
];

const niches = [
  { id: 'medicine', label: 'Медицина', emoji: '🏥', priority: true },
  { id: 'beauty', label: 'Бьюти и салоны', emoji: '💅' },
  { id: 'education', label: 'Образование', emoji: '📚' },
  { id: 'ecommerce', label: 'Интернет-магазин', emoji: '🛒' },
  { id: 'realestate', label: 'Недвижимость', emoji: '🏠' },
  { id: 'auto', label: 'Авто', emoji: '🚗' },
  { id: 'fitness', label: 'Фитнес и спорт', emoji: '💪' },
  { id: 'food', label: 'Рестораны и еда', emoji: '🍽️' },
  { id: 'finance', label: 'Финансы', emoji: '💰' },
  { id: 'other', label: 'Другое', emoji: '📦' },
];

const integrations = [
  { id: 'facebook', label: 'Facebook ADS', icon: '📘' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok ADS', icon: '🎵' },
  { id: 'google', label: 'Google ADS', icon: '🔍' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
  { id: 'whatsapp', label: 'WhatsApp (GreenApi)', icon: '💬' },
];

export const OnboardingWizard = ({ onComplete, createProject }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
  // Step 1: Company
  const [companyData, setCompanyData] = useState({
    name: '',
    niche: '',
  });

  // Step 2: Team
  const [teamEmails, setTeamEmails] = useState<string[]>(['', '', '']);

  // Step 3: Goals
  const [goals, setGoals] = useState({
    revenue: '',
    sales: '',
    leads: '',
    budget: '',
    conversion: '',
  });

  // Step 4: Integrations
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);

  const progress = (currentStep / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return companyData.name.trim().length > 0 && companyData.niche.length > 0;
      case 2:
        return true; // Team emails are optional
      case 3:
        return true; // Goals are optional (can be changed later)
      case 4:
        return true; // Integrations are optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!companyData.name.trim()) {
      toast.error('Введите название компании');
      return;
    }

    setIsCreating(true);
    try {
      const projectId = await createProject(companyData.name.trim());
      if (projectId) {
        toast.success('Проект успешно создан!');
        onComplete(projectId);
      } else {
        toast.error('Не удалось создать проект');
      }
    } catch (error) {
      toast.error('Ошибка при создании проекта');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleIntegration = (id: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const updateTeamEmail = (index: number, value: string) => {
    const newEmails = [...teamEmails];
    newEmails[index] = value;
    setTeamEmails(newEmails);
  };

  const addTeamEmail = () => {
    setTeamEmails([...teamEmails, '']);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Название компании *</Label>
              <Input
                id="company-name"
                placeholder="Например: МедЦентр Астана"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                className="text-lg py-6"
              />
            </div>
            
            <div className="space-y-3">
              <Label>Выберите нишу *</Label>
              <div className="grid grid-cols-2 gap-3">
                {niches.map((niche) => (
                  <button
                    key={niche.id}
                    onClick={() => setCompanyData({ ...companyData, niche: niche.id })}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      companyData.niche === niche.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    } ${niche.priority ? 'ring-2 ring-primary/20' : ''}`}
                  >
                    <span className="text-2xl">{niche.emoji}</span>
                    <div className="flex-1">
                      <span className="font-medium">{niche.label}</span>
                      {niche.priority && (
                        <Badge variant="secondary" className="ml-2 text-xs">Популярное</Badge>
                      )}
                    </div>
                    {companyData.niche === niche.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Пригласите коллег по email. Они получат приглашение после создания проекта.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Email участников команды</Label>
              {teamEmails.map((email, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <Input
                    placeholder={`Email участника ${index + 1}`}
                    type="email"
                    value={email}
                    onChange={(e) => updateTeamEmail(index, e.target.value)}
                  />
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={addTeamEmail}
              >
                + Добавить участника
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Эти данные можно изменить позже после диагностики. Укажите примерные значения.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Целевая выручка (₸/мес)</Label>
                <Input 
                  placeholder="Например: 5 000 000" 
                  type="text"
                  value={goals.revenue}
                  onChange={(e) => setGoals({ ...goals, revenue: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Целевые продажи</Label>
                  <Input 
                    placeholder="Например: 50" 
                    type="text"
                    value={goals.sales}
                    onChange={(e) => setGoals({ ...goals, sales: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Целевые лиды</Label>
                  <Input 
                    placeholder="Например: 200" 
                    type="text"
                    value={goals.leads}
                    onChange={(e) => setGoals({ ...goals, leads: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Рекламный бюджет (₸/мес)</Label>
                  <Input 
                    placeholder="Например: 500 000" 
                    type="text"
                    value={goals.budget}
                    onChange={(e) => setGoals({ ...goals, budget: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Целевая конверсия (%)</Label>
                  <Input 
                    placeholder="Например: 5" 
                    type="text"
                    value={goals.conversion}
                    onChange={(e) => setGoals({ ...goals, conversion: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Выберите рекламные каналы, которые планируете использовать. Интеграции можно настроить позже.
            </p>
            
            <div className="grid gap-3">
              {integrations.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => toggleIntegration(integration.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    selectedIntegrations.includes(integration.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl">{integration.icon}</span>
                  <span className="flex-1 text-left font-medium">{integration.label}</span>
                  <Checkbox 
                    checked={selectedIntegrations.includes(integration.id)}
                    className="pointer-events-none"
                  />
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8 text-center py-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-xl shadow-primary/30">
              <Rocket className="w-12 h-12 text-primary-foreground" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">Всё готово к запуску!</h2>
              <p className="text-muted-foreground">
                Проект «{companyData.name}» будет создан с выбранными настройками
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-6 text-left space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ниша:</span>
                <span className="font-medium">{niches.find(n => n.id === companyData.niche)?.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Команда:</span>
                <span className="font-medium">{teamEmails.filter(e => e.trim()).length} участников</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Интеграции:</span>
                <span className="font-medium">{selectedIntegrations.length} каналов</span>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full py-6 text-lg"
              onClick={handleFinish}
              disabled={isCreating}
            >
              {isCreating ? (
                <>Создание проекта...</>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Запустить MarkVision
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Настройка MarkVision AI</CardTitle>
          <CardDescription>
            {currentStep < 5 ? 'Заполните информацию о вашем проекте' : 'Финальный шаг'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Шаг {currentStep} из {steps.length}</span>
              <span className="text-primary font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps indicator */}
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-2 ${
                    isActive ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive ? 'border-primary bg-primary/10' : 
                    isCompleted ? 'border-green-500 bg-green-500/10' : 
                    'border-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="min-h-[320px] py-4">
            {currentStep < 5 && (
              <h3 className="text-lg font-semibold mb-4">
                {steps[currentStep - 1].title}
              </h3>
            )}
            {renderStepContent()}
          </div>

          {/* Navigation */}
          {currentStep < 5 && (
            <div className="flex justify-between pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Назад
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Далее
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
