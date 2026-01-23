# N8N Workflows для MarkVision

## Facebook Ads Sync - Улучшенная версия

### 📋 Что исправлено:

#### 1. **Безопасность**
- ❌ **Было**: Токен Facebook в открытом виде в JSON
- ✅ **Стало**: Использование credentials системы n8n `{{ $credentials.facebookGraphApi.accessToken }}`

#### 2. **Проблема с обновлением записей**
- ❌ **Было**: `updateKey: "id"` без передачи самого ID
- ✅ **Стало**: Добавлен узел "Merge Data", который извлекает ID из существующей записи и передает его в Update

#### 3. **Проверка существования**
- ❌ **Было**: Некорректный фильтр `"filter": "project_id=eq..."`
- ✅ **Стало**: Правильный формат с массивом conditions для Supabase API

#### 4. **Обработка ошибок**
- ❌ **Было**: Нет обработки пустых данных
- ✅ **Стало**: Добавлена валидация данных + Error Handler узел

#### 5. **Дополнительные метрики**
- ❌ **Было**: Только spend, impressions, clicks
- ✅ **Стало**: + reach, ctr, cpc, cpm (важные метрики для аналитики)

#### 6. **Версия API**
- ❌ **Было**: v19.0 (устаревшая)
- ✅ **Стало**: v21.0 (актуальная версия Graph API)

---

## 🚀 Инструкция по установке

### Шаг 1: Импорт workflow в n8n

1. Откройте n8n
2. Нажмите "Import from File"
3. Выберите `facebook-sync-improved.json`

### Шаг 2: Настройка Facebook Credentials

1. В n8n перейдите в **Settings → Credentials**
2. Создайте новый credential:
   - Type: **HTTP Request Auth** или **Generic Credential Type**
   - Name: `Facebook Graph API`
   - Добавьте поле:
     - Name: `accessToken`
     - Value: `ваш_токен_facebook`

**Как получить Facebook Access Token:**

1. Перейдите на [Facebook Developers](https://developers.facebook.com/)
2. Выберите ваше приложение
3. Tools → Graph API Explorer
4. Сгенерируйте токен с правами:
   - `ads_read`
   - `ads_management`
   - `business_management`

⚠️ **Важно**: Используйте Long-Lived Token (действует 60 дней)

### Шаг 3: Настройка Supabase Credentials

1. В n8n: **Settings → Credentials**
2. Создайте credential:
   - Type: **Supabase API**
   - Name: `MarkVision Supabase`
   - Host: ваш supabase URL (например: `https://xxx.supabase.co`)
   - Service Role Key: ваш service_role_key из Supabase

### Шаг 4: Обновление ID в workflow

В каждом узле Supabase замените:
```json
"credentials": {
  "supabaseApi": {
    "id": "your_supabase_credential_id" // ← заменить на реальный ID
  }
}
```

**Как найти credential ID:**
1. Откройте любой Supabase узел
2. Выберите ваш credential из списка
3. n8n автоматически подставит правильный ID

### Шаг 5: Переменные окружения (опционально)

Добавьте в n8n Environment Variables:

```bash
PROJECT_ID=64c94e87-630c-470e-8ab1-8f7c8c835efa
FACEBOOK_ACCOUNT_ID=1890905081453686
```

Это позволит легко менять настройки без редактирования workflow.

---

## 📊 Структура workflow

```
Schedule Trigger (каждый час)
    ↓
Get FB Stats (Facebook Graph API)
    ↓
Transform Data (преобразование + валидация)
    ↓
Check If Data Valid (есть ли данные?)
    ↓ (да)              ↓ (нет)
Check If Exists      Error Handler
    ↓
Merge Data (объединение с ID записи)
    ↓
If Record Exists
    ↓               ↓
Update Record   Create Record
    ↓               ↓
    Log Success
```

---

## 🔧 Проверка работы Supabase таблицы

Убедитесь, что в вашей таблице `marketing_stats` есть все нужные колонки:

```sql
-- Проверка структуры таблицы
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'marketing_stats';
```

**Необходимые колонки:**
- `id` (uuid, primary key)
- `project_id` (uuid)
- `date` (date)
- `spend` (numeric)
- `impressions` (integer)
- `clicks` (integer)
- `reach` (integer) ← **новая**
- `ctr` (numeric) ← **новая**
- `cpc` (numeric) ← **новая**
- `cpm` (numeric) ← **новая**
- `source` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Если новых колонок нет, добавьте их:**

```sql
ALTER TABLE marketing_stats
ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ctr NUMERIC(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpc NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cpm NUMERIC(10,2) DEFAULT 0;
```

---

## 🧪 Тестирование

### 1. Ручной запуск

1. Откройте workflow в n8n
2. Нажмите "Execute Workflow"
3. Проверьте вывод каждого узла

### 2. Проверка в Supabase

```sql
-- Последние записи
SELECT * FROM marketing_stats 
WHERE source = 'facebook_ads' 
ORDER BY created_at DESC 
LIMIT 5;

-- Данные за сегодня
SELECT * FROM marketing_stats 
WHERE date = CURRENT_DATE 
AND source = 'facebook_ads';
```

---

## 🚨 Troubleshooting

### Ошибка: "No data from Facebook API"

**Причины:**
1. Токен истек (обновляется каждые 60 дней)
2. Неправильный account ID
3. Нет данных за сегодня

**Решение:**
- Проверьте токен в Graph API Explorer
- Используйте `date_preset: "last_7d"` для теста

### Ошибка: "Invalid credentials"

**Решение:**
1. Пересоздайте Supabase credential
2. Убедитесь, что используете Service Role Key (не anon key)

### Ошибка: "Column does not exist"

**Решение:**
Выполните миграцию для добавления новых колонок (см. выше)

---

## 📈 Мониторинг

### Логи в n8n

Все операции логируются в узлах:
- `Transform Data` - что получено от FB
- `Merge Data` - найдена ли запись
- `Log Success` - результат операции

### Проверка синхронизации

```sql
-- Проверка регулярности обновлений
SELECT 
  date,
  source,
  spend,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at))/3600 as hours_ago
FROM marketing_stats 
WHERE source = 'facebook_ads'
ORDER BY date DESC
LIMIT 10;
```

---

## 🔄 Следующие шаги

1. **Добавить другие источники**: Google Ads, TikTok Ads
2. **Webhook триггер**: Синхронизация по требованию
3. **Уведомления**: Slack/Telegram при ошибках
4. **Aggregate данные**: Недельные/месячные отчеты

---

## 📞 Поддержка

Если workflow не работает:
1. Проверьте все credentials
2. Убедитесь что Account ID правильный
3. Проверьте структуру таблицы Supabase
4. Проверьте логи в n8n Executions

---

**Версия**: 2.0.0  
**Последнее обновление**: Январь 2026  
**Автор**: MarkVision Team
