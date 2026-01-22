# ✅ ФИНАЛЬНЫЕ ШАГИ (буквально 2 минуты)

## 🎯 Шаг 1: Выполни SQL в Supabase

1. **Открой Supabase Dashboard:**
   https://supabase.com/dashboard/project/[твой-project-id]/sql/new

2. **Скопируй ВСЁ** из файла `EXECUTE_THIS_SQL.sql`

3. **Вставь в SQL Editor** и нажми **RUN** (или Cmd/Ctrl + Enter)

4. **Проверь результат** - внизу должно появиться:
   ```
   ✅ platform: facebook
   ✅ status: active
   ✅ token_info: Token length: 267 chars
   ```

---

## 🎯 Шаг 2: Обнови страницу интеграций

1. Открой: https://markvision-alpha.vercel.app/integrations

2. Обнови страницу (F5 или Cmd+R)

3. Статус должен измениться на:
   ```
   ✅ Facebook & Instagram
   ✅ Активно
   ```

---

## 🎯 Шаг 3: Проверь работу

В консоли должно быть:
```javascript
✅ Realtime: Connected to External Supabase
✅ Loading projects for user: zapoinov@bk.ru
✅ Admin permissions granted
```

И **НЕ должно быть**:
- ❌ "Could not find the 'external_id' column"
- ❌ "new row violates row-level security policy"
- ❌ "Identity is already linked"

---

## 📊 Что было сделано

### ✅ Исправлена таблица `ad_accounts`
- Добавлена колонка `external_id`
- Настроены правильные RLS политики
- Добавлен UNIQUE constraint

### ✅ Сохранён Facebook токен
- Токен получен через Graph API Explorer
- Сохранён в базу для проекта `64c94e87-630c-470e-8ab1-8f7c8c835efa`
- Длина токена: 267 символов ✅

### ✅ Обновлён код
- Логика поиска токена улучшена
- Обработка "Identity is already linked"
- Детальное логирование для отладки

---

## 🚀 Следующие шаги (после успешного подключения)

1. **Синхронизация данных Facebook Ads**
   - Создать функцию `sync-facebook-ads`
   - Получать статистику кампаний
   - Сохранять в `ad_performance`

2. **Instagram Insights**
   - Получать данные о постах
   - Сохранять в `instagram_content_stats`

3. **Автоматическое обновление токена**
   - Отслеживать срок действия
   - Напоминать о продлении за 7 дней

---

## ❓ Если что-то не работает

Напиши мне, что видишь в консоли. Я помогу! 🚀
