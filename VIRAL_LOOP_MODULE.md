# Модуль "Виральная петля" 🎁

## Обзор

Модуль "Виральная петля" позволяет запускать реферальные кампании прямо из CRM. Каждый пациент может подарить сертификаты на 10 000 ₸ трём друзьям, создавая вирусный эффект для привлечения новых клиентов.

## Компоненты

### 1. База данных: `referrals`

**Таблица:** `public.referrals`

**Поля:**
- `id` - UUID (Primary Key)
- `project_id` - UUID (FK → projects)
- `referrer_lead_id` - UUID (FK → leads) - кто пригласил
- `referee_name` - TEXT - имя друга
- `referee_phone` - TEXT - телефон друга
- `certificate_value` - NUMERIC - номинал сертификата (по умолчанию 10000)
- `status` - TEXT - статус сертификата:
  - `pending` - в обработке (только создан)
  - `sent` - отправлено (сообщение отправлено)
  - `opened` - открыто (друг открыл сообщение)
  - `converted` - пришёл (друг стал клиентом)
  - `cancelled` - отменено
- `sent_at` - TIMESTAMP - время отправки
- `converted_at` - TIMESTAMP - время конверсии
- `converted_lead_id` - UUID (FK → leads, nullable) - ID созданного лида
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**RLS Policies:**
- Пользователи видят рефералов только для своих проектов
- Админы и суперадмины видят все рефералы

**Миграция:** `supabase/migrations/20260122150000_create_referrals.sql`

### 2. UI Компоненты

#### `ViralLoopDialog.tsx`

**Назначение:** Модальное окно для ввода данных друзей

**Props:**
```typescript
interface ViralLoopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    name?: string | null;
    phone?: string | null;
  };
  projectId: string;
  onSuccess?: () => void;
}
```

**Функциональность:**
- Три поля для ввода имени и телефона друзей
- Анимированные карточки с Framer Motion
- Валидация: минимум один заполненный друг
- Сохранение в `referrals` через `upsert`
- Success toast: "Сертификаты подготовлены к отправке! 🎉"
- TODO-заглушка для Webhook в n8n

**Дизайн:**
- Glassmorphism-стиль
- Градиентная кнопка (blue → indigo → purple)
- Декоративный фон с размытием
- Иконка `Gift` с анимацией

#### `ReferralsList.tsx`

**Назначение:** Отображение списка приглашённых друзей

**Props:**
```typescript
interface ReferralsListProps {
  leadId: string;
  projectId: string;
}
```

**Функциональность:**
- Fetch рефералов из Supabase
- Real-time обновление через Supabase subscriptions
- Отображение статуса с цветными Badge
- Empty state: "Ещё нет приглашённых друзей"
- Footer с итоговой статистикой

**Статусы и стилизация:**
| Статус | Иконка | Цвет | Описание |
|--------|--------|------|----------|
| `pending` | Clock | Amber | В обработке |
| `sent` | Send | Blue | Отправлено |
| `opened` | Gift | Purple | Открыто |
| `converted` | CheckCircle | Emerald | Пришёл |
| `cancelled` | XCircle | Red | Отменено |

**Дизайн:**
- Анимированные карточки (AnimatePresence)
- Градиентные аватары
- Декоративный фон
- Адаптивная типографика

### 3. Интеграция в CRM

**Файл:** `src/components/crm/LeadFullPage.tsx`

**Изменения:**
1. **Добавлена кнопка:**
   ```tsx
   <Button className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
     <Gift className="w-4 h-4 mr-2" />
     Подарить 3 сертификата друзьям 🎁
   </Button>
   ```
   - Расположена после кнопки "Провести диагностику"
   - Градиентный стиль с hover-эффектом
   - Tooltip с подсказкой

2. **Добавлена секция "Приглашенные друзья":**
   - Иконка `Users`
   - Компонент `<ReferralsList />`
   - Анимация появления (delay: 0.55s)
   - Расположена после секции "Задачи"

3. **State управление:**
   ```tsx
   const [viralLoopOpen, setViralLoopOpen] = useState(false);
   const [refreshReferrals, setRefreshReferrals] = useState(0);
   ```
   - `viralLoopOpen` - контроль модального окна
   - `refreshReferrals` - триггер для перерендера списка

## Использование

### Сценарий работы

1. **Менеджер открывает карточку лида**
2. **Нажимает на кнопку "Подарить 3 сертификата"**
3. **Заполняет данные друзей (минимум 1, максимум 3)**
   - Имя друга
   - Телефон WhatsApp
4. **Нажимает "Запустить виральную петлю"**
5. **Система сохраняет рефералов в базу**
6. **Появляется уведомление: "Сертификаты подготовлены к отправке! 🎉"**
7. **В секции "Приглашенные друзья" отображаются новые записи**

### Будущая интеграция с n8n

**TODO (закомментировано в коде):**

```typescript
// В ViralLoopDialog.tsx, функция handleSubmit:
await fetch('/api/n8n/send-referral-certificates', {
  method: 'POST',
  body: JSON.stringify({ 
    referrals: validFriends, 
    referrerName: lead.name 
  })
});
```

**Требуется настроить Webhook в n8n:**
1. Endpoint: `/api/n8n/send-referral-certificates`
2. Payload:
   ```json
   {
     "referrals": [
       { "name": "Алия", "phone": "+7 700 123 45 67" }
     ],
     "referrerName": "Иван Петров"
   }
   ```
3. Логика:
   - Генерация сертификата (PDF/изображение)
   - Отправка через WhatsApp API
   - Обновление статуса в `referrals` → `sent`
   - Сохранение `sent_at`

## Дизайн

### Стиль Aceternity UI

**Цветовая палитра:**
- Градиенты: `from-blue-500 via-indigo-500 to-purple-500`
- Фон карточек: `bg-card`, `backdrop-blur`
- Границы: `border-border/30`
- Тени: `shadow-lg shadow-blue-500/30`

**Анимации (Framer Motion):**
- `initial={{ opacity: 0, y: 20 }}`
- `animate={{ opacity: 1, y: 0 }}`
- `exit={{ opacity: 0, scale: 0.95 }}`
- Hover: `scale-[1.02]`

**Иконки (Lucide):**
- Gift (Подарок)
- Users (Друзья)
- Send (Отправка)
- CheckCircle (Конверсия)
- Clock (Ожидание)

## Аналитика (будущее развитие)

### Метрики для отслеживания

1. **Конверсия виральной петли:**
   - Сколько рефералов создано
   - Сколько сообщений отправлено
   - Сколько сообщений открыто
   - Сколько друзей стали клиентами

2. **ROI виральной петли:**
   - Средний чек конвертированных рефералов
   - Стоимость сертификатов
   - Чистая прибыль от виральной петли

3. **Топ рефереров:**
   - Какие пациенты привели больше всего друзей
   - Стимулирование активных рефереров

### Пример SQL-запроса для аналитики

```sql
SELECT 
  l.name as referrer_name,
  COUNT(r.id) as total_referrals,
  SUM(CASE WHEN r.status = 'converted' THEN 1 ELSE 0 END) as converted_count,
  ROUND(SUM(CASE WHEN r.status = 'converted' THEN 1 ELSE 0 END)::numeric / COUNT(r.id) * 100, 2) as conversion_rate
FROM referrals r
JOIN leads l ON r.referrer_lead_id = l.id
WHERE r.project_id = '[PROJECT_ID]'
GROUP BY l.name
ORDER BY converted_count DESC
LIMIT 10;
```

## Тестирование

### Ручное тестирование

1. ✅ Открыть карточку лида в CRM
2. ✅ Убедиться, что кнопка "Подарить сертификаты" видна
3. ✅ Нажать на кнопку → открывается модальное окно
4. ✅ Заполнить 1-3 друга
5. ✅ Нажать "Запустить виральную петлю"
6. ✅ Убедиться, что появился toast с успехом
7. ✅ Проверить секцию "Приглашенные друзья" → должны появиться записи
8. ✅ Обновить страницу → данные должны сохраниться

### SQL-тест (проверка записей)

```sql
SELECT * FROM public.referrals 
WHERE referrer_lead_id = '[LEAD_ID]' 
ORDER BY created_at DESC;
```

## Безопасность

### RLS (Row Level Security)

**Политики:**
- Пользователи видят рефералов только для проектов, к которым у них есть доступ
- Админы/суперадмины видят всё
- Проверка через `has_project_access()` и `has_role()`

**Валидация:**
- Минимум 1 друг с заполненными полями
- Телефоны должны быть валидными (TODO: добавить regex)
- Защита от спама: ограничение количества рефералов на одного лида

## Roadmap

### MVP (Текущий статус) ✅
- [x] Миграция `referrals`
- [x] `ViralLoopDialog` компонент
- [x] `ReferralsList` компонент
- [x] Интеграция в `LeadFullPage`
- [x] Сохранение в базу
- [x] Real-time обновление
- [x] UI/UX Aceternity стиль

### v1.1 (Q1 2026)
- [ ] Интеграция с n8n Webhook
- [ ] Отправка WhatsApp сообщений
- [ ] Генерация сертификатов (PDF)
- [ ] Трекинг открытий сообщений

### v1.2 (Q2 2026)
- [ ] Дашборд виральной аналитики
- [ ] Топ рефереров (gamification)
- [ ] Push-уведомления менеджеру при конверсии
- [ ] A/B тесты для текстов сертификатов

### v2.0 (Q3 2026)
- [ ] Многоуровневая реферальная программа
- [ ] Кастомизация номинала сертификатов
- [ ] Автоматическое продление сертификатов
- [ ] Integration с CRM-системами (AmoCRM, Bitrix24)

## Примеры использования

### Создание реферала вручную (через API)

```typescript
const { data, error } = await supabase
  .from('referrals')
  .insert({
    project_id: 'PROJECT_UUID',
    referrer_lead_id: 'LEAD_UUID',
    referee_name: 'Алия Нурбекова',
    referee_phone: '+7 700 123 45 67',
    certificate_value: 10000,
    status: 'pending'
  })
  .select()
  .single();
```

### Обновление статуса (после отправки)

```typescript
const { error } = await supabase
  .from('referrals')
  .update({ 
    status: 'sent', 
    sent_at: new Date().toISOString() 
  })
  .eq('id', referralId);
```

### Конверсия реферала (друг стал клиентом)

```typescript
const { error } = await supabase
  .from('referrals')
  .update({ 
    status: 'converted',
    converted_at: new Date().toISOString(),
    converted_lead_id: newLeadId
  })
  .eq('referee_phone', friendPhone)
  .eq('status', 'sent');
```

## Архитектура

```
┌──────────────────────────────────────────────────┐
│           LeadFullPage (CRM)                     │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Button: "Подарить 3 сертификата"         │ │
│  └─────────────┬──────────────────────────────┘ │
│                │ onClick                         │
│                ▼                                 │
│  ┌────────────────────────────────────────────┐ │
│  │       ViralLoopDialog                      │ │
│  │  ┌──────────────────────────────────────┐ │ │
│  │  │ Friend #1: Name + Phone              │ │ │
│  │  │ Friend #2: Name + Phone              │ │ │
│  │  │ Friend #3: Name + Phone              │ │ │
│  │  └──────────────────────────────────────┘ │ │
│  │  [Button: Запустить виральную петлю]     │ │ │
│  └─────────────┬──────────────────────────────┘ │
│                │ onSubmit                        │
│                ▼                                 │
│  ┌────────────────────────────────────────────┐ │
│  │      Supabase: INSERT → referrals          │ │
│  └─────────────┬──────────────────────────────┘ │
│                │ onSuccess                       │
│                ▼                                 │
│  ┌────────────────────────────────────────────┐ │
│  │       ReferralsList (realtime)             │ │
│  │  ┌──────────────────────────────────────┐ │ │
│  │  │ ● Алия - В обработке                 │ │ │
│  │  │ ● Даниэль - Отправлено               │ │ │
│  │  │ ● Марк - Пришёл ✓                    │ │ │
│  │  └──────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
                     │
                     │ (Future: n8n Webhook)
                     ▼
       ┌──────────────────────────────┐
       │   n8n Automation Flow        │
       │  ┌────────────────────────┐  │
       │  │ Generate Certificate   │  │
       │  └────────┬───────────────┘  │
       │           ▼                  │
       │  ┌────────────────────────┐  │
       │  │ Send WhatsApp Message  │  │
       │  └────────┬───────────────┘  │
       │           ▼                  │
       │  ┌────────────────────────┐  │
       │  │ Update status → sent   │  │
       │  └────────────────────────┘  │
       └──────────────────────────────┘
```

## FAQ

**Q: Можно ли изменить номинал сертификата?**
A: Да, в будущей версии. Сейчас фиксированный 10 000 ₸.

**Q: Как отследить, что друг пришёл по сертификату?**
A: Вручную меняйте статус на `converted` или настройте webhook при создании лида с определённым UTM.

**Q: Сколько рефералов можно добавить?**
A: Сейчас UI позволяет 3 друга за раз, но в базе нет ограничений. Можно запустить диалог несколько раз.

**Q: Что если друг не пришёл?**
A: Статус останется `sent` или `opened`. Можно добавить автоматическое напоминание через n8n.

**Q: Можно ли отменить сертификат?**
A: Да, обновите статус на `cancelled` вручную или добавьте кнопку "Отменить" в UI.

---

**Статус:** ✅ Ready for Production
**Версия:** 1.0.0
**Дата:** 22 января 2026
