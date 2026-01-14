import { useState } from 'react';
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone,
  ChevronDown,
  ExternalLink,
  BookOpen,
  FileText,
  Video,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AIAssistant } from '@/components/analytics/AIAssistant';

interface HelpTabProps {
  projectId: string;
}

const faqItems = [
  {
    question: 'Как добавить нового сотрудника?',
    answer: 'Перейдите в раздел "Команда" в настройках и нажмите "Добавить сотрудника". Заполните email, имя и выберите роль. После создания сотрудник получит данные для входа.'
  },
  {
    question: 'Как подключить Facebook Ads?',
    answer: 'В разделе "Интеграции" нажмите на карточку Facebook Ads и авторизуйтесь через вашу учетную запись Facebook. Предоставьте доступ к рекламным аккаунтам.'
  },
  {
    question: 'Как обучить ИИ на своих скриптах?',
    answer: 'Перейдите в "Базу знаний", создайте новый документ с вашим скриптом и нажмите кнопку "Обучить ИИ". После этого ИИ-ассистент будет использовать эту информацию.'
  },
  {
    question: 'Как работает Realtime-обновление?',
    answer: 'Все данные в системе обновляются мгновенно. Когда кто-то изменяет лида или добавляет оплату, вы увидите изменения без перезагрузки страницы.'
  },
  {
    question: 'Как экспортировать отчёты?',
    answer: 'В разделе "Отчёты" выберите период, метрики и нажмите "Скачать PDF". Вы также можете настроить автоматическую отправку отчётов на email.'
  },
  {
    question: 'Что такое Lead Scoring?',
    answer: 'Lead Scoring — это автоматическая оценка качества лида на основе его данных (источник, поведение, utm-метки). Горячие лиды получают больше баллов и приоритет в обработке.'
  },
];

const resources = [
  { 
    title: 'Документация', 
    description: 'Полное руководство по работе с системой',
    icon: BookOpen,
    url: '#'
  },
  { 
    title: 'Видеоуроки', 
    description: 'Обучающие видео для быстрого старта',
    icon: Video,
    url: '#'
  },
  { 
    title: 'API Reference', 
    description: 'Документация для разработчиков',
    icon: FileText,
    url: '#'
  },
];

export const HelpTab = ({ projectId }: HelpTabProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const aiContext = {
    projectId,
    spend: 0,
    leads: 0,
    revenue: 0
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Left Column: FAQ & Resources */}
      <div className="xl:col-span-2 space-y-6">
        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Часто задаваемые вопросы
            </CardTitle>
            <CardDescription>
              Ответы на популярные вопросы
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {faqItems.map((item, index) => (
              <Collapsible
                key={index}
                open={openFaq === index}
                onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <span className="text-left font-medium">{item.question}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 py-3 text-sm text-muted-foreground bg-secondary/30 rounded-b-lg -mt-1">
                    {item.answer}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Ресурсы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {resources.map((resource, index) => (
                <Card key={index} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <resource.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{resource.title}</p>
                        <p className="text-xs text-muted-foreground">{resource.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Связаться с поддержкой
            </CardTitle>
            <CardDescription>
              Мы отвечаем в течение 24 часов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                support@markvision.kz
              </Button>
              <Button variant="outline" className="gap-2">
                <Phone className="w-4 h-4" />
                +7 (777) 123-45-67
              </Button>
              <Button className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Написать в чат
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Здесь будут ваши обращения в поддержку</p>
            <p className="text-xs mt-1">История запросов и статусы решения</p>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: AI Assistant */}
      <div className="xl:col-span-1">
        <div className="sticky top-4">
          <AIAssistant context={aiContext} />
        </div>
      </div>
    </div>
  );
};
