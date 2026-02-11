# Чек-лист развертывания исправлений дублирования данных

## Статус: ГОТОВО К РАЗВЕРТЫВАНИЮ ✅

---

## Часть 1: Supabase миграции ✅

### Созданные файлы

- ✅ `supabase/migrations/20260212000000_fix_ad_insights_duplicates.sql`
  - Удаляет дубли в ad_insights
  - Добавляет UNIQUE (project_id, entity_id, date_start, date_stop)
  - Добавляет индекс для производительности

- ✅ `supabase/migrations/20260212000002_add_content_factory_unique.sql`
  - Удаляет дубли в content_factory
  - Добавляет UNIQUE (video_url)
  - Добавляет индекс для быстрого поиска

- ✅ `supabase/migrations/20260212000004_fix_instagram_posts_stats_unique.sql`
  - Удаляет дубли в instagram_posts_stats
  - Добавляет UNIQUE (project_id, post_id)
  - Добавляет индексы для производительности

- ✅ `supabase/migrations/20260212000005_create_duplicates_monitor.sql`
  - Создает view `duplicates_monitor` для мониторинга
  - Создает функцию `check_duplicates()` для быстрой проверки

### Как развернуть на Supabase

```bash
# Способ 1: Через Supabase CLI
cd "/Users/urijzapojnov/MarkVision AI код/markvision"
supabase migration up

# Способ 2: Через Supabase Dashboard
# 1. Перейди на https://app.supabase.com
# 2. Открой проект MarkVision
# 3. SQL Editor
# 4. Скопируй содержимое каждого файла миграции
# 5. Запусти SQL

# Способ 3: Автоматический деплой на Vercel
git push origin main  # Vercel автоматически применит миграции при деплое
```

### Верификация миграций

После применения миграций, запусти проверку:

```sql
-- Проверка что все constraint добавлены
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_name LIKE '%project%' OR constraint_name LIKE '%video_url%'
ORDER BY table_name;

-- Должно быть 3+ constraints

-- Проверка что view создан
SELECT * FROM duplicates_monitor;

-- Должно быть 0 строк (нет дублей)
```

---

## Часть 2: n8n workflow исправления 📋

### Нужно вручную в n8n UI

**Документ:** `N8N_WORKFLOW_FIXES.md` (в корне проекта)

**Краткий список:**

#### 🔴 КРИТИЧНО (сегодня)

1. **FACEBOOK_ADS_SYNC_HEARTBEAT**
   - Node: "💾 Сохранить Facebook данные"
   - Добавить поле `project_id` в Columns to Send
   - Изменить upsertKey с `date` на `project_id,date`
   - **Время:** ~2 минуты

#### 🟠 ВЫСОКИЙ ПРИОРИТЕТ (эта неделя)

2. **COMPETITOR-MONITORING-V2**
   - Удалить дублирующие nodes 08:00 (3 node)
   - Удалить некорректный save node "12"
   - Исправить opчатку tableId в "2. Список конкурентов"
   - Изменить node "10. Сохранить" с insert на upsert
   - **Время:** ~10 минут

### Проверка после каждого исправления

```sql
-- После FACEBOOK_ADS_SYNC_HEARTBEAT:
SELECT COUNT(*) FROM daily_data WHERE date = CURRENT_DATE;
-- Запустить workflow 2 раза - COUNT должен быть 1, не 2

-- После COMPETITOR-MONITORING-V2:
SELECT COUNT(*) FROM content_factory WHERE created_at > NOW() - INTERVAL '1 hour';
-- Запустить workflow 2 раза - новых записей должно быть меньше
```

---

## Часть 3: Проверка целостности данных ✅

### Перед развертыванием

```bash
# Создать backup (рекомендуется)
cd "/Users/urijzapojnov/MarkVision AI код/markvision/n8n-workflows"

# Backup workflows
cp FACEBOOK_ADS_SYNC_HEARTBEAT.json FACEBOOK_ADS_SYNC_HEARTBEAT.json.backup.2026-02-12
cp COMPETITOR-MONITORING-V2.json COMPETITOR-MONITORING-V2.json.backup.2026-02-12
```

### После развертывания

Запустить финальную проверку:

```sql
-- 1. ad_insights
SELECT 'ad_insights' as table_name, COUNT(*) as duplicate_groups
FROM (
    SELECT entity_id, date_start, date_stop, COUNT(*) as cnt
    FROM public.ad_insights
    GROUP BY entity_id, date_start, date_stop
    HAVING COUNT(*) > 1
) t;

-- 2. daily_data
SELECT 'daily_data' as table_name, COUNT(*) as duplicate_groups
FROM (
    SELECT project_id, date, COUNT(*) as cnt
    FROM public.daily_data
    GROUP BY project_id, date
    HAVING COUNT(*) > 1
) t;

-- 3. content_factory
SELECT 'content_factory' as table_name, COUNT(*) as duplicate_groups
FROM (
    SELECT video_url, COUNT(*) as cnt
    FROM public.content_factory
    WHERE video_url IS NOT NULL
    GROUP BY video_url
    HAVING COUNT(*) > 1
) t;

-- 4. instagram_posts_stats
SELECT 'instagram_posts_stats' as table_name, COUNT(*) as duplicate_groups
FROM (
    SELECT project_id, post_id, COUNT(*) as cnt
    FROM public.instagram_posts_stats
    WHERE post_id IS NOT NULL
    GROUP BY project_id, post_id
    HAVING COUNT(*) > 1
) t;

-- 5. ФИНАЛЬНАЯ ПРОВЕРКА
SELECT * FROM duplicates_monitor;
-- Ожидается: 0 строк во всех проверках
```

---

## Часть 4: Мониторинг после развертывания 📊

### Первая неделя

**Ежедневно:**
```sql
SELECT * FROM duplicates_monitor;
```

**Каждый запуск workflow:**
- Проверить что COUNT в daily_data не увеличивается на дубли
- Проверить что COUNT в content_factory не увеличивается на дубли

### Еженедельно (каждый понедельник)

```sql
-- Статистика
SELECT
    'ad_insights' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT project_id) as projects,
    COUNT(DISTINCT entity_id) as entities
FROM public.ad_insights

UNION ALL

SELECT
    'daily_data' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT project_id) as projects,
    MAX(date) - MIN(date) as date_range
FROM public.daily_data

UNION ALL

SELECT
    'content_factory' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT competitor_id) as competitors,
    COUNT(DISTINCT LEFT(video_url, 50)) as unique_urls
FROM public.content_factory;
```

### На случай проблем

Если обнаруживаются новые дубли:

```bash
# 1. Включить алерт в n8n (добавить в workflow error handler)
# 2. Запустить функцию проверки
SELECT check_duplicates();

# 3. Применить rollback (см. N8N_WORKFLOW_FIXES.md)
# 4. Заново проверить конфигурацию workflows
# 5. Повторить развертывание
```

---

## Финальный чек-лист

### Перед запуском в production

- [ ] Прочитано описание всех проблем в плане
- [ ] Все 4 миграции Supabase созданы
- [ ] Документация `N8N_WORKFLOW_FIXES.md` прочитана
- [ ] Резервная копия workflows создана
- [ ] Резервная копия базы данных создана

### После применения миграций

- [ ] Запущена проверка что миграции применены
- [ ] Запущена SQL проверка дублей (должна быть пустая)

### После исправления n8n workflows

- [ ] FACEBOOK_ADS_SYNC_HEARTBEAT исправлен
- [ ] COMPETITOR-MONITORING-V2 исправлен
- [ ] Оба workflow протестированы
- [ ] SQL проверка снова пустая

### Мониторинг первую неделю

- [ ] Ежедневная проверка duplicates_monitor
- [ ] Проверка что workflows работают как ожидается
- [ ] Проверка что новых дублей не создается

---

## Время выполнения

| Компонент | Время |
|-----------|-------|
| Supabase миграции | ~2 мин (применение) |
| FACEBOOK_ADS_SYNC | ~2 мин (редактирование) |
| COMPETITOR-MONITORING | ~10 мин (редактирование) |
| SQL проверка | ~1 мин |
| **ИТОГО** | **~15 минут** |

---

## Контакты поддержки

Если возникнут вопросы:
1. Проверь документацию в `N8N_WORKFLOW_FIXES.md`
2. Запусти SQL проверку из "Финальная проверка целостности данных"
3. Используй Rollback инструкции если нужно откатить

---

## История развертывания

| Дата | Статус | Примечание |
|------|--------|-----------|
| 2026-02-12 | ✅ Готово | Все миграции и документация подготовлены |
| TBD | Применено | При применении миграций |
| TBD | Проверено | После запуска SQL проверок |
