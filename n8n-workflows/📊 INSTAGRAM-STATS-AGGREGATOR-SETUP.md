# 📊 Instagram Stats Aggregator - Инструкция

## 🎯 Что делает этот workflow:

1. **Получает все посты** из `instagram_posts_stats` за период **1-22 января 2026**
2. **Считает агрегированные метрики:**
   - Публикации (все кроме Stories)
   - Сторис
   - Охват
   - Вовлеченность
   - Диагностики
   - Продажи
   - Сумма продаж
3. **Сохраняет** в таблицу `content_production_stats`
4. **Автоматически отображается** в разделе "План/Факт контент-производства"

---

## 🚀 Установка:

### 1️⃣ Выполни SQL миграцию:

Открой **Supabase → SQL Editor** и выполни:

```sql
-- Файл: CREATE-CONTENT-PRODUCTION-STATS.sql
-- Или: supabase/migrations/20260123230000_create_content_production_stats.sql
```

Или выполни напрямую:

```sql
-- Удаляем если есть
DROP TABLE IF EXISTS public.content_production_stats CASCADE;

-- Создаем таблицу
CREATE TABLE public.content_production_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  publications INTEGER DEFAULT 0,
  stories INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement DECIMAL(10, 2) DEFAULT 0,
  followers INTEGER DEFAULT 0,
  diagnostics INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, period_start, period_end)
);

-- Индексы
CREATE INDEX idx_content_production_stats_project ON public.content_production_stats(project_id);
CREATE INDEX idx_content_production_stats_period ON public.content_production_stats(period_start, period_end DESC);

-- RLS
ALTER TABLE public.content_production_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.content_production_stats
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.content_production_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.content_production_stats
  FOR UPDATE USING (true);
```

### 2️⃣ Импортируй workflow в n8n:

1. Открой n8n
2. Нажми **"+ Create New"** → **"Import from File"**
3. Выбери файл: `n8n-workflows/INSTAGRAM-STATS-AGGREGATOR.json`
4. Нажми **"Import"**

### 3️⃣ Запусти workflow:

1. Открой импортированный workflow
2. Нажми **"Execute Workflow"** (запуск вручную)
3. Дождись завершения
4. Проверь логи: должно быть **"✅ УСПЕШНО СОХРАНЕНО"**

---

## 🧪 Проверка:

### В Supabase:

```sql
-- Проверь что данные сохранены
SELECT * FROM content_production_stats 
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  AND period_start = '2026-01-01'
  AND period_end = '2026-01-22';
```

Должны быть метрики:
- `publications` - количество публикаций
- `stories` - количество Stories
- `reach` - общий охват
- `engagement` - вовлеченность (%)
- `diagnostics` - диагностики
- `sales` - продажи
- `revenue` - выручка

### В MarkVision:

1. Обнови страницу (F5)
2. Открой **Маркетинг → Центр контента**
3. Проверь таблицу **"План/Факт контент-производства"**
4. В колонке **"Факт"** должны быть данные из `content_production_stats`

---

## 📊 Как это работает:

### Workflow:

```
📊 Get Posts (1-22 Jan) 
  → 🧮 Calculate Stats 
  → ❓ Check Skip 
  → 💾 Save to Supabase 
  → ✅ Success Log
```

### Логика расчета:

1. **Получает посты** из `instagram_posts_stats` за период 1-22 января
2. **Считает метрики:**
   - Публикации = все посты кроме Stories
   - Сторис = только Stories
   - Охват = сумма `reach`
   - Вовлеченность = `(лайки + комментарии + репосты) / показы * 100`
   - Диагностики = сумма `leads_count`
   - Продажи = сумма `paid_leads`
   - Выручка = сумма `revenue`
3. **Сохраняет** в `content_production_stats` с `UPSERT` (обновляет если уже есть)

### UI:

- Хук `useInstagramPlanFact` сначала проверяет `content_production_stats`
- Если есть данные - использует их
- Если нет - считает из постов

---

## 🔄 Ежедневное обновление (позже):

Когда будет готово, можно добавить:
- Триггер на 01:05 каждый день
- Считать метрики за вчерашний день
- Обновлять `content_production_stats` с новым периодом

---

## ⚠️ Troubleshooting:

### Ошибка: "table does not exist"

**Решение:**
- Выполни SQL миграцию из `CREATE-CONTENT-PRODUCTION-STATS.sql`

### Ошибка: "No posts found"

**Решение:**
- Убедись, что в `instagram_posts_stats` есть посты за период 1-22 января
- Запусти сначала `INSTAGRAM-CONTENT-INTELLIGENCE-FIXED.json` чтобы загрузить посты

### Данные не появляются в UI

**Решение:**
1. Проверь что данные есть в `content_production_stats`
2. Проверь `project_id` - должен быть `64c94e87-630c-470e-8ab1-8f7c8c835efa`
3. Обнови страницу (F5)

---

## 📝 Пример данных:

После выполнения workflow в `content_production_stats`:

| project_id | period_start | period_end | publications | stories | reach | engagement |
|------------|--------------|------------|--------------|---------|-------|------------|
| 64c94e... | 2026-01-01 | 2026-01-22 | 15 | 8 | 125000 | 7.14 |

---

**ГОТОВО! ТЕПЕРЬ У ТЕБЯ АВТОМАТИЧЕСКИЙ РАСЧЕТ ПЛАН/ФАКТ!** 📊✅
