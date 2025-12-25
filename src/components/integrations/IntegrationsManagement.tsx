import { useState } from 'react';
import { 
  Plug, 
  Facebook, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Link2,
  Unlink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// Icons for integrations
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const N8nIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'connected' | 'disconnected' | 'error';
  features: string[];
  configFields: { key: string; label: string; type: 'text' | 'password'; placeholder: string }[];
}

const integrations: Integration[] = [
  {
    id: 'facebook',
    name: 'Facebook Ads',
    description: 'Импорт данных о рекламных кампаниях, расходах и конверсиях',
    icon: <Facebook className="w-6 h-6" />,
    color: 'bg-blue-500',
    status: 'disconnected',
    features: [
      'Автоматический импорт расходов',
      'Синхронизация конверсий',
      'Данные по кампаниям и группам объявлений',
      'Offline-конверсии'
    ],
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'EAAxxxxxxx...' },
      { key: 'adAccountId', label: 'Ad Account ID', type: 'text', placeholder: 'act_123456789' }
    ]
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'Интеграция с TikTok Ads Manager для аналитики рекламы',
    icon: <TikTokIcon />,
    color: 'bg-black',
    status: 'disconnected',
    features: [
      'Импорт данных по расходам',
      'Статистика по видео',
      'Аудитории и таргетинг',
      'Конверсии и события'
    ],
    configFields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Ваш Access Token' },
      { key: 'advertiserId', label: 'Advertiser ID', type: 'text', placeholder: '1234567890' }
    ]
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Синхронизация данных из Google Ads и Analytics',
    icon: <GoogleIcon />,
    color: 'bg-white border',
    status: 'disconnected',
    features: [
      'Импорт данных из Google Ads',
      'Интеграция с Google Analytics',
      'Отслеживание конверсий',
      'Данные по ключевым словам'
    ],
    configFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'xxxxxxx.apps.googleusercontent.com' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Ваш Client Secret' },
      { key: 'customerId', label: 'Customer ID', type: 'text', placeholder: '123-456-7890' }
    ]
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Автоматизация workflows и интеграция с любыми сервисами',
    icon: <N8nIcon />,
    color: 'bg-orange-500',
    status: 'disconnected',
    features: [
      'Кастомные автоматизации',
      'Интеграция с 400+ сервисами',
      'Webhooks и триггеры',
      'Обработка данных'
    ],
    configFields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://your-n8n.com/webhook/...' },
      { key: 'apiKey', label: 'API Key (опционально)', type: 'password', placeholder: 'Ваш API Key' }
    ]
  }
];

interface IntegrationsManagementProps {
  projectId?: string;
}

export const IntegrationsManagement = ({ projectId }: IntegrationsManagementProps) => {
  const { isAdmin } = useAuth();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, 'connected' | 'disconnected' | 'error'>>({
    facebook: 'disconnected',
    tiktok: 'disconnected',
    google: 'disconnected',
    n8n: 'disconnected'
  });

  const handleConfigOpen = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigValues({});
    setIsConfigOpen(true);
  };

  const handleConnect = async () => {
    if (!selectedIntegration) return;
    
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIntegrationStatuses(prev => ({
      ...prev,
      [selectedIntegration.id]: 'connected'
    }));
    
    setIsSaving(false);
    setIsConfigOpen(false);
    toast.success(`${selectedIntegration.name} успешно подключён`);
  };

  const handleDisconnect = async (integrationId: string) => {
    setIntegrationStatuses(prev => ({
      ...prev,
      [integrationId]: 'disconnected'
    }));
    toast.success('Интеграция отключена');
  };

  const getStatusBadge = (status: 'connected' | 'disconnected' | 'error') => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Подключено
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Ошибка
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Не подключено
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Интеграции</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Подключите рекламные платформы для автоматического импорта данных
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {integrations.map(integration => {
          const status = integrationStatuses[integration.id];
          return (
            <Card key={integration.id} className={status === 'connected' ? 'border-success/50' : ''}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${integration.color} flex items-center justify-center text-white`}>
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{integration.name}</p>
                  <div className="mt-1">
                    {status === 'connected' ? (
                      <span className="text-xs text-success">Активно</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Не активно</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Cards */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="ads">Реклама</TabsTrigger>
          <TabsTrigger value="automation">Автоматизация</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {integrations.map(integration => {
              const status = integrationStatuses[integration.id];
              return (
                <Card key={integration.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${integration.color} flex items-center justify-center text-white`}>
                          {integration.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium mb-2">Возможности:</p>
                        <ul className="space-y-1">
                          {integration.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-muted-foreground text-xs">
                              <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {status === 'connected' ? (
                          <>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Settings className="w-4 h-4 mr-2" />
                              Настроить
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDisconnect(integration.id)}
                            >
                              <Unlink className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleConfigOpen(integration)}
                            disabled={!isAdmin}
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            Подключить
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="ads" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {integrations.filter(i => ['facebook', 'tiktok', 'google'].includes(i.id)).map(integration => {
              const status = integrationStatuses[integration.id];
              return (
                <Card key={integration.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${integration.color} flex items-center justify-center text-white`}>
                          {integration.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2 pt-2">
                      {status === 'connected' ? (
                        <>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="w-4 h-4 mr-2" />
                            Настроить
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDisconnect(integration.id)}
                          >
                            <Unlink className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleConfigOpen(integration)}
                          disabled={!isAdmin}
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          Подключить
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="automation" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {integrations.filter(i => i.id === 'n8n').map(integration => {
              const status = integrationStatuses[integration.id];
              return (
                <Card key={integration.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${integration.color} flex items-center justify-center text-white`}>
                          {integration.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-sm">
                        <ul className="space-y-1">
                          {integration.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-muted-foreground text-xs">
                              <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {status === 'connected' ? (
                          <>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Settings className="w-4 h-4 mr-2" />
                              Настроить
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDisconnect(integration.id)}
                            >
                              <Unlink className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleConfigOpen(integration)}
                            disabled={!isAdmin}
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            Подключить
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Как это работает?</p>
            <p className="text-xs text-muted-foreground mt-1">
              После подключения интеграции данные о расходах и конверсиях будут автоматически 
              импортироваться в вашу аналитику. Вы сможете видеть полную картину эффективности 
              рекламы в одном месте.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedIntegration && (
                <div className={`w-10 h-10 rounded-lg ${selectedIntegration.color} flex items-center justify-center text-white`}>
                  {selectedIntegration.icon}
                </div>
              )}
              Подключить {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              Введите данные для подключения интеграции
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedIntegration?.configFields.map(field => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium">{field.label}</label>
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={configValues[field.key] || ''}
                  onChange={(e) => setConfigValues(prev => ({
                    ...prev,
                    [field.key]: e.target.value
                  }))}
                />
              </div>
            ))}
            
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Где найти эти данные?</strong><br />
                Перейдите в настройки разработчика {selectedIntegration?.name} для получения 
                токенов доступа и идентификаторов.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleConnect} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              Подключить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
