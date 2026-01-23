# 🚀 ФИНАЛЬНАЯ НАСТРОЙКА СИНХРОНИЗАЦИИ FACEBOOK → SUPABASE

## ✅ ЧТО МЫ СДЕЛАЛИ:

1. **Исправили OAuth** - токен больше не деактивируется после обновления
2. **Добавили метрики** - лиды и переписки теперь синхронизируются
3. **Создали 2 workflow**:
   - `facebook-sync-FINAL-january.json` - загрузить ВСЕ данные за январь 2026
   - `facebook-sync-DAILY-auto.json` - ежедневная синхронизация (каждый день в 9:00)
4. **Задеплоили на Vercel** - https://markvision-alpha.vercel.app

---

## 📋 ПОШАГОВАЯ ИНСТРУКЦИЯ

### ШАГ 1: Очистить старые данные в Supabase

Открой **Supabase SQL Editor** и выполни:

```sql
-- Удаляем все данные за январь 2026
DELETE FROM marketing_stats 
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01' 
AND date < '2026-02-01';

-- Проверка (должно быть 0)
SELECT COUNT(*) FROM marketing_stats 
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01';
```

---

### ШАГ 2: Импортировать workflow в n8n

#### 2.1 Полная загрузка за январь

1. Открой n8n
2. **Import from File** → выбери `facebook-sync-FINAL-january.json`
3. **Настрой Supabase credentials**:
   - URL: `https://gfivlqggxiqhvhbsbzjy.supabase.co`
   - Service Role Key: твой ключ
4. **Запусти вручную** (Manual Trigger)
5. Проверь результат - должно импортироваться ~23 дня

#### 2.2 Ежедневная автоматическая синхронизация

1. **Import from File** → выбери `facebook-sync-DAILY-auto.json`
2. Настрой те же Supabase credentials
3. **Activate** workflow (переключатель в правом верхнем углу)
4. Workflow будет запускаться **каждый день в 9:00**

---

### ШАГ 3: Проверка в MarkVision

1. Открой **Vercel**: https://markvision-alpha.vercel.app
2. Залогинься
3. Перейди на **Интеграции** → **Facebook & Instagram**
4. Если токен неактивен - получи новый через **Graph API Explorer**:
   ```
   Разрешения:
   - ads_read
   - ads_management
   - business_management
   - pages_show_list
   - instagram_basic
   - instagram_manage_insights
   ```
5. **Обнови токен** в Supabase:
   ```sql
   UPDATE ad_accounts 
   SET access_token = 'ТВОЙ_НОВЫЙ_ТОКЕН', 
       status = 'active'
   WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
   AND platform = 'facebook';
   ```
6. **Обнови страницу** - токен должен остаться активным

---

### ШАГ 4: Проверка данных

#### 4.1 В Supabase

```sql
-- Все данные за январь
SELECT 
  date,
  spend,
  impressions,
  clicks,
  leads,
  conversations,
  reach,
  ctr
FROM marketing_stats
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01'
ORDER BY date DESC;

-- Итоги за январь
SELECT 
  COUNT(*) as days,
  SUM(spend)::numeric(10,2) as total_spend,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(leads) as total_leads,
  SUM(conversations) as total_conversations
FROM marketing_stats
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01';
```

#### 4.2 В MarkVision

- Открой **Аналитика** или **Facebook Ads**
- Должны отображаться:
  - ✅ Расходы за период
  - ✅ Показы, клики, охват
  - ✅ **Лиды**
  - ✅ **Переписки**

---

## 🔍 TROUBLESHOOTING

### Проблема: "No data from Facebook API"

**Решение:**
- Проверь, что в рекламном кабинете `act_1005197113823722` были запущены кампании за этот период
- Проверь срок действия токена в Graph API Explorer

### Проблема: "Leads = 0, Conversations = 0"

**Решение:**
- В Facebook Ads Manager проверь, настроена ли цель "Лиды" или "Сообщения"
- Если используется пиксель с событиями, проверь правильность `action_type` в API:
  ```javascript
  // В Transform node можно добавить логирование:
  console.log('Available actions:', fbData.actions);
  ```

### Проблема: Instagram не подключается

**Причина:** Instagram Business требует подключенную Facebook Page

**Решение:**
1. В Facebook Business Manager убедись, что:
   - Instagram аккаунт **привязан к Facebook Page**
   - У Page есть админские права
   - В настройках n8n/MarkVision указан **page_id**, а не user_id

---

## 📊 МЕТРИКИ В WORKFLOW

### Основные метрики:
- `spend` - расходы (₸)
- `impressions` - показы
- `clicks` - клики
- `reach` - охват
- `ctr` - CTR (%)
- `cpc` - CPC (₸)
- `cpm` - CPM (₸)

### Конверсионные метрики:
- `leads` - лиды (form submissions)
  - `action_type`: `lead`, `leadgen_grouped`
- `conversations` - начало переписок
  - `action_type`: 
    - `onsite_conversion.messaging_conversation_started_7d`
    - `onsite_conversion.messaging_first_reply`
    - `onsite_conversion.post_save`

---

## 🎯 NEXT STEPS

1. ✅ Проверь импорт данных за январь
2. ✅ Убедись, что ежедневная синхронизация работает
3. ✅ Проверь отображение лидов и переписок в MarkVision
4. 🔜 Настрой Instagram Business (требуется Page ID)
5. 🔜 Добавь уведомления о новых лидах (webhook)

---

## 📞 ПОДДЕРЖКА

Если что-то не работает:
1. Проверь **n8n Executions** - там логи ошибок
2. Проверь **Supabase logs** - ошибки БД
3. Проверь **Browser Console** (F12) - ошибки фронтенда
4. Проверь **Vercel Deployment logs** - ошибки деплоя

---

**Создано:** 2026-01-23  
**Версия:** 2.0 Final  
**Проект:** MarkVision AI  
**Разработчик:** Aiva-clinic1
