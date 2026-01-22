# 🚀 Пошаговый деплой Edge Function через CLI

## Шаг 1: Установка Supabase CLI

Открой терминал и выполни:

```bash
brew install supabase/tap/supabase
```

**Проверка установки:**
```bash
supabase --version
```

Должно показать что-то вроде: `1.142.2`

---

## Шаг 2: Логин в Supabase

```bash
supabase login
```

**Что произойдёт:**
1. Откроется браузер
2. Попросит авторизоваться в Supabase
3. После авторизации вернёшься в терминал
4. Увидишь: `✅ Logged in successfully`

---

## Шаг 3: Привязка к проекту

Перейди в папку проекта:
```bash
cd "/Users/urijzapojnov/MarkVision AI код/markvision"
```

Привяжи проект:
```bash
supabase link
```

**Что спросит:**
1. **Project ref:** Найди в Supabase Dashboard → Settings → General → Reference ID
   - Выглядит как: `pyscczcuersdjvpmkiec` (твой ID)
   
2. **Database password:** Пароль от базы данных (тот, что задавал при создании проекта)

**Успешный результат:**
```
✅ Linked to project pyscczcuersdjvpmkiec
```

---

## Шаг 4: Deploy функции

```bash
supabase functions deploy fetch-facebook-profiles
```

**Что произойдёт:**
```
Deploying function fetch-facebook-profiles...
📦 Bundling fetch-facebook-profiles
✅ Function deployed successfully
Function URL: https://pyscczcuersdjvpmkiec.supabase.co/functions/v1/fetch-facebook-profiles
```

**Важно:** Скопируй URL - он понадобится для проверки.

---

## Шаг 5: Проверка деплоя

### Через Dashboard:
1. Открой: https://supabase.com/dashboard/project/pyscczcuersdjvpmkiec/functions
2. Должна появиться функция `fetch-facebook-profiles` со статусом **Active**

### Через CLI:
```bash
supabase functions list
```

Должно показать:
```
NAME                       STATUS   VERSION   CREATED
fetch-facebook-profiles    active   1         2026-01-22
```

---

## Шаг 6: Push код на GitHub/Vercel

```bash
git push
```

Подожди 1-2 минуты, пока Vercel задеплоит обновлённый код.

---

## Шаг 7: Проверка работы

1. **Открой:** https://markvision-alpha.vercel.app/integrations

2. **Нажми:** кнопку **"🔄 Обновить"**

3. **Должно показать:**
   - ✅ 👤 Юрий Валерьевич (Facebook Personal)
   - ✅ 📸 @[username] (Instagram Business)
   - ✅ Уведомление: "Профили загружены!"

4. **В консоли должно быть:**
   ```javascript
   ✅ Edge Function response: {
     facebookProfile: { name: "Юрий Валерьевич", ... },
     instagramAccounts: [...]
   }
   ```

---

## 🛠️ Troubleshooting

### Проблема: `brew: command not found`

**Решение для macOS:**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

После установки повтори:
```bash
brew install supabase/tap/supabase
```

### Проблема: `supabase: command not found` после установки

**Решение:**
```bash
# Добавь в PATH
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Проверь
supabase --version
```

### Проблема: `Project ref not found`

**Как найти Project Ref:**
1. Открой: https://supabase.com/dashboard
2. Выбери свой проект (Analitika)
3. Settings → General → Reference ID
4. Скопируй ID (например: `pyscczcuersdjvpmkiec`)

Используй при `supabase link`:
```bash
supabase link --project-ref pyscczcuersdjvpmkiec
```

### Проблема: `Database password incorrect`

**Решение:**
1. Открой: https://supabase.com/dashboard/project/pyscczcuersdjvpmkiec/settings/database
2. Нажми **"Reset database password"**
3. Задай новый пароль
4. Используй его при `supabase link`

### Проблема: Function не задеплоилась

**Проверка логов:**
```bash
supabase functions logs fetch-facebook-profiles
```

**Повторный деплой:**
```bash
supabase functions deploy fetch-facebook-profiles --debug
```

---

## 📋 Краткая шпаргалка

```bash
# 1. Установка
brew install supabase/tap/supabase

# 2. Логин
supabase login

# 3. Переход в проект
cd "/Users/urijzapojnov/MarkVision AI код/markvision"

# 4. Привязка (только первый раз)
supabase link --project-ref pyscczcuersdjvpmkiec

# 5. Деплой функции
supabase functions deploy fetch-facebook-profiles

# 6. Проверка
supabase functions list

# 7. Push кода
git push
```

---

## ✅ Готово!

После выполнения всех шагов:
1. ✅ Edge Function задеплоена
2. ✅ Код обновлён на Vercel
3. ✅ Профили загружаются без CORS ошибок

**Нажми "🔄 Обновить" и увидишь свои профили!** 🎉
