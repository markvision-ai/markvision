# ✅ OAUTH ВОССТАНОВЛЕН

## Что теперь работает:

### 1️⃣ Если токена НЕТ в базе:
```
Кнопка: [🌐 Привязать аккаунт]
↓
Нажимаешь → OAuth flow → Facebook → Возврат на сайт
↓
Токен НЕ сохраняется автоматически (Supabase не даёт Graph API token)
↓
Нужно добавить токен вручную через SQL (как раньше)
```

### 2️⃣ Если токен ЕСТЬ в базе и активен:
```
Статус: ✅ Активно
Кнопки: [🔄 Обновить] [⏸ Деактивировать]
↓
Профили отображаются: 👤 Facebook + 📸 Instagram
```

### 3️⃣ Если токен ЕСТЬ, но деактивирован:
```
Статус: ⚪ Не подключено
Кнопка: [✅ Активировать]
↓
Нажимаешь → Токен активируется → Профили загружаются
```

## Логика кнопки "Привязать аккаунт":

```typescript
if (токен есть && status='inactive') {
  // Просто активируем
  UPDATE status = 'active'
  Показываем профили
} else {
  // Запускаем OAuth
  supabase.auth.linkIdentity('facebook')
  Редирект на Facebook
}
```

## Что НЕ РАБОТАЕТ (это ограничение Supabase):

❌ После OAuth возврата токен **НЕ сохраняется автоматически**
- Supabase `linkIdentity` не возвращает Graph API access_token
- Токен нужно добавить вручную через SQL

## Как сейчас использовать:

### Вариант А: Токен уже в базе ✅
1. Открой https://markvision-alpha.vercel.app/integrations
2. Если статус "Неактивно" → нажми **"✅ Активировать"**
3. Профили загрузятся мгновенно

### Вариант Б: Токена нет в базе ❌
1. Нажми "Привязать аккаунт" → OAuth flow
2. После возврата → получи токен в Graph API Explorer
3. Выполни SQL:
```sql
INSERT INTO public.ad_accounts (project_id, platform, external_id, access_token, status)
VALUES (
  '64c94e87-630c-470e-8ab1-8f7c8c835efa',
  'facebook',
  'facebook_manual_token',
  'ТВОЙ_ТОКЕН_ИЗ_GRAPH_API',
  'active'
)
ON CONFLICT (project_id, platform, external_id)
DO UPDATE SET access_token = EXCLUDED.access_token, status = 'active';
```

## ИТОГО:

✅ OAuth работает (для привязки аккаунта)
✅ Активация/деактивация работает (для переключения статуса)
✅ Токен сохраняется навсегда (не удаляется)
✅ Профили загружаются (через Edge Function)

⚠️ НО: Токен нужно добавить в базу вручную (это единожды)

## Push на Vercel:

```bash
git push
```

Или Manual Deploy в Vercel Dashboard.

🚀 Всё исправлено!
