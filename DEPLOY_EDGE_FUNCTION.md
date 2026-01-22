# 🚀 Деплой Edge Function для Facebook профилей

## Проблема решена! ✅

SQL выполнен успешно:
- ✅ platform: facebook
- ✅ status: active  
- ✅ token_info: Token length: 282 chars

НО в браузере ошибки CORS при попытке загрузить профили напрямую из Graph API.

## Решение: Edge Function

Создана серверная функция `fetch-facebook-profiles`, которая:
- ✅ Обходит CORS ограничения
- ✅ Безопасно работает с токеном
- ✅ Получает Facebook профиль и Instagram аккаунты
- ✅ Возвращает данные клиенту

## Деплой Edge Function

### Вариант 1: Через Supabase CLI (рекомендуется)

```bash
# 1. Установи Supabase CLI (если ещё не установлен)
brew install supabase/tap/supabase

# 2. Залогинься
supabase login

# 3. Привяжи к проекту (только первый раз)
supabase link --project-ref [твой-project-ref]

# 4. Deploy функцию
supabase functions deploy fetch-facebook-profiles
```

### Вариант 2: Через Supabase Dashboard

1. Открой: https://supabase.com/dashboard/project/[твой-project]/functions

2. Нажми **"New Edge Function"**

3. Имя функции: `fetch-facebook-profiles`

4. Скопируй код из:
   ```
   supabase/functions/fetch-facebook-profiles/index.ts
   ```

5. Нажми **"Deploy"**

## После деплоя

### 1. Push код
```bash
git push
```

### 2. Подожди деплой Vercel (~1-2 мин)

### 3. Проверь результат

Открой: https://markvision-alpha.vercel.app/integrations

**Нажми кнопку "🔄 Обновить"**

Должно показать:
- ✅ 👤 Юрий Валерьевич (Facebook Personal)
- ✅ 📸 @[твой_username] (Instagram Business)

### 4. Проверь в консоли

Должно быть:
```javascript
✅ Edge Function response: {
  facebookProfile: { name: "Юрий Валерьевич", ... },
  instagramAccounts: [{ username: "...", ... }]
}
✅ Профили загружены!
```

## Если Edge Function не задеплоена

Пока функция не задеплоена, увидишь ошибку:
```
❌ Failed to fetch Facebook profile
```

**Решение:** Задеплой функцию через CLI или Dashboard (см. выше).

## Преимущества серверного подхода

### ✅ Безопасность
- Токен не передаётся напрямую в браузере
- Нет CORS проблем
- Логи на сервере

### ✅ Надёжность
- Централизованная обработка ошибок
- Retry logic (можно добавить)
- Rate limiting (можно добавить)

### ✅ Производительность
- Кэширование на Edge (можно добавить)
- Batch запросы для нескольких Instagram аккаунтов
- Меньше запросов из браузера

## Структура ответа

```typescript
{
  facebookProfile: {
    id: "122258262056023749",
    name: "Юрий Валерьевич",
    picture: {
      data: {
        url: "https://..."
      }
    }
  },
  instagramAccounts: [
    {
      id: "...",
      username: "aiva.clinic",
      profile_picture_url: "https://..."
    }
  ]
}
```

## Следующие улучшения

После успешного деплоя можно добавить:
1. **Кэширование** - сохранять профили в базе на 24 часа
2. **Webhook** - обновлять профили автоматически
3. **Статистика** - добавить followers_count, media_count
4. **Insights** - получать engagement, impressions

## Troubleshooting

### Ошибка: "Function not found"
**Решение:** Задеплой функцию через CLI или Dashboard.

### Ошибка: "Invalid access token"
**Решение:** Получи новый токен в Graph API Explorer и обнови в SQL.

### Ошибка: "OAuthException"
**Решение:** Проверь права доступа в Graph API Explorer (должны быть ads_read, instagram_basic, pages_show_list).

## Готово! 🎉

После деплоя функции всё заработает автоматически!
