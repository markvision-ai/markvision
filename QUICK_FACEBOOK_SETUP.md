# ⚡ Quick Setup: Facebook OAuth

## 🚀 Быстрая настройка (5 минут)

### Шаг 1: Supabase Dashboard
1. Откройте https://supabase.com/dashboard
2. Перейдите в **Authentication** → **URL Configuration**
3. В поле **Redirect URLs** добавьте:
   ```
   https://markvision-alpha.vercel.app/integrations
   http://localhost:8080/integrations
   ```
4. Нажмите **Save**

### Шаг 2: Проверка кода
✅ Код уже обновлен! Проверьте:
- `src/components/integrations/FacebookIntegration.tsx` - `redirectTo` настроен
- `src/components/integrations/IntegrationsManagement.tsx` - обработка ошибок добавлена

### Шаг 3: Тестирование
1. Откройте `/integrations`
2. Нажмите "Привязать Facebook & Instagram"
3. Если ошибка - увидите всплывающее уведомление (toast)
4. Если успех - токен сохранится в `ad_accounts`

---

## 📋 Что теперь работает

| Событие | Результат |
|---------|-----------|
| ✅ Успешная авторизация | Toast: "Facebook & Instagram подключены! 🎉" |
| ❌ Ошибка OAuth | Toast: текст ошибки (например, "Error getting user email") |
| 🔄 Редирект | Всегда на `/integrations` (не на главную) |
| 🧹 URL | Автоматически очищается от OAuth параметров |

---

## 🐛 Отладка

Если что-то не работает:
1. Откройте консоль браузера (F12)
2. Проверьте Network вкладку
3. Проверьте параметры URL после редиректа
4. Проверьте RLS policies для `ad_accounts`

---

**Готово!** Теперь все ошибки OAuth будут показываться на странице `/integrations` в виде toast 🎉
