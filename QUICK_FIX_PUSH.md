# 🚀 Быстрое исправление и деплой

## Проблема
В консоли видно:
- ✅ `Provider Token: FOUND`
- ❌ `Final Facebook token: NOT FOUND`

Это значит, что токен **есть**, но код его не извлекает.

## Что было исправлено

### 1. Улучшена логика поиска токена
Теперь ищем токен в **3 местах**:
1. `session.provider_token` (новые OAuth логины)
2. `session.user.identities[].identity_data.access_token` (linkIdentity)
3. `session.user.app_metadata.provider_token` (фолбэк)

### 2. Добавлено детальное логирование
Теперь в консоли будет:
```javascript
📱 Facebook Identity FULL DATA: { ... весь объект ... }
```

Это покажет **точно**, где лежит токен.

## Что делать СЕЙЧАС

### Шаг 1: Push код
```bash
git push
```

Если не работает, попробуй через UI (Cursor/VS Code).

### Шаг 2: Подожди деплой (1-2 мин)

### Шаг 3: КРИТИЧНО - Выполни SQL в Supabase
Таблица `ad_accounts` всё ещё старая! Выполни в SQL Editor:

```sql
-- Скопируй весь код из файла REBUILD_AD_ACCOUNTS.sql
```

### Шаг 4: Тестируй
1. Открой https://markvision-alpha.vercel.app/integrations
2. Открой DevTools Console
3. Нажми "Привязать Facebook & Instagram"
4. Посмотри в консоли на строку:
   ```
   📱 Facebook Identity FULL DATA: { ... }
   ```
5. Скопируй этот JSON и отправь мне

## Ожидаемый результат

После выполнения SQL и деплоя нового кода должно быть:
- ✅ `Final Facebook token: FOUND ✅ (length: 200+)`
- ✅ `Token saved successfully`
- ✅ Статус "Активно"

## Если всё ещё не работает

Отправь мне полный JSON из:
```
📱 Facebook Identity FULL DATA: { ... }
```

Я увижу точную структуру и скажу, откуда брать токен.
