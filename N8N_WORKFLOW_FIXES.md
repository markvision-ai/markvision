# Инструкции по исправлению n8n workflows

## ФАЗА 1.2: Исправление FACEBOOK_ADS_SYNC_HEARTBEAT workflow

### Описание проблемы
Node "💾 Сохранить Facebook данные" использует upsert только по полю `date`, без учета `project_id`. Это приводит к тому, что все проекты перезаписывают одну и ту же строку в таблице `daily_data`.

### Решение

#### Шаг 1: Открыть workflow в n8n

1. Перейди на https://n8n.zapoinov.com
2. Открой workflow **"Facebook Ads Sync with Heartbeat"**

#### Шаг 2: Отредактировать node "💾 Сохранить Facebook данные"

1. Нажми на node "💾 Сохранить Facebook данные" (id: `supabase-save-facebook`)
2. В секции "Columns to Send" добавь новое поле **первым**:
   ```
   Column name: project_id
   Value: {{ $env.PROJECT_ID || '64c94e87-630c-470e-8ab1-8f7c8c835efa' }}
   ```

3. Откройся в режиме "Advanced" → "Options" → "Upsert" и измени:
   ```
   Был:  "upsertKey": "date"
   Стал: "upsertKey": "project_id,date"
   ```

4. В "Upsert Conflict Columns" измени:
   ```
   Был:  ["date"]
   Стал: ["project_id", "date"]
   ```

#### Шаг 3: Сохранить workflow

1. Нажми кнопку **Save** (или Ctrl+S)
2. Дождись сообщения "Workflow saved"

#### Шаг 4: Тестирование

1. Нажми **Test Workflow** (▶)
2. Проверь что workflow выполнился без ошибок
3. Запусти еще раз - должен обновить ту же запись (не создавать новую)

**SQL проверка:**
```sql
SELECT project_id, date, COUNT(*)
FROM daily_data
WHERE date = CURRENT_DATE
GROUP BY project_id, date
HAVING COUNT(*) > 1;
-- Ожидается: пустой набор (COUNT = 1)
```

---

## ФАЗА 2.1: Удаление дублирующего потока из COMPETITOR-MONITORING-V2

### Описание проблемы
Workflow "Мониторинг конкурентов" имеет два независимых потока:
- **Поток 1:** Trigger 08:00 → (Apify resultsLimit: 3)
- **Поток 2:** Trigger 10:00 → (Apify resultsLimit: 10) ← ОСТАВИТЬ ЭТОТ

Первый поток дублирует логику и приводит к множественным запускам.

### Решение

#### Шаг 1: Открыть workflow

1. Открой workflow **"Мониторинг конкурентов"** (ID: `qZ3WyT7_vF18f7MXF9Mqe`)

#### Шаг 2: Удалить дублирующие nodes

Удали следующие nodes (щелкни правой кнопкой → Delete):

**Поток 1 (08:00):**
1. `1. Старт (08:00)` - Node ID: `09a4185d-c55c-43e9-9546-217b9ed4fc48`
2. `2. Список конкурентов1` - Node ID: `da837e5c-7ddc-421e-becf-20cc4f506d23`
3. `3. Сбор постов (Apify)1` - Node ID: `8283eeba-1f63-4bb3-a5a9-b8b3ff036487`

**Некорректный save node:**
4. `12. Сохранить в Supabase` - Node ID: `81028509-1180-464e-b13c-37dc6be0c7bc`
   (Не имеет поля `competitor_id`, конфликтует с node 10)

#### Шаг 3: Проверить connections

После удаления nodes, проверь что:
- Остальные nodes правильно подключены
- Нет "оторванных" connections

#### Шаг 4: Сохранить

1. Нажми **Save**
2. Дождись сообщения "Workflow saved"

---

## ФАЗА 2.2: Исправление save node для content_factory

### Описание проблемы
Node "10. Сохранить в MarkVision" использует операцию `insert`, что создает дубли при каждом запуске workflow. Нужно изменить на `upsert` с конфликтом по `video_url`.

### Решение

#### Шаг 1: Отредактировать node "10. Сохранить в MarkVision"

1. Нажми на node "10. Сохранить в MarkVision" (id: `37d01e70-c440-4a03-86e4-0d6010d6f770`)

#### Шаг 2: Изменить операцию

1. В выпадающем меню "Operation" изменить:
   ```
   Было: insert
   Стало: upsert
   ```

#### Шаг 3: Добавить On Conflict

1. Когда выберешь "upsert", появится поле "On Conflict"
2. Введи: `video_url`

#### Шаг 4: Сохранить и тестировать

1. Нажми **Save**
2. **Test Workflow** и проверь что нет ошибок

**SQL проверка:**
```sql
-- Запустить workflow 2 раза подряд
-- Затем проверить:
SELECT video_url, COUNT(*)
FROM content_factory
WHERE video_url IS NOT NULL
GROUP BY video_url
HAVING COUNT(*) > 1;
-- Ожидается: пустой набор
```

---

## ФАЗА 2.3: Исправление опечатки в "2. Список конкурентов"

### Описание проблемы
Node "2. Список конкурентов" имеет `tableId: "=competitors"` (с лишним знаком =), что может вызвать ошибки.

### Решение

#### Шаг 1: Отредактировать node

1. Нажми на node "2. Список конкурентов" (id: `e7142320-373d-4b3c-9727-ae1dc143f669`)

#### Шаг 2: Исправить Table

1. Найди поле **"Table"**
2. Сотри текущее значение (которое начинается с "=")
3. Выбери или введи: `competitors`

#### Шаг 3: Сохранить

1. Нажми **Save**

---

## Финальная проверка всех workflows

### Проверочный скрипт SQL

После внесения всех исправлений, запусти эту проверку:

```sql
-- 1. Проверка ad_insights (дубли исправлены)
SELECT project_id, entity_id, date_start, date_stop, COUNT(*) as cnt
FROM public.ad_insights
GROUP BY project_id, entity_id, date_start, date_stop
HAVING COUNT(*) > 1;
-- Ожидается: 0 строк

-- 2. Проверка daily_data (дубли исправлены)
SELECT project_id, date, COUNT(*) as cnt
FROM public.daily_data
GROUP BY project_id, date
HAVING COUNT(*) > 1;
-- Ожидается: 0 строк

-- 3. Проверка content_factory (дубли исправлены)
SELECT video_url, COUNT(*) as cnt
FROM public.content_factory
WHERE video_url IS NOT NULL
GROUP BY video_url
HAVING COUNT(*) > 1;
-- Ожидается: 0 строк

-- 4. Проверка instagram_posts_stats (дубли исправлены)
SELECT project_id, post_id, COUNT(*) as cnt
FROM public.instagram_posts_stats
WHERE post_id IS NOT NULL
GROUP BY project_id, post_id
HAVING COUNT(*) > 1;
-- Ожидается: 0 строк

-- 5. Общий мониторинг (если дубли еще есть, покажет)
SELECT * FROM duplicates_monitor;
-- Ожидается: 0 строк
```

### Нагрузочное тестирование workflows

#### Тест 1: Facebook Ads Sync

```
1. Открыть workflow "Facebook Ads Sync with Heartbeat"
2. Нажать Test Workflow (▶) 3 раза подряд
3. Проверить SQL:
   SELECT COUNT(DISTINCT date) FROM daily_data WHERE date = CURRENT_DATE;
   Ожидается: 1 (одна дата, не 3)
```

#### Тест 2: Мониторинг конкурентов

```
1. Открыть workflow "Мониторинг конкурентов"
2. Нажать Test Workflow (▶) 2 раза подряд
3. Проверить SQL:
   SELECT COUNT(*) FROM content_factory WHERE created_at > NOW() - INTERVAL '5 minutes';
   Запомнить число (например, 10)
4. Запустить еще раз
5. Проверить SQL снова - число не должно увеличиться на 10
   (Если есть новые посты, число может изменится на меньшее количество)
```

#### Тест 3: 24-часовой мониторинг

1. Оставить workflows работать 24 часа
2. Каждые 2 часа проверять:
   ```sql
   SELECT * FROM duplicates_monitor;
   ```
3. Должен всегда быть пустым

---

## Rollback инструкции

Если что-то пошло не так, откатиться можно так:

### На n8n

1. Нажми на workflow
2. Нажми иконку истории (⌚) в правом верхнем углу
3. Выбери предыдущую версию
4. Нажми "Restore to this version"

### На Supabase

```sql
-- Откатить ad_insights
ALTER TABLE public.ad_insights
DROP CONSTRAINT IF EXISTS ad_insights_project_entity_period_key;

ALTER TABLE public.ad_insights
ADD CONSTRAINT ad_insights_entity_period_key
UNIQUE (entity_id, date_start, date_stop);

-- Откатить content_factory
ALTER TABLE public.content_factory
DROP CONSTRAINT IF EXISTS content_factory_video_url_key;

-- Откатить instagram_posts_stats
ALTER TABLE public.instagram_posts_stats
DROP CONSTRAINT IF EXISTS instagram_posts_stats_project_post_key;

-- Откатить view
DROP VIEW IF EXISTS public.duplicates_monitor;
DROP FUNCTION IF EXISTS public.check_duplicates();
```

---

## Сроки и приоритеты

🔴 **КРИТИЧНО (сегодня):**
- ФАЗА 1.2: FACEBOOK_ADS_SYNC_HEARTBEAT

🟠 **ВЫСОКИЙ ПРИОРИТЕТ (эта неделя):**
- ФАЗА 2.1: Удалить дублирующие nodes
- ФАЗА 2.2: Исправить node save для content_factory
- ФАЗА 2.3: Исправить опечатку tableId

---

## Вопросы или проблемы?

Если возникнут вопросы:
1. Проверь в n8n на вкладке "Logs" детали ошибки
2. Проверь SQL проверку из "Финальная проверка"
3. Используй Rollback инструкции если что-то сломалось
