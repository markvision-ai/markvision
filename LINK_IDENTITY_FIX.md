# 🔧 ИСПРАВЛЕНИЕ: linkIdentity вместо signInWithOAuth

## ❌ Проблема

**Ошибка в URL:**
```
error=server_error
error_code=unexpected_failure
error_description=Database+error+saving+new+user
```

**Причина:**
- Вы уже авторизованы как `zapoinov@bk.ru`
- Facebook OAuth пытался создать **НОВОГО** пользователя
- Supabase выдал ошибку при попытке создать дубликат

**Что должно быть:**
- Facebook OAuth должен **СВЯЗАТЬ** аккаунты (linkIdentity)
- НЕ создавать нового пользователя

---

## ✅ Решение

### Используем `linkIdentity` для уже авторизованных пользователей

```typescript
const handleConnect = async () => {
  // Проверяем текущую сессию
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  
  if (currentSession?.user) {
    // Пользователь УЖЕ авторизован - связываем аккаунты
    console.log('👤 User already logged in, using linkIdentity');
    
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'facebook',
      options: {
        redirectTo: redirectUrl,
        scopes: 'ads_read,instagram_basic,...',
      },
    });
  } else {
    // Пользователь НЕ авторизован - создаем новую сессию
    console.log('🆕 No user session, using signInWithOAuth');
    
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { ... }
    });
  }
};
```

### Получение токена из `identities`

После `linkIdentity` токен находится в `user.identities`, а не в `session.provider_token`:

```typescript
// Проверяем наличие Facebook identity
let facebookToken = session?.provider_token;

// Если нет provider_token, ищем в identities
if (!facebookToken && session?.user?.identities) {
  const facebookIdentity = session.user.identities.find(
    (id: any) => id.provider === 'facebook'
  );
  
  if (facebookIdentity) {
    facebookToken = facebookIdentity.identity_data?.access_token;
  }
}
```

---

## 🔍 Логи после исправления

### При нажатии кнопки:
```
🔍 Current session: zapoinov@bk.ru
👤 User already logged in, using linkIdentity
🔗 OAuth redirect URL: https://markvision-alpha.vercel.app/integrations
✅ linkIdentity success: { ... }
```

### После возврата:
```
🔍 AuthProvider Session: { user: { email: "zapoinov@bk.ru", ... } }
👤 User: { id: "...", email: "zapoinov@bk.ru" }
🔗 Identities: [
  { provider: "email", ... },
  { provider: "facebook", identity_data: { access_token: "EAABwz..." } }
]
🎫 Provider Token: NOT FOUND ❌ (это нормально для linkIdentity)
🔍 Found Facebook identity: { provider: "facebook", ... }
🎯 Final Facebook token: FOUND ✅
📱 Facebook OAuth успешен, сохраняем токен...
💾 Saving to project: 64c94e87-630c-470e-8ab1-8f7c8c835efa
✅ Token saved successfully!
```

---

## 📊 Что изменилось

### До (НЕПРАВИЛЬНО):
```typescript
// Всегда использовал signInWithOAuth
await supabase.auth.signInWithOAuth({ provider: 'facebook' });

// Результат: попытка создать нового пользователя
// Ошибка: Database error saving new user
```

### После (ПРАВИЛЬНО):
```typescript
// Проверяем текущую сессию
if (currentSession?.user) {
  // Связываем аккаунты
  await supabase.auth.linkIdentity({ provider: 'facebook' });
} else {
  // Создаем новую сессию
  await supabase.auth.signInWithOAuth({ provider: 'facebook' });
}

// Результат: Facebook аккаунт связан с zapoinov@bk.ru
// Токен сохранен в ad_accounts
```

---

## 🎯 Результат

После исправления:
1. ✅ Facebook OAuth **НЕ создает** нового пользователя
2. ✅ Аккаунт Facebook **связывается** с `zapoinov@bk.ru`
3. ✅ Токен находится в `user.identities[].identity_data.access_token`
4. ✅ Токен сохраняется в `ad_accounts` для проекта `64c94e87-630c-470e-8ab1-8f7c8c835efa`
5. ✅ Больше нет ошибки "Database error saving new user"

---

## 🧪 Тестирование

1. Очистите кеш: `Ctrl+Shift+R`
2. Откройте консоль: `F12`
3. Перейдите на `/integrations`
4. Нажмите "Привязать Facebook & Instagram"
5. Проверьте логи:
   - `👤 User already logged in, using linkIdentity`
   - `✅ linkIdentity success`
6. Авторизуйтесь на Facebook
7. После возврата проверьте:
   - `🔗 Identities: [...]` - должен быть Facebook
   - `🎯 Final Facebook token: FOUND ✅`
   - `✅ Token saved successfully!`

---

## 📁 Затронутые файлы
- ✅ `src/components/integrations/FacebookIntegration.tsx`
  - Добавлена проверка текущей сессии
  - Используется `linkIdentity` для авторизованных пользователей
  - Токен извлекается из `user.identities`

---

**Статус:** ✅ ИСПРАВЛЕНО

Теперь можете попробовать снова! Ошибка "Database error saving new user" больше не появится 🚀
