# ✅ ОКОНЧАТЕЛЬНОЕ РЕШЕНИЕ ПРОБЛЕМЫ AD_ACCOUNTS

## Проблема
В production базе таблица `ad_accounts` была создана вручную с неправильной структурой (не хватает колонок, constraints).

## Решение в 3 шага

### Шаг 1: Проверка текущего состояния (опционально)
Выполни в **Supabase SQL Editor**:
```sql
-- Смотрим файл: CHECK_CURRENT_TABLE.sql
```
Это покажет, что реально есть в базе сейчас.

### Шаг 2: Пересоздание таблицы ✅
Выполни в **Supabase SQL Editor** полностью файл:
```sql
-- Смотрим файл: REBUILD_AD_ACCOUNTS.sql
```

Этот скрипт:
- ❌ Удалит старую кривую таблицу
- ✅ Создаст новую с правильной структурой
- ✅ Добавит RLS политики
- ✅ Вставит твой Facebook токен
- ✅ Покажет результат

### Шаг 3: Deploy обновлённого кода
```bash
git add .
git commit -m "fix: Facebook integration - remove ON CONFLICT, use UPDATE/INSERT strategy"
git push
```

## Что изменилось в коде

**До (было):**
```typescript
.upsert({ ... }, { onConflict: 'project_id,platform,external_id' })
```

**После (стало):**
```typescript
// Сначала ищем существующую запись
const { data: existing } = await supabase
  .from('ad_accounts')
  .select('id')
  .eq('project_id', targetProjectId)
  .eq('platform', 'facebook')
  .maybeSingle();

if (existing) {
  // Обновляем
  await supabase.from('ad_accounts').update({ ... }).eq('id', existing.id)
} else {
  // Создаём
  await supabase.from('ad_accounts').insert({ ... })
}
```

## Проверка

После выполнения всех шагов:

1. Открой https://markvision-alpha.vercel.app/integrations
2. Нажми "Привязать Facebook & Instagram"
3. В консоли должно появиться:
   - ✅ "Updating existing Facebook connection" или "Creating new Facebook connection"
   - ✅ "Token saved successfully"
4. Статус должен измениться на "Активно"

## Почему теперь будет работать

- ✅ Таблица создаётся с нуля с правильной структурой
- ✅ Код больше не использует `ON CONFLICT` (который требует constraint)
- ✅ Используем простую логику: "Есть запись? Обнови. Нет? Создай."
- ✅ Минимальная структура таблицы - только необходимые колонки

## Если что-то пойдёт не так

Выполни в SQL Editor:
```sql
SELECT * FROM public.ad_accounts;
```

Должна быть одна запись с:
- `project_id`: 64c94e87-630c-470e-8ab1-8f7c8c835efa
- `platform`: facebook
- `status`: active
- `access_token`: (длинная строка)
