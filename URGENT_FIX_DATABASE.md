# 🚨 СРОЧНО: Исправление таблицы ad_accounts

## ❌ Ошибка
```
Could not find the 'external_id' column of 'ad_accounts' in the schema cache
```

**Причина:** Таблица `ad_accounts` не создана или не содержит колонку `external_id`

---

## ✅ РЕШЕНИЕ: Выполнить SQL в Supabase

### Шаг 1: Откройте SQL Editor
1. Перейдите на: https://supabase.com/dashboard/project/pyscczcuersdjvpmkiec/sql/new
2. Откроется SQL Editor

### Шаг 2: Скопируйте и выполните SQL

Скопируйте этот SQL код целиком:

```sql
-- Проверяем и создаем/обновляем таблицу ad_accounts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ad_accounts'
  ) THEN
    -- Создаем таблицу
    CREATE TABLE public.ad_accounts (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
      platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'google')),
      external_id TEXT NOT NULL,
      name TEXT NOT NULL,
      access_token TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE (project_id, platform, external_id)
    );

    ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
    CREATE INDEX idx_ad_accounts_project_id ON public.ad_accounts(project_id);
    CREATE INDEX idx_ad_accounts_platform ON public.ad_accounts(platform);
  ELSE
    -- Добавляем external_id если его нет
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ad_accounts' 
      AND column_name = 'external_id'
    ) THEN
      ALTER TABLE public.ad_accounts 
      ADD COLUMN external_id TEXT NOT NULL DEFAULT 'default';
    END IF;
  END IF;
END $$;

-- Policies
DROP POLICY IF EXISTS "Users can view ad accounts for accessible projects" ON public.ad_accounts;
CREATE POLICY "Users can view ad accounts for accessible projects"
ON public.ad_accounts FOR SELECT
USING (
  project_id IN (SELECT project_id FROM public.project_access WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Users can manage ad accounts for accessible projects" ON public.ad_accounts;
CREATE POLICY "Users can manage ad accounts for accessible projects"
ON public.ad_accounts FOR ALL
USING (
  project_id IN (SELECT project_id FROM public.project_access WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
)
WITH CHECK (
  project_id IN (SELECT project_id FROM public.project_access WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Trigger
DROP TRIGGER IF EXISTS update_ad_accounts_updated_at ON public.ad_accounts;
CREATE TRIGGER update_ad_accounts_updated_at
  BEFORE UPDATE ON public.ad_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Проверка
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ad_accounts'
ORDER BY ordinal_position;
```

### Шаг 3: Нажмите "Run"
Внизу должно появиться сообщение: **"Success. No rows returned"**

### Шаг 4: Проверьте результат
Внизу в результатах вы должны увидеть список колонок:
- `id`
- `project_id`
- `platform`
- `external_id` ✅ **Эта колонка должна быть!**
- `name`
- `access_token`
- `status`
- `created_at`
- `updated_at`

---

## 🎯 После выполнения SQL

1. Вернитесь на: https://markvision-alpha.vercel.app/integrations
2. Нажмите `Ctrl+Shift+R` для очистки кеша
3. Откройте консоль (F12)
4. Нажмите **"Привязать Facebook & Instagram"** снова

**Теперь должно сработать!** ✅

---

## 📋 Быстрый чеклист

- [ ] Открыть SQL Editor в Supabase
- [ ] Скопировать весь SQL код
- [ ] Нажать "Run"
- [ ] Проверить, что `external_id` появилась в результатах
- [ ] Обновить страницу `/integrations`
- [ ] Попробовать подключить Facebook снова

---

## 🐛 Если ошибка остается

Попробуйте вручную добавить запись с вашим токеном:

```sql
INSERT INTO public.ad_accounts (
  project_id,
  platform,
  external_id,
  name,
  access_token,
  status
) VALUES (
  '64c94e87-630c-470e-8ab1-8f7c8c835efa',
  'facebook',
  'facebook_manual_token',
  'Facebook & Instagram',
  'EAAa3xKWvHHYBQqZC8dx2ak915FmdlfuGN2Ma37x5Nq5gbSamnSwY07EJ08wlhX2vvgsHx5VKbkCO0HgwKNhTIqVxtQyJJQuhPIZApPRFf1J5AVP9BT9SdTmJddxQZAJYWrtGVp2kO519iGemsa9kqSEgXt75o32jZAsKs86ldJ3OWp4qO5lTWx5kBw9dSFZAKzZCiqXVLOAIabuqms6Qn0xDSu4IJVGVguCrfMFw4CaoJ9TrVqMT5jmPJwKcBbaea7QWcEtb7TuEv7igTGZB7qb',
  'active'
);
```

---

**Выполните SQL сейчас!** 🚀
