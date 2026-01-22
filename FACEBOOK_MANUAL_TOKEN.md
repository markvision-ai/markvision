# 🔧 ВРЕМЕННОЕ РЕШЕНИЕ: Получение токена через Graph API Explorer

## ❌ Проблема
Ошибка `Database error saving new user` продолжает появляться, потому что:
1. Код с `linkIdentity` еще не задеплоен на Vercel
2. Facebook Provider в Supabase может быть настроен неправильно

## ✅ ВРЕМЕННОЕ РЕШЕНИЕ: Получить токен вручную

### Шаг 1: Откройте Facebook Graph API Explorer
1. Перейдите на: https://developers.facebook.com/tools/explorer/
2. Войдите в свой Facebook аккаунт

### Шаг 2: Получите Access Token
1. В Graph API Explorer выберите свое приложение (если есть)
2. Нажмите **"Generate Access Token"**
3. Выберите разрешения:
   - `ads_read`
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_show_list`
   - `pages_read_engagement`
4. Скопируйте полученный Access Token

### Шаг 3: Сохраните токен в базу данных
1. Откройте Supabase Dashboard
2. Перейдите в **Table Editor** → `ad_accounts`
3. Нажмите **"Insert row"**
4. Заполните поля:
   - `project_id`: `64c94e87-630c-470e-8ab1-8f7c8c835efa`
   - `platform`: `facebook`
   - `external_id`: `facebook_manual_token`
   - `name`: `Facebook & Instagram`
   - `access_token`: [Вставьте скопированный токен]
   - `status`: `active`
5. Нажмите **"Save"**

### Шаг 4: Обновите страницу
1. Откройте `https://markvision-alpha.vercel.app/integrations`
2. Нажмите `Ctrl+Shift+R` для очистки кеша
3. Страница должна показать "Facebook & Instagram" как **"Активно"**

---

## 🚀 ПОСТОЯННОЕ РЕШЕНИЕ: Деплой с linkIdentity

Чтобы полностью исправить OAuth:

### 1. Закоммитить изменения:
```bash
git add .
git commit -m "fix: use linkIdentity for Facebook OAuth"
git push
```

### 2. Дождаться деплоя на Vercel
Vercel автоматически задеплоит изменения (~2-3 минуты)

### 3. Проверить настройки Supabase

#### A. Authentication → Providers → Facebook:
- ✅ Enabled: **ON**
- ✅ Client ID: [Ваш Facebook App ID]
- ✅ Client Secret: [Ваш Facebook App Secret]
- ✅ Authorize URL: `https://www.facebook.com/v21.0/dialog/oauth`
- ✅ Access Token URL: `https://graph.facebook.com/v21.0/oauth/access_token`
- ✅ Skip nonce check: **OFF**

#### B. Authentication → URL Configuration:
- ✅ Site URL: `https://markvision-alpha.vercel.app`
- ✅ Redirect URLs:
  ```
  https://markvision-alpha.vercel.app/integrations
  http://localhost:8080/integrations
  ```

#### C. Authentication → Settings → Auth Providers:
- ✅ Enable Manual Linking: **ON** (это критично!)

---

## 🔍 Проверка Facebook App

Убедитесь, что в Facebook Developers настроено:

### 1. Valid OAuth Redirect URIs:
```
https://pyscczcuersdjvpmkiec.supabase.co/auth/v1/callback
```

### 2. App Domains:
```
markvision-alpha.vercel.app
pyscczcuersdjvpmkiec.supabase.co
```

### 3. Permissions:
- `ads_read`
- `instagram_basic`
- `instagram_manage_insights`
- `pages_show_list`
- `pages_read_engagement`

---

## 📋 Checklist

### Временное решение (сейчас):
- [ ] Открыть Graph API Explorer
- [ ] Получить Access Token
- [ ] Сохранить токен в `ad_accounts` вручную
- [ ] Обновить страницу `/integrations`
- [ ] Проверить, что Facebook показывает "Активно"

### Постоянное решение (после деплоя):
- [ ] Закоммитить изменения
- [ ] Дождаться деплоя на Vercel
- [ ] Проверить настройки Supabase (Enable Manual Linking)
- [ ] Проверить Facebook App Redirect URIs
- [ ] Попробовать OAuth снова

---

## 🎯 Что делать СЕЙЧАС

**Вариант 1: Временное решение (5 минут)**
Используйте Graph API Explorer для получения токена вручную

**Вариант 2: Постоянное решение (10 минут)**
1. Закоммитьте и задеплойте изменения
2. Проверьте настройки Supabase
3. Попробуйте OAuth снова

---

**Рекомендую начать с Варианта 1**, чтобы быстро получить рабочий токен, а потом уже настроить OAuth правильно! 🚀
