# 🚀 Быстрый старт: Facebook Sync

## ✅ Чек-лист настройки (5 минут)

### 1️⃣ Supabase миграция

```bash
# Перейдите в папку проекта
cd /Users/urijzapojnov/MarkVision\ AI\ код/markvision

# Примените миграцию
supabase db push

# Или через Supabase Dashboard:
# SQL Editor → New Query → скопируйте содержимое файла
# supabase/migrations/20260123000000_add_facebook_metrics.sql
```

### 2️⃣ Получите Facebook Token

**Быстрый способ:**
1. https://developers.facebook.com/tools/explorer/
2. Выберите ваше приложение
3. Generate Access Token
4. Разрешения: `ads_read`, `ads_management`
5. **Важно**: Get Long-Lived Token (внизу страницы)

**Ваш Account ID**: `act_1890905081453686` ✅ (уже в workflow)

### 3️⃣ N8N - Импорт workflow

1. Откройте n8n
2. **Import from File** → `facebook-sync-improved.json`
3. Workflow появится в списке

### 4️⃣ Настройка Credentials

**Facebook:**
```
Settings → Credentials → Add Credential
Type: HTTP Request Auth
Name: Facebook Graph API
Fields:
  - accessToken: ВАШ_ТОКЕН_СЮДА
```

**Supabase:**
```
Settings → Credentials → Add Credential
Type: Supabase API
Name: MarkVision Supabase
Host: https://ВАШ-ПРОЕКТ.supabase.co
Service Role Key: ВАШ_SERVICE_KEY
```

### 5️⃣ Обновите workflow

В каждом узле с Supabase:
1. Кликните на узел
2. Credentials → выберите "MarkVision Supabase"
3. n8n автоматически подставит ID

То же для узла "Get FB Stats":
1. Credentials → выберите "Facebook Graph API"

### 6️⃣ Тест запуск

```
1. Кликните "Execute Workflow"
2. Проверьте каждый узел (зеленые галочки)
3. Последний узел должен показать: ✅ success: true
```

### 7️⃣ Активируйте автоматический запуск

```
Toggle вверху справа: OFF → ON
Workflow будет запускаться каждый час автоматически
```

---

## 🔍 Быстрая проверка

### Проверка в Supabase:

```sql
-- Есть ли данные за сегодня?
SELECT * FROM marketing_stats 
WHERE date = CURRENT_DATE 
AND source = 'facebook_ads';

-- Используйте новый view
SELECT * FROM facebook_stats_daily 
LIMIT 5;

-- Проверка здоровья синхронизации
SELECT * FROM check_facebook_sync_health('64c94e87-630c-470e-8ab1-8f7c8c835efa');
```

---

## ⚠️ Частые ошибки

| Ошибка | Решение |
|--------|---------|
| "Invalid access token" | Token истек → сгенерируйте Long-Lived Token |
| "Column reach does not exist" | Запустите миграцию SQL |
| "No data" | Проверьте Account ID или используйте `date_preset: "yesterday"` |
| "Permission denied" | В Supabase credentials используйте Service Role Key, не Anon Key |

---

## 📊 Что вы получите

После настройки каждый час автоматически:

✅ Данные из Facebook Ads синхронизируются в Supabase  
✅ Если запись существует - обновляется  
✅ Если новая - создается  
✅ Логи всех операций в n8n  

**Метрики:**
- 💰 Spend (расходы)
- 👁️ Impressions (показы)
- 🖱️ Clicks (клики)
- 👥 Reach (охват)
- 📊 CTR (кликабельность)
- 💵 CPC (цена клика)
- 💵 CPM (цена 1000 показов)

---

## 🎯 Следующие шаги

1. **Дашборд**: Создайте визуализацию в AnalyticsPlatform
2. **Алерты**: Настройте уведомления при превышении бюджета
3. **Google Ads**: Клонируйте workflow для других источников
4. **Webhooks**: Добавьте webhook триггер для синхронизации по требованию

---

## 🆘 Нужна помощь?

**Тест в Graph API Explorer:**
```
GET /act_1890905081453686/insights?fields=spend,impressions,clicks,reach,ctr,cpc,cpm&date_preset=today
```

Если работает там → проблема в n8n credentials  
Если не работает → проблема в токене или правах

---

**Время настройки**: 5 минут ⏱️  
**Сложность**: Легко 🟢  
**Готово к продакшену**: ✅
