# CAPI-Send-Conversion — отправка конверсий в Facebook

## Назначение

Этот workflow отправляет события конверсий (Lead, Schedule, Purchase) в Facebook Conversion API для:
- Оптимизации рекламных кампаний
- Создания Lookalike аудиторий из покупателей
- Точной атрибуции конверсий

## Как работает

```
┌──────────────┐     ┌───────────────┐     ┌─────────────────┐
│ Webhook POST │ ──► │ Get Lead +    │ ──► │ Prepare CAPI    │
│ /capi-conv.  │     │ Pixel Config  │     │ Event (hash)    │
└──────────────┘     └───────────────┘     └────────┬────────┘
                                                    │
                     ┌───────────────┐     ┌────────▼────────┐
                     │ Log to        │ ◄── │ Send to FB      │
                     │ Supabase      │     │ Graph API       │
                     └───────────────┘     └─────────────────┘
```

## Webhook URL

```
POST https://n8n.zapoinov.com/webhook/capi-conversion
```

## Тело запроса

```json
{
  "project_id": "64c94e87-630c-470e-8ab1-8f7c8c835efa",
  "lead_id": "uuid-лида",
  "event_name": "Schedule",
  "event_time": 1706612400,
  "value": 50000,
  "currency": "RUB"
}
```

### Поддерживаемые события

| event_name | Facebook Event | Когда отправлять |
|------------|---------------|------------------|
| `Lead`, `new` | Lead | При создании лида |
| `Schedule`, `diagnostic_scheduled` | Schedule | При записи на диагностику |
| `Purchase`, `sold`, `sale` | Purchase | При продаже |

## Настройка credentials в n8n

### 1. Supabase Service Key
- Name: `Supabase Service Key`
- Header Name: `apikey`
- Header Value: `<service_role_key>`

Также добавь header:
- Header Name: `Authorization`
- Header Value: `Bearer <service_role_key>`

### 2. Environment Variables в n8n
```
SUPABASE_URL=https://pyscczcuersdjvpmkiec.supabase.co
```

## Настройка Pixel в Supabase

Добавь запись в таблицу `pixel_configs`:

```sql
INSERT INTO pixel_configs (
  project_id,
  fb_pixel_id,
  fb_access_token,
  fb_test_event_code,
  is_active
) VALUES (
  '64c94e87-630c-470e-8ab1-8f7c8c835efa',
  'YOUR_PIXEL_ID',
  'YOUR_ACCESS_TOKEN',
  'TEST12345',  -- убрать после тестирования
  true
);
```

### Где взять токен CAPI

1. Зайди в [Events Manager](https://business.facebook.com/events_manager2)
2. Выбери Pixel → Settings → Conversions API
3. Generate Access Token

## Автоматический триггер

Чтобы события отправлялись автоматически при смене статуса лида, используй workflow `CAPI-STATUS-TRIGGER.json` который слушает изменения в Supabase.

## Тестирование

1. Отправь тестовый запрос:
```bash
curl -X POST https://n8n.zapoinov.com/webhook/capi-conversion \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "64c94e87-630c-470e-8ab1-8f7c8c835efa",
    "lead_id": "uuid-лида",
    "event_name": "Schedule"
  }'
```

2. Проверь в [Events Manager → Test Events](https://business.facebook.com/events_manager2) что событие пришло

3. Убери `fb_test_event_code` из `pixel_configs` когда готов к production

## Логирование

Все отправленные события логируются в таблицу `capi_events`:
- `status`: sent / failed
- `response`: ответ от Facebook
- `event_id`: для дедупликации

## Чек-лист

- [ ] Workflow импортирован в n8n
- [ ] Credentials настроены (Supabase Service Key)
- [ ] Environment variable SUPABASE_URL задан
- [ ] Pixel ID и Access Token добавлены в pixel_configs
- [ ] Workflow активирован
- [ ] Тестовое событие успешно отправлено
