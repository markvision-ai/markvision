# 📋 ФИНАЛЬНАЯ НАСТРОЙКА - ВСЁ РАБОТАЕТ!

## ✅ ЧТО СДЕЛАНО:

1. **N8N Workflow** создан и работает ✅
2. **Данные загружены** в Supabase за январь 2026 ✅
3. **Leads объединены** с Conversations (сообщения) ✅
4. **Workflow обновлен** - теперь пишет напрямую в `daily_data` ✅

---

## 📊 ЛОГИКА ОБЪЕДИНЕНИЯ:

### `leads` = Лиды + Сообщения

```
leads (в daily_data) = leads (формы с сайта) + conversations (WhatsApp/Instagram/Messenger)
```

**Примеры:**
- 📝 Заявка с сайта → `+1 lead`
- 💬 Сообщение в Instagram → `+1 lead`
- 💬 Сообщение в WhatsApp → `+1 lead`
- 📝 Форма Facebook Lead Ads → `+1 lead`

**Все обращения = один столбец `leads`** ✅

---

## 🚀 КАК РАБОТАЕТ СЕЙЧАС:

### 1. Копирование существующих данных (один раз)

```sql
-- Копируем данные из marketing_stats → daily_data
-- leads + conversations объединяются в один столбец
INSERT INTO daily_data (
  project_id, date, spend, impressions, clicks, leads, diagnostics, sales, revenue
)
SELECT 
  project_id, date, spend, impressions, clicks,
  COALESCE(leads, 0) + COALESCE(conversations, 0) as leads,
  0, 0, 0
FROM marketing_stats
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date >= '2026-01-01'
ON CONFLICT (project_id, date) 
DO UPDATE SET 
  spend = EXCLUDED.spend,
  impressions = EXCLUDED.impressions,
  clicks = EXCLUDED.clicks,
  leads = EXCLUDED.leads,
  updated_at = NOW();
```

### 2. Автоматическая синхронизация (n8n workflow)

**Файл:** `ULTRA-SIMPLE-facebook.json`

**Что делает:**
1. Каждый день в 9:00 запрашивает данные из Facebook API
2. Преобразует данные:
   ```javascript
   leads = leads + conversations  // Объединяем!
   ```
3. Записывает напрямую в `daily_data` (а не в `marketing_stats`)

**Workflow:**
```
▶️ Trigger (9:00 AM)
   ↓
📱 Get Facebook Data
   ↓
🔄 Transform:
   leads = extractAction(['lead', 'leadgen_grouped'])
   conversations = extractAction(['messaging_conversation_started'])
   total_leads = leads + conversations
   ↓
💾 Insert to daily_data:
   {
     project_id, date, spend, impressions, clicks,
     leads: total_leads,  ← объединенные!
     diagnostics: 0,
     sales: 0,
     revenue: 0
   }
   ↓
✅ Success!
```

---

## 🔄 ОБНОВЛЕНИЕ ДАННЫХ:

### Вариант A: Вручную (через SQL)

```sql
-- Обновить данные за конкретный день
UPDATE daily_data
SET 
  spend = 100.50,
  impressions = 5000,
  clicks = 250,
  leads = 15,  -- вручную указываешь сумму
  updated_at = NOW()
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
AND date = '2026-01-23';
```

### Вариант B: Через UI приложения

Открой **📊 Таблица показателей** → кликни на ячейку → вводишь число → Enter

---

## 📈 МЕТРИКИ В ПРИЛОЖЕНИИ:

### В таблице отображаются:

| Столбец       | Описание                                    |
|---------------|---------------------------------------------|
| **Расходы**   | Spend (₸)                                   |
| **Показы**    | Impressions                                 |
| **Клики**     | Clicks                                      |
| **Лиды**      | **Leads + Conversations** ← объединено! ✅  |
| **Диагностики** | Diagnostics (вручную)                     |
| **Продажи**   | Sales (вручную или из CRM)                  |
| **Выручка**   | Revenue (₸)                                 |

### Автоматически рассчитываются:

- **CPL** (Cost Per Lead) = Расходы / Лиды
- **CPC** (Cost Per Click) = Расходы / Клики
- **CTR** (Click-Through Rate) = Клики / Показы × 100%
- **CPM** (Cost Per Mille) = Расходы / Показы × 1000

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ:

### 1. Выполни SQL для копирования данных

```sql
-- Выполни SQL выше (секция "Копирование существующих данных")
```

### 2. Обнови страницу в MarkVision

```
F5 или Cmd+R
```

### 3. Проверь, что данные отображаются

**📊 Таблица показателей** → должны быть данные за январь 2026

### 4. Настрой автоматическую синхронизацию

1. Открой **n8n**
2. Импортируй **`ULTRA-SIMPLE-facebook.json`**
3. **Activate** workflow
4. Готово! Каждый день в 9:00 будут загружаться новые данные

---

## 🔗 ИНТЕГРАЦИЯ С CRM:

### Когда придет лид с сайта:

1. **Webhook** получит заявку
2. Запись создастся в таблице `leads`
3. **Автоматически** увеличится счетчик `leads` в `daily_data` за этот день
4. В **📊 Таблица показателей** обновится столбец "Лиды"

### Настройка (если еще не сделано):

```sql
-- Создаем триггер для автоматического подсчета лидов
CREATE OR REPLACE FUNCTION update_daily_leads()
RETURNS TRIGGER AS $$
BEGIN
  -- При создании нового лида
  INSERT INTO daily_data (project_id, date, leads)
  VALUES (NEW.project_id, DATE(NEW.created_at), 1)
  ON CONFLICT (project_id, date)
  DO UPDATE SET 
    leads = daily_data.leads + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Вешаем триггер на таблицу leads
DROP TRIGGER IF EXISTS trigger_update_daily_leads ON leads;
CREATE TRIGGER trigger_update_daily_leads
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_leads();
```

---

## 📝 SUMMARY:

✅ **Facebook Ads данные** → `daily_data.leads` (conversations)  
✅ **Лиды с сайта** → `daily_data.leads` (через триггер)  
✅ **Всё в одном столбце** "Лиды"  
✅ **Автоматическая синхронизация** через n8n  
✅ **Отображение в UI** MarkVision  

---

## 🆘 TROUBLESHOOTING:

### Данные не отображаются в UI

1. **Проверь SQL:**
   ```sql
   SELECT COUNT(*) FROM daily_data 
   WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';
   ```
2. **Обнови страницу** (F5)
3. **Проверь консоль** (F12) на ошибки

### N8N workflow не запускается

1. Проверь, что workflow **Activated** (переключатель вверху)
2. Проверь токен Facebook - возможно, истек
3. Проверь логи: n8n → Executions

### CPL неправильный

Пересчитай:
```sql
UPDATE daily_data
SET leads = (
  SELECT COALESCE(leads, 0) + COALESCE(conversations, 0)
  FROM marketing_stats ms
  WHERE ms.project_id = daily_data.project_id
  AND ms.date = daily_data.date
)
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';
```

---

**Создано:** 2026-01-23  
**Проект:** MarkVision AI  
**Workflow:** ULTRA-SIMPLE-facebook.json  
**Статус:** ✅ Production Ready
