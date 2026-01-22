# ✅ ФИНАЛЬНАЯ НАСТРОЙКА: Facebook OAuth готов к использованию

## 🎯 Что настроено

### 1. **Supabase Client** ✅
`src/integrations/supabase/client.ts`:
- URL: `https://pyscczcuersdjvpmkiec.supabase.co`
- `detectSessionInUrl: true` - автоматическое обнаружение OAuth токенов в URL
- `persistSession: true` - сохранение сессии
- `autoRefreshToken: true` - автоматическое обновление токена

### 2. **FacebookIntegration.tsx** ✅
Критические улучшения:

#### Redirect URL:
```typescript
const isProduction = window.location.hostname === 'markvision-alpha.vercel.app';
const redirectUrl = isProduction 
  ? 'https://markvision-alpha.vercel.app/integrations'
  : `${window.location.origin}/integrations`;
```

#### Проверка User без Email:
```typescript
// Используем user.id как уникальный идентификатор
const userId = session.user.id;
const userEmail = session.user.email || `facebook_user_${userId}`;
```

#### Сохранение в твой проект:
```typescript
const targetProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

await supabase
  .from('ad_accounts')
  .upsert({
    project_id: targetProjectId,
    platform: 'facebook',
    external_id: `facebook_oauth_${userId}`,
    name: 'Facebook & Instagram',
    access_token: session.provider_token,
    status: 'active'
  }, { 
    onConflict: 'project_id,platform,external_id'
  });
```

#### Обработка ошибок:
```typescript
// Обработка OAuth ошибок из URL
const error = urlParams.get('error');
const errorDescription = urlParams.get('error_description');

if (error) {
  toast.error(errorDescription || 'Ошибка авторизации');
  window.history.replaceState({}, '', window.location.pathname);
  // ОСТАЕМСЯ на /integrations
}
```

---

## 📋 Логи при успешном подключении

После нажатия кнопки "Привязать Facebook & Instagram" и возврата на сайт, вы увидите:

```
🔗 OAuth redirect URL: https://markvision-alpha.vercel.app/integrations
🔍 Checking OAuth params: {
  pathname: "/integrations",
  hasAccessToken: true,
  hasCode: false,
  hasError: false,
  hash: "#access_token=EAABwz...",
  search: ""
}
🔍 AuthProvider Session: { user: { id: "...", email: null }, provider_token: "EAABwz..." }
👤 User: { id: "abc-123-def-456", ... }
📧 Email: NO EMAIL (или facebook_user_abc-123-def-456)
🆔 User ID: abc-123-def-456
🎫 Provider Token: FOUND ✅
🔄 Refresh Token: FOUND ✅
📱 Facebook OAuth успешен, сохраняем токен...
💾 Saving to project: 64c94e87-630c-470e-8ab1-8f7c8c835efa
✍️ User identifier: abc-123-def-456
📧 Using email: facebook_user_abc-123-def-456
✅ Token saved successfully: [ID записи в ad_accounts]
```

**Toast уведомление:**
```
✅ Facebook & Instagram подключены! 🎉
Теперь можно синхронизировать данные о рекламе
```

---

## 🐛 Логи при ошибке

Если в URL есть параметр `error`:

```
❌ OAuth error in URL: server_error
📄 Error description: Error getting user email
```

**Toast уведомление:**
```
❌ Error getting user email
Попробуйте еще раз или обратитесь в поддержку
```

**ВАЖНО:** Вы остаетесь на странице `/integrations` и можете попробовать снова!

---

## 🔧 Что происходит при нажатии кнопки

### Шаг 1: Нажатие "Привязать Facebook & Instagram"
1. Определяется правильный `redirectUrl`
2. Лог: `🔗 OAuth redirect URL: https://markvision-alpha.vercel.app/integrations`
3. Вызывается `supabase.auth.signInWithOAuth` с Facebook provider
4. Открывается страница Facebook OAuth

### Шаг 2: Авторизация на Facebook
1. Пользователь входит в Facebook
2. Подтверждает разрешения (ads_read, instagram_basic, и т.д.)
3. Facebook редиректит на `https://markvision-alpha.vercel.app/integrations#access_token=...`

### Шаг 3: Возврат на сайт
1. **OAuthHandler** в `App.tsx` обнаруживает OAuth параметры
2. Принудительный редирект на `/integrations` (если нужно)
3. **FacebookIntegration** получает сессию через `supabase.auth.getSession()`

### Шаг 4: Проверка сессии
1. Проверяется наличие `session.user`
2. Если нет `email`, используется `user.id` как идентификатор
3. Создается `userEmail = facebook_user_${userId}`

### Шаг 5: Сохранение токена
1. Токен сохраняется в таблицу `ad_accounts`
2. `project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'` (твой проект)
3. `external_id = facebook_oauth_${userId}` (уникальный ID)
4. `access_token = session.provider_token`

### Шаг 6: Результат
1. Toast: "Facebook & Instagram подключены! 🎉"
2. Кнопка меняется на "Отключить"
3. Badge: "Активно" (зеленый)
4. URL очищается от OAuth параметров

---

## 📊 Проверка в базе данных

После успешного подключения, в таблице `ad_accounts` должна появиться запись:

| Поле | Значение |
|------|----------|
| `project_id` | `64c94e87-630c-470e-8ab1-8f7c8c835efa` |
| `platform` | `facebook` |
| `external_id` | `facebook_oauth_[user_id]` |
| `name` | `Facebook & Instagram` |
| `access_token` | `EAABwz...` (длинный токен) |
| `status` | `active` |

---

## ✅ Финальный Checklist

Перед нажатием кнопки убедитесь:
- [x] Код задеплоен на Vercel
- [x] В Supabase добавлен Redirect URL: `https://markvision-alpha.vercel.app/integrations`
- [x] Facebook Provider включен в Supabase
- [x] Таблица `ad_accounts` создана с полями: `project_id`, `platform`, `external_id`, `access_token`, `status`
- [x] RLS policies настроены для `ad_accounts`
- [x] Консоль браузера открыта (F12)

После нажатия:
- [ ] Видны логи с эмодзи (🔗, 🔍, 🎫, 📱, ✅)
- [ ] Provider Token: `FOUND ✅`
- [ ] `Saving to project: 64c94e87-630c-470e-8ab1-8f7c8c835efa`
- [ ] `Token saved successfully: [ID]`
- [ ] Toast: "Facebook & Instagram подключены! 🎉"
- [ ] Кнопка изменилась на "Отключить"

---

## 🚀 Готово к использованию!

**Теперь можете нажимать кнопку "Привязать Facebook & Instagram"!**

После возврата на сайт:
1. Откройте консоль (F12)
2. Проверьте логи - должны увидеть ✅
3. Проверьте Toast уведомление
4. Проверьте, что кнопка изменилась

Если что-то пойдет не так:
- Проверьте логи в консоли
- Скопируйте текст ошибки
- Все ошибки будут показаны через `toast.error`
- Вы останетесь на `/integrations` и сможете попробовать снова

**Удачи! 🎉**
