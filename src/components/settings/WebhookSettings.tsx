import { useState } from 'react';
import { 
  Copy, 
  Check, 
  Webhook, 
  Settings2, 
  Power, 
  PowerOff,
  Save,
  Info,
  ExternalLink,
  Loader2,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useWebhookConfig, FieldMapping } from '@/hooks/useWebhookConfig';

interface WebhookSettingsProps {
  projectId: string | null;
}

const fieldDescriptions: Record<keyof FieldMapping, string> = {
  name: 'Имя клиента',
  email: 'Email адрес',
  phone: 'Телефон',
  lead_id: 'ID заявки из внешней системы',
  utm_source: 'UTM Source (источник)',
  utm_medium: 'UTM Medium (тип трафика)',
  utm_campaign: 'UTM Campaign (кампания)',
  utm_content: 'UTM Content (содержание)',
  utm_term: 'UTM Term (ключевое слово)',
  visit_id: 'ID визита для склейки с аналитикой',
  client_id: 'ID клиента (Cookie/Client ID)',
  deal_amount: 'Сумма сделки',
};

const examplePayload = {
  lead_info: {
    id: "12345",
    name: "Иван Петров",
    phone: "+79991234567",
    email: "test@example.com"
  },
  utm_data: {
    utm_source: "yandex",
    utm_medium: "cpc",
    utm_campaign: "search_brand",
    utm_content: "banner_v1",
    utm_term: "купить_аналитику"
  },
  analytics: {
    visit_id: "987654321",
    client_id: "cid_555"
  },
  deal: {
    amount: 150000
  }
};

export const WebhookSettings = ({ projectId }: WebhookSettingsProps) => {
  const { 
    config, 
    loading, 
    createConfig, 
    updateFieldMapping, 
    toggleActive, 
    getWebhookUrl,
    getWebhookSecret,
    fetchWebhookSecret,
    rotateCredentials
  } = useWebhookConfig(projectId);
  const [copied, setCopied] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [editedMapping, setEditedMapping] = useState<FieldMapping | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [rotating, setRotating] = useState(false);

  const handleCopyUrl = () => {
    const url = getWebhookUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleCopySecret = async () => {
    let secret = getWebhookSecret();
    if (!secret) {
      secret = await fetchWebhookSecret();
    }
    if (secret) {
      navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };
  
  const handleShowSecret = async () => {
    if (!showSecret) {
      await fetchWebhookSecret();
    }
    setShowSecret(!showSecret);
  };
  
  const handleRotateCredentials = async () => {
    setRotating(true);
    await rotateCredentials();
    setRotating(false);
    setShowSecret(false);
  };

  const handleCreateWebhook = async () => {
    await createConfig();
  };

  const handleSaveMapping = async () => {
    if (!editedMapping) return;
    setSaving(true);
    await updateFieldMapping(editedMapping);
    setSaving(false);
    setEditedMapping(null);
  };

  const currentMapping = editedMapping || config?.field_mapping;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-card border rounded-xl p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Webhook className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Настройка вебхука</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Создайте вебхук для приема заявок из внешних систем (CRM, формы сайта, Tilda, коллтрекинг)
          </p>
          <Button onClick={handleCreateWebhook}>
            <Webhook className="w-4 h-4 mr-2" />
            Создать вебхук
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhook URL */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Webhook className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{config.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={config.is_active ? 'default' : 'secondary'}>
                  {config.is_active ? 'Активен' : 'Неактивен'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              {config.is_active ? 'Выключить' : 'Включить'}
            </span>
            <Switch
              checked={config.is_active}
              onCheckedChange={toggleActive}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Webhook URL (POST)</Label>
          <div className="flex gap-2">
            <Input
              value={getWebhookUrl() || ''}
              readOnly
              className="font-mono text-sm"
            />
            <Button variant="outline" size="icon" onClick={handleCopyUrl}>
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Отправляйте POST-запросы с JSON на этот URL для создания заявок
          </p>
        </div>
      </div>

      {/* Field Mapping */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Маппинг полей</h3>
              <p className="text-sm text-muted-foreground">
                Укажите пути к данным в JSON вебхука
              </p>
            </div>
          </div>
          {editedMapping && (
            <Button onClick={handleSaveMapping} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Сохранить
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentMapping && Object.entries(currentMapping).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor={key} className="text-sm">
                  {fieldDescriptions[key as keyof FieldMapping]}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Путь в JSON: {key}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id={key}
                value={value || ''}
                onChange={(e) => {
                  const newMapping = { ...(editedMapping || config.field_mapping) };
                  newMapping[key as keyof FieldMapping] = e.target.value;
                  setEditedMapping(newMapping);
                }}
                placeholder={`Например: data.${key}`}
                className="font-mono text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Example Payload */}
      <Accordion type="single" collapsible>
        <AccordionItem value="example" className="bg-card border rounded-xl px-6">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold">Пример JSON для отправки</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(examplePayload, null, 2)}
            </pre>
            <p className="text-sm text-muted-foreground mt-3">
              Структура JSON может быть любой. Укажите в маппинге пути к нужным полям через точку 
              (например: <code className="bg-muted px-1 rounded">lead_info.name</code>)
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Instructions */}
      <div className="bg-blue-50  border border-blue-200  rounded-xl p-4">
        <h4 className="font-medium text-blue-900  mb-2">
          Как подключить вебхук
        </h4>
        <ol className="text-sm text-blue-800  space-y-2 list-decimal list-inside">
          <li>Скопируйте Webhook URL выше</li>
          <li>Настройте отправку POST-запросов из вашей CRM/формы/коллтрекинга</li>
          <li>Убедитесь, что данные передаются в формате JSON</li>
          <li>Настройте маппинг полей в соответствии со структурой вашего JSON</li>
          <li>Для отслеживания пути клиента передавайте client_id или visit_id</li>
        </ol>
      </div>

      {/* Authentication Methods */}
      <div className="bg-card border rounded-xl p-4">
        <h4 className="font-medium mb-3">Методы аутентификации</h4>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-green-50  border border-green-200  rounded-lg">
            <div className="font-medium text-green-900  mb-1">
              ✓ Рекомендуемый: HTTP-заголовок
            </div>
            <code className="text-xs bg-green-100  px-2 py-1 rounded">
              X-Webhook-Token: [используйте токен из URL выше]
            </code>
          </div>
          <div className="p-3 bg-secondary rounded-lg">
            <div className="font-medium mb-1">Альтернативный: Bearer токен</div>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              Authorization: Bearer [токен из URL]
            </code>
          </div>
          <div className="p-3 bg-yellow-50  border border-yellow-200  rounded-lg">
            <div className="font-medium text-yellow-900  mb-1">
              ⚠ Устаревший: URL-параметр
            </div>
            <p className="text-xs text-yellow-800  mb-1">
              Токен в URL может попасть в логи. Используйте только если другие методы недоступны.
            </p>
            <code className="text-xs bg-yellow-100  px-2 py-1 rounded">
              Используйте полный URL выше
            </code>
          </div>
        </div>
      </div>

      {/* Request signature */}
      <div className="bg-card border rounded-xl p-4">
        <h4 className="font-medium mb-2">Подпись запроса (доп. защита)</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Если включена проверка подписи, нужно отправлять два заголовка. Это защищает от подделки и повторной отправки.
        </p>
        <div className="space-y-2 text-sm">
          <code className="text-xs bg-muted px-2 py-1 rounded block">
            X-Webhook-Timestamp: [unix timestamp в миллисекундах]
          </code>
          <code className="text-xs bg-muted px-2 py-1 rounded block">
            X-Webhook-Signature: [HMAC SHA-256 от &quot;timestamp.body&quot;]
          </code>
        </div>
      </div>
    </div>
  );
};
