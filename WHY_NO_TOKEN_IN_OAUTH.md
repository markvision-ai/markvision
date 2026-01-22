# ❌ Почему `Provider Token: NOT FOUND`?

## Проблема

В консоли видно:
```javascript
Provider Token: NOT FOUND ❌
Refresh Token: NOT FOUND ❌
```

И в `identity_data` нет `access_token`.

## Причина

**Supabase OAuth (`linkIdentity`) НЕ предназначен для получения Graph API токенов.**

Он используется только для **авторизации пользователей** (User Authentication), а не для **интеграций с API** (API Integration).

### Что Supabase OAuth делает:
- ✅ Привязывает Facebook identity к пользователю
- ✅ Сохраняет базовые данные профиля (имя, фото, email)
- ✅ Позволяет входить через Facebook

### Что Supabase OAuth НЕ делает:
- ❌ Не сохраняет Graph API `access_token`
- ❌ Не даёт права на `ads_read`, `instagram_basic`
- ❌ Не позволяет делать запросы к Graph API

## Решение

Для получения **Graph API токена** используется **2-шаговый процесс**:

### Шаг 1: Привязка аккаунта (через Supabase OAuth)
```javascript
// Это уже сделано через кнопку "Привязать аккаунт"
supabase.auth.linkIdentity({ provider: 'facebook' })
```

**Результат:** Facebook identity привязан к пользователю ✅

### Шаг 2: Получение токена (через Graph API Explorer)
```
1. Открой: https://developers.facebook.com/tools/explorer/
2. Выбери своё приложение
3. Нажми "Get Token" → "Get User Access Token"
4. Выбери права: ads_read, instagram_basic, pages_show_list
5. Скопируй токен
```

**Результат:** Токен с правами на Graph API ✅

### Шаг 3: Сохранение токена в базу (через SQL)
```sql
-- Выполни в Supabase SQL Editor файл:
EXECUTE_THIS_SQL.sql
```

**Результат:** Токен сохранён в `ad_accounts` ✅

## Почему так?

### Facebook OAuth имеет 2 типа потоков:

#### 1. User Authentication Flow (Supabase использует это)
- **Цель:** Вход пользователя
- **Токен:** Короткий, на 1-2 часа
- **Права:** Только базовые (email, profile)
- **Где хранится:** В Supabase auth.users

#### 2. Server-to-Server Flow (нужно для API интеграций)
- **Цель:** Доступ к API (Ads, Instagram Insights)
- **Токен:** Долгий, на 60 дней
- **Права:** Расширенные (ads_read, instagram_manage_insights)
- **Где хранится:** В вашей базе (`ad_accounts`)

## Что теперь делать?

### ✅ Код уже готов
Я упростил OAuth callback - он больше не пытается найти токен (его там нет).

### ✅ Теперь нужно:

1. **Push код** (закоммичен, осталось запушить):
   ```bash
   git push
   ```

2. **Выполни SQL** в Supabase SQL Editor:
   - Файл: `EXECUTE_THIS_SQL.sql`
   - Это вставит токен, который ты уже получил

3. **Обнови страницу** `/integrations`
   - Статус изменится на "Активно"
   - Загрузятся профили Facebook & Instagram

## Итоговая схема

```
┌─────────────────────────────────────────────────────────────┐
│                   Supabase OAuth                            │
│  (linkIdentity) ──────────► Facebook Identity ✅            │
│                             - Имя: Юрий Валерьевич          │
│                             - Photo: ...                     │
│                             - НО: НЕТ access_token ❌        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (отдельно)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Graph API Explorer (вручную)                   │
│  Получить токен ──────────► Long-lived Access Token ✅      │
│                             - Права: ads_read, instagram... │
│                             - Срок: 60 дней                  │
│                             - Длина: 267 символов            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (SQL INSERT)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Database                           │
│  ad_accounts ──────────────► access_token сохранён ✅       │
│                             - project_id: 64c94e87...        │
│                             - platform: facebook             │
│                             - status: active                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ (автоматически)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Интеграции показывают профили ✅               │
│  - 👤 Юрий Валерьевич (Facebook)                            │
│  - 📸 @aiva.clinic (Instagram)                              │
│  - [🔄 Обновить] [🔗 Отключить]                            │
└─────────────────────────────────────────────────────────────┘
```

## Следующие шаги (автоматизация)

В будущем можно добавить:
1. **Server-side OAuth** - токен получается на сервере
2. **Token Exchange** - короткий токен обменивается на долгий
3. **Auto Refresh** - токен автоматически продлевается

Но для MVP **ручное добавление через Graph API Explorer** - это нормально и безопасно! ✅
