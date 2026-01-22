# ✅ Checklist: Настройка Facebook OAuth в Supabase

## 🔍 Проверьте эти настройки в Supabase Dashboard

### 1. **Authentication → Providers → Facebook**

Откройте: https://supabase.com/dashboard/project/pyscczcuersdjvpmkiec/auth/providers

Должно быть:
- ✅ **Enabled**: ON (включен)
- ✅ **Client ID**: [Ваш Facebook App ID]
- ✅ **Client Secret**: [Ваш Facebook App Secret]
- ✅ **Skip nonce check**: OFF (выключен)

**ВАЖНО:** Если нет Client ID или Client Secret, нужно создать Facebook App!

---

### 2. **Authentication → URL Configuration**

Откройте: https://supabase.com/dashboard/project/pyscczcuersdjvpmkiec/auth/url-configuration

**Site URL:**
```
https://markvision-alpha.vercel.app
```

**Redirect URLs** (добавьте ОБА):
```
https://markvision-alpha.vercel.app/integrations
http://localhost:8080/integrations
```

**ВАЖНО:** Убедитесь, что нет лишних пробелов!

---

### 3. **Authentication → Settings → Auth Providers**

Откройте: https://supabase.com/dashboard/project/pyscczcuersdjvpmkiec/settings/auth

Найдите секцию **External OAuth Providers** и убедитесь:
- ✅ **Enable Manual Linking**: **ON** (это КРИТИЧНО!)

Если эта опция выключена, то `linkIdentity` не будет работать!

---

### 4. **Facebook App Settings**

Откройте: https://developers.facebook.com/apps/

Выберите ваше приложение и проверьте:

#### A. Settings → Basic:
- ✅ **App ID**: Должен совпадать с Client ID в Supabase
- ✅ **App Secret**: Должен совпадать с Client Secret в Supabase
- ✅ **App Domains**:
  ```
  markvision-alpha.vercel.app
  pyscczcuersdjvpmkiec.supabase.co
  ```

#### B. Facebook Login → Settings:
- ✅ **Valid OAuth Redirect URIs**:
  ```
  https://pyscczcuersdjvpmkiec.supabase.co/auth/v1/callback
  ```

#### C. Permissions:
Убедитесь, что приложение запрашивает:
- `ads_read`
- `instagram_basic`
- `instagram_manage_insights`
- `pages_show_list`
- `pages_read_engagement`

---

## 🐛 Распространенные ошибки

### Ошибка 1: "Database error saving new user"
**Причина:** Supabase пытается создать нового пользователя вместо связывания

**Решение:**
1. Включите **Enable Manual Linking** в Supabase
2. Убедитесь, что код использует `linkIdentity` (нужен деплой)
3. ИЛИ используйте временное решение с Graph API Explorer

---

### Ошибка 2: "Invalid OAuth Redirect URI"
**Причина:** Неправильный Redirect URI в Facebook App

**Решение:**
Добавьте в Facebook Login → Settings:
```
https://pyscczcuersdjvpmkiec.supabase.co/auth/v1/callback
```

---

### Ошибка 3: "Provider not enabled"
**Причина:** Facebook Provider выключен в Supabase

**Решение:**
Включите Facebook Provider в Authentication → Providers

---

### Ошибка 4: "Error getting user email"
**Причина:** У Facebook аккаунта нет email или приложение не запрашивает `email` permission

**Решение:**
1. Добавьте `email` в scopes (уже добавлено в коде)
2. ИЛИ используйте `user.id` как идентификатор (уже реализовано)

---

## 📋 Быстрый чеклист

Проверьте ВСЕ пункты:

### Supabase:
- [ ] Facebook Provider включен
- [ ] Client ID и Client Secret заполнены
- [ ] Site URL: `https://markvision-alpha.vercel.app`
- [ ] Redirect URLs содержат `/integrations`
- [ ] **Enable Manual Linking: ON** ⚠️ КРИТИЧНО!

### Facebook App:
- [ ] App Domains включают `markvision-alpha.vercel.app`
- [ ] OAuth Redirect URI: `https://pyscczcuersdjvpmkiec.supabase.co/auth/v1/callback`
- [ ] Все permissions добавлены

### Код:
- [ ] Изменения закоммичены
- [ ] Код задеплоен на Vercel
- [ ] `linkIdentity` используется для авторизованных пользователей

---

## 🚀 После проверки всех пунктов

1. Очистите кеш браузера: `Ctrl+Shift+R`
2. Откройте консоль: `F12`
3. Попробуйте подключить Facebook снова
4. Проверьте логи в консоли

Если все настроено правильно, вы увидите:
```
👤 User already logged in, using linkIdentity
✅ linkIdentity success
```

---

**Если проблема остается, используйте временное решение с Graph API Explorer!**
См. файл: `FACEBOOK_MANUAL_TOKEN.md`
