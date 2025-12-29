import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ChevronRight, Building2, Users, Target, Zap, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface OnboardingWizardProps {
  onComplete?: () => void;
}

const steps = [
  { id: 1, title: 'Компания', icon: Building2, description: 'Базовая информация' },
  { id: 2, title: 'Команда', icon: Users, description: 'Добавьте сотрудников' },
  { id: 3, title: 'Цели', icon: Target, description: 'Настройте KPI' },
  { id: 4, title: 'Интеграции', icon: Zap, description: 'Подключите сервисы' },
];

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [companyData, setCompanyData] = useState({
    name: '',
    industry: '',
    website: '',
    employees: '',
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Название компании</Label>
              <Input
                id="company-name"
                placeholder="ООО Ваша компания"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Отрасль</Label>
              <Input
                id="industry"
                placeholder="E-commerce, SaaS, Услуги..."
                value={companyData.industry}
                onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Веб-сайт</Label>
              <Input
                id="website"
                placeholder="https://example.com"
                value={companyData.website}
                onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employees">Количество сотрудников</Label>
              <Input
                id="employees"
                placeholder="10"
                type="number"
                value={companyData.employees}
                onChange={(e) => setCompanyData({ ...companyData, employees: e.target.value })}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Добавьте членов команды для совместной работы в MarkVision AI
            </p>
            <div className="grid gap-3">
              {['Менеджер по продажам', 'Маркетолог', 'Аналитик'].map((role, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Input placeholder={`Email ${role}`} type="email" />
                  </div>
                  <Badge variant="outline">{role}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full">
              + Добавить сотрудника
            </Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Установите целевые показатели для отслеживания прогресса
            </p>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Целевой доход (₽/мес)</Label>
                <Input placeholder="1 000 000" type="number" />
              </div>
              <div className="space-y-2">
                <Label>Целевое количество лидов</Label>
                <Input placeholder="100" type="number" />
              </div>
              <div className="space-y-2">
                <Label>Целевая конверсия (%)</Label>
                <Input placeholder="5" type="number" />
              </div>
              <div className="space-y-2">
                <Label>Бюджет на рекламу (₽/мес)</Label>
                <Input placeholder="100 000" type="number" />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Подключите внешние сервисы для полной интеграции
            </p>
            <div className="grid gap-3">
              {[
                { name: 'Яндекс.Директ', status: 'available' },
                { name: 'VK Реклама', status: 'available' },
                { name: 'Telegram', status: 'connected' },
                { name: 'WhatsApp Business', status: 'available' },
                { name: 'AmoCRM', status: 'available' },
              ].map((integration, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">{integration.name}</span>
                  </div>
                  {integration.status === 'connected' ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Подключено
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline">Подключить</Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Добро пожаловать в MarkVision AI</CardTitle>
          <CardDescription>
            Настройте платформу за несколько простых шагов
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
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
          <div className="min-h-[280px] py-4">
            <h3 className="text-lg font-semibold mb-4">
              {steps[currentStep - 1].title}
            </h3>
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Назад
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length ? (
                <>
                  Завершить
                  <CheckCircle2 className="ml-2 w-4 h-4" />
                </>
              ) : (
                <>
                  Далее
                  <ChevronRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
