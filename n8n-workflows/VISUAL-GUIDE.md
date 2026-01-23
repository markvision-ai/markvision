# 🎨 Визуальный гид: Как работает Facebook Sync

## 🔄 Связка систем

```
┌──────────────────┐
│  FACEBOOK ADS    │  ← Источник данных (реклама)
│   Graph API      │
└────────┬─────────┘
         │
         │ REST API Call (каждый час)
         │ https://graph.facebook.com/v21.0/
         │
         ↓
┌──────────────────┐
│      N8N         │  ← Автоматизация (оркестратор)
│   Workflow       │
│                  │
│  1. Schedule ⏰  │  Триггер: каждый час
│  2. Get Data 📥 │  Получение статистики FB
│  3. Transform 🔄│  Преобразование формата
│  4. Validate ✅  │  Проверка данных
│  5. Check DB 🔍 │  Есть ли запись за сегодня?
│  6. Merge 🔗    │  Объединение с ID
│  7. Upsert 💾   │  Create или Update
│  8. Log 📝      │  Логирование результата
│                  │
└────────┬─────────┘
         │
         │ Supabase REST API
         │ POST/PATCH requests
         │
         ↓
┌──────────────────┐
│    SUPABASE      │  ← База данных (хранилище)
│   PostgreSQL     │
│                  │
│  marketing_stats │  Таблица с данными
│  ├─ spend 💰    │
│  ├─ impressions │
│  ├─ clicks      │
│  ├─ reach       │
│  ├─ ctr         │
│  ├─ cpc         │
│  └─ cpm         │
│                  │
└────────┬─────────┘
         │
         │ SQL Queries
         │ SELECT/JOIN
         │
         ↓
┌──────────────────┐
│   MARKVISION     │  ← Frontend (визуализация)
│    Dashboard     │
│                  │
│  - Analytics 📊  │
│  - Finance 💵   │
│  - Reports 📄   │
│  - Alerts 🔔    │
│                  │
└──────────────────┘
```

---

## 🎬 Сценарий работы

### Сценарий 1: Первый запуск за день (CREATE)

```
09:00 AM ⏰
│
├─ [Trigger] N8N просыпается
│   └─ "Пора проверить Facebook!"
│
├─ [API Call] Запрос к Facebook
│   Request: GET /act_1890905081453686/insights?date_preset=today
│   └─ Response: { spend: 150.50, impressions: 25000, clicks: 450 ... }
│
├─ [Transform] Преобразование данных
│   Input:  { spend: "150.50", impressions: "25000" }
│   Output: { spend: 150.50, impressions: 25000, date: "2026-01-23" }
│
├─ [Validate] Проверка
│   ✅ Data valid: true
│   ✅ Skip: false
│
├─ [Check DB] Проверка Supabase
│   Query: WHERE project_id = '...' AND date = '2026-01-23' AND source = 'facebook_ads'
│   Result: [] (пусто - записи нет)
│
├─ [Merge] Подготовка
│   exists: false
│   recordId: null
│
├─ [Decision] IF exists?
│   Answer: NO → CREATE branch
│
├─ [Create] Создание записи
│   INSERT INTO marketing_stats (...)
│   VALUES ('2026-01-23', 150.50, 25000, ...)
│   └─ ✅ Success! Record ID: abc-123
│
└─ [Log] Финальный лог
    └─ "✅ Facebook stats created successfully"
```

---

### Сценарий 2: Повторный запуск за день (UPDATE)

```
10:00 AM ⏰ (час спустя)
│
├─ [Trigger] N8N снова запускается
│
├─ [API Call] Новый запрос к Facebook
│   Response: { spend: 180.75, impressions: 28000, clicks: 510 ... }
│   └─ (данные изменились за час!)
│
├─ [Transform] Преобразование
│   Output: { spend: 180.75, impressions: 28000, date: "2026-01-23" }
│
├─ [Check DB] Проверка Supabase
│   Query: WHERE date = '2026-01-23' ...
│   Result: [{ id: 'abc-123', spend: 150.50, ... }] ← Запись УЖЕ есть!
│
├─ [Merge] Извлечение ID
│   exists: true
│   recordId: 'abc-123' ← Важно!
│
├─ [Decision] IF exists?
│   Answer: YES → UPDATE branch
│
├─ [Update] Обновление записи
│   UPDATE marketing_stats
│   SET spend = 180.75,
│       impressions = 28000,
│       clicks = 510,
│       updated_at = NOW()
│   WHERE id = 'abc-123'
│   └─ ✅ Success! 1 row updated
│
└─ [Log] Финальный лог
    └─ "✅ Facebook stats updated successfully"
```

---

### Сценарий 3: Ошибка (ERROR HANDLING)

```
11:00 AM ⏰
│
├─ [Trigger] N8N запускается
│
├─ [API Call] Запрос к Facebook
│   Response: { data: [] } ← Пустой массив! (нет данных за сегодня)
│
├─ [Transform] Попытка обработки
│   Input: { data: [] }
│   Logic: if (data.length === 0) return { skip: true }
│   Output: { skip: true, reason: 'no_data' }
│
├─ [Validate] Проверка
│   Check: skip == true?
│   Answer: YES → ERROR branch
│
├─ [Error Handler] Обработка ошибки
│   console.error('❌ Facebook sync failed: no_data')
│   └─ Workflow завершается gracefully (без краша!)
│
└─ [Result] Ничего не сохранено
    └─ "⚠️ No data from Facebook today - will retry next hour"
```

---

## 🔧 Почему старая версия не работала?

### Проблема 1: UPDATE без ID

```
❌ СТАРАЯ ВЕРСИЯ:

[Check If Exists]
    ↓
Returns: [{ id: 'abc-123', spend: 150 }]  ← ID здесь!
    ↓
[If Exists] → YES branch
    ↓
[Update Record]
    Needs: id = ???
    Has: spend, impressions, clicks
    
    ❌ ОШИБКА: "ID не найден! Не могу обновить!"


✅ НОВАЯ ВЕРСИЯ:

[Check If Exists]
    ↓
Returns: [{ id: 'abc-123', spend: 150 }]
    ↓
[Merge Data]  ← Новый узел!
    ↓
Extracts: recordId = 'abc-123'  ← Сохраняем ID
    ↓
[If Exists] → YES branch
    ↓
[Update Record]
    Has: id = 'abc-123' ← Теперь есть!
    
    ✅ РАБОТАЕТ!
```

---

## 🔍 Как работает фильтр Supabase?

### ❌ Старый (неправильный):

```javascript
{
  "filter": "project_id=eq.64c94e87...,date=eq.2026-01-23"
}

// Это работает в REST API, но НЕ в n8n Supabase node!
```

### ✅ Новый (правильный):

```javascript
{
  "filter": {
    "conditions": [
      { "column": "project_id", "operator": "eq", "value": "64c94e87..." },
      { "column": "date", "operator": "eq", "value": "2026-01-23" },
      { "column": "source", "operator": "eq", "value": "facebook_ads" }
    ]
  }
}

// Это правильный формат для n8n Supabase node!
```

---

## 🎯 Data Flow

### Формат данных на каждом этапе:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Facebook API Response                                    │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   "data": [{                                                 │
│     "spend": "150.50",        ← String!                     │
│     "impressions": "25000",   ← String!                     │
│     "clicks": "450",          ← String!                     │
│     "reach": "18000",                                        │
│     "ctr": "1.8",                                            │
│     "cpc": "0.33",                                           │
│     "cpm": "6.02"                                            │
│   }]                                                         │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. After Transform                                          │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   "project_id": "64c94e87-630c-470e-8ab1-8f7c8c835efa",    │
│   "date": "2026-01-23",                                     │
│   "spend": 150.50,           ← Number!                      │
│   "impressions": 25000,      ← Number!                      │
│   "clicks": 450,             ← Number!                      │
│   "reach": 18000,                                            │
│   "ctr": 1.8,                                                │
│   "cpc": 0.33,                                               │
│   "cpm": 6.02,                                               │
│   "source": "facebook_ads",                                  │
│   "skip": false                                              │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. After Check DB                                           │
├─────────────────────────────────────────────────────────────┤
│ [{                                                           │
│   "id": "abc-123-def-456",  ← UUID from Supabase           │
│   "project_id": "64c94e87-...",                             │
│   "date": "2026-01-23",                                     │
│   "spend": 120.00,          ← Old value                     │
│   "impressions": 20000,     ← Old value                     │
│   ...                                                        │
│ }]                                                           │
│                                                              │
│ OR [] if not exists                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. After Merge                                              │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   // All transform data                                     │
│   "spend": 150.50,          ← New value                     │
│   "impressions": 25000,     ← New value                     │
│   ...                                                        │
│   // Plus record info                                       │
│   "exists": true,           ← Added!                        │
│   "recordId": "abc-123..."  ← Added! (for update)          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Saved to Supabase                                        │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   "id": "abc-123-def-456",                                  │
│   "project_id": "64c94e87-...",                             │
│   "date": "2026-01-23",                                     │
│   "spend": 150.50,          ← Updated!                      │
│   "impressions": 25000,     ← Updated!                      │
│   "clicks": 450,            ← Updated!                      │
│   "reach": 18000,           ← Updated!                      │
│   "ctr": 1.8,               ← Updated!                      │
│   "cpc": 0.33,              ← Updated!                      │
│   "cpm": 6.02,              ← Updated!                      │
│   "source": "facebook_ads",                                  │
│   "created_at": "2026-01-23 09:00:00",                      │
│   "updated_at": "2026-01-23 10:00:00"  ← Новое время!      │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Безопасность

### ❌ Старый способ:

```json
// В workflow JSON (видно всем кто имеет доступ к файлу!)
{
  "queryParameters": {
    "parameters": [{
      "name": "access_token",
      "value": "EAAa3xKWvHHYBQvNy16Mqr5H5DHnyZC..." 🚨 УТЕЧКА!
    }]
  }
}
```

### ✅ Новый способ:

```json
// В workflow JSON
{
  "queryParameters": {
    "parameters": [{
      "name": "access_token",
      "value": "={{ $credentials.facebookGraphApi.accessToken }}" ✅
    }]
  },
  "credentials": {
    "facebookGraphApi": {
      "id": "abc-123", // ← Только ссылка на credential
      "name": "Facebook Graph API"
    }
  }
}

// В n8n credentials (зашифровано, хранится отдельно)
// Никто не видит настоящий токен, только n8n
```

---

## 🎓 Ключевые концепции

### 1. **Idempotency** (Идемпотентность)
Можно запускать workflow сколько угодно раз - результат один:
- Первый раз → CREATE
- Все остальные → UPDATE (той же записи)
- Никогда не будет дубликатов!

### 2. **Upsert Pattern**
```
IF exists THEN
  UPDATE
ELSE
  INSERT
END
```
Универсальный паттерн для синхронизации данных.

### 3. **Graceful Degradation**
При ошибке система НЕ падает, а:
- Логирует проблему
- Пропускает итерацию
- Попробует снова через час

### 4. **Single Source of Truth**
Facebook Ads = единственный источник правды
Supabase = зеркало этой правды (обновляется каждый час)

---

## 📊 Timeline типичного дня

```
00:00 ─┬─ Sync (данных пока мало)
01:00 ─┼─ Update
02:00 ─┼─ Update
...    │
09:00 ─┼─ Update (начало рабочего дня)
10:00 ─┼─ Update (активность растет)
11:00 ─┼─ Update
...    │
18:00 ─┼─ Update (пик активности)
19:00 ─┼─ Update
...    │
23:00 ─┴─ Update (финальные данные дня)

Следующий день:
00:00 ─── CREATE (новая запись!)
01:00 ─── Update
...
```

Итого: **1 CREATE + 23 UPDATES** за день = 1 запись на день

---

## 🎉 Готово!

Теперь вы понимаете:
- ✅ Как данные текут от Facebook до Dashboard
- ✅ Почему старая версия не работала
- ✅ Как новая версия это исправляет
- ✅ Какие данные на каждом этапе
- ✅ Как работает безопасность
- ✅ Паттерны и best practices

**Используйте QUICK-START.md чтобы начать настройку! 🚀**
