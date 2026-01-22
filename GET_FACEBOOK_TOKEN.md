# 🔑 Как получить Facebook Access Token

## Проблема
Supabase `linkIdentity` **НЕ сохраняет** `access_token` в `identity_data`. Это известная проблема.

## Решение: Получить токен вручную через Graph API Explorer

### Шаг 1: Открой Graph API Explorer
https://developers.facebook.com/tools/explorer/

### Шаг 2: Выбери приложение
В правом верхнем углу выбери:
- **Meta App:** "Marketing Analytics Dashboard" (или как называется твоё приложение)

### Шаг 3: Получи User Access Token
1. Нажми **"Get Token"** → **"Get User Access Token"**
2. В списке разрешений выбери:
   - ✅ `ads_read`
   - ✅ `instagram_basic`
   - ✅ `instagram_manage_insights`
   - ✅ `pages_show_list`
   - ✅ `pages_read_engagement`
3. Нажми **"Generate Access Token"**
4. Авторизуйся через Facebook
5. **Скопируй токен** (длинная строка ~200-300 символов)

### Шаг 4: (Опционально) Продли токен на 60 дней
1. В Graph API Explorer вставь этот запрос:
```
/oauth/access_token?grant_type=fb_exchange_token&client_id=ВАШ_APP_ID&client_secret=ВАШ_APP_SECRET&fb_exchange_token=ВАШ_КОРОТКИЙ_ТОКЕН
```

2. Или используй этот URL в браузере:
```
https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=1890905081453686&client_secret=ВАШ_SECRET&fb_exchange_token=ВАШ_ТОКЕН
```

### Шаг 5: Сохрани токен в Supabase
1. Выполни SQL из файла `REBUILD_AD_ACCOUNTS_FIXED.sql`
2. **Замени** строку `ВСТАВЬ_СЮДА_АКТУАЛЬНЫЙ_ТОКЕН` на токен из Graph API Explorer
3. Запусти SQL

### Шаг 6: Проверь
```sql
SELECT 
  platform,
  status,
  LENGTH(access_token) as token_length,
  created_at
FROM public.ad_accounts
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';
```

Должно быть:
- `platform`: facebook
- `status`: active
- `token_length`: ~200-300
- `created_at`: текущая дата

## Альтернатива: Используй готовый токен из консоли

В консоли я вижу, что у тебя был токен:
```
'eyJhbGciOiJFUzI1NiIsImtpZCI6IjYxZmIyMWE1ZGZlZWJhNzZC...'
```

Это **JWT токен от Supabase**, а не Facebook токен.

**Тебе нужен именно Facebook Graph API токен.**

## Быстрая проверка токена
После получения токена, проверь его здесь:
https://developers.facebook.com/tools/debug/accesstoken/

Должно показать:
- ✅ Тип: User
- ✅ App: Marketing Analytics Dashboard
- ✅ Expires: через 60 дней
- ✅ Scopes: ads_read, instagram_basic, ...
