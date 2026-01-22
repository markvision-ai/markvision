# 🔧 Настройка Redirect URLs в Supabase для Facebook OAuth

## 📋 Инструкция

### 1. **Откройте Supabase Dashboard**
Перейдите в ваш проект на [supabase.com](https://supabase.com/dashboard)

### 2. **Настройка Redirect URLs**

1. В левом меню выберите **Authentication** → **URL Configuration**
2. Найдите раздел **Redirect URLs**
3. Добавьте следующие URL:

```
https://markvision-alpha.vercel.app/integrations
http://localhost:8080/integrations
```

**Важно:**
- Первый URL для production (Vercel)
- Второй URL для локальной разработки
- Убедитесь, что нет пробелов или лишних символов

### 3. **Сохраните изменения**
Нажмите кнопку **Save** внизу страницы

---

## 💻 Что изменено в коде

### 1. **FacebookIntegration.tsx**
✅ `redirectTo` уже настроен правильно:
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'facebook',
  options: {
    redirectTo: `${window.location.origin}/integrations`,
    scopes: 'ads_read,instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement',
  },
});
```

### 2. **IntegrationsManagement.tsx**
✅ Добавлена обработка OAuth ошибок:
```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  
  if (error) {
    const errorMessage = errorDescription 
      ? decodeURIComponent(errorDescription) 
      : 'Ошибка авторизации через Facebook';
    
    toast.error(errorMessage, {
      duration: 5000,
      description: error === 'server_error' ? 'Попробуйте еще раз или обратитесь в поддержку' : undefined
    });
    
    // Очищаем URL от параметров ошибки
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

### 3. **FacebookIntegration.tsx**
✅ Добавлена такая же обработка OAuth ошибок (дублируем для надежности)

---

## 🎯 Как это работает

### Сценарий 1: Успешная авторизация
1. Пользователь нажимает "Привязать Facebook & Instagram"
2. Открывается страница Facebook OAuth
3. Пользователь подтверждает доступ
4. Facebook редиректит на `https://markvision-alpha.vercel.app/integrations`
5. `FacebookIntegration.tsx` обнаруживает `session.provider_token`
6. Токен сохраняется в таблицу `ad_accounts`
7. Показывается `toast.success('Facebook & Instagram подключены! 🎉')`
8. URL очищается от OAuth параметров

### Сценарий 2: Ошибка авторизации
1. Пользователь нажимает "Привязать Facebook & Instagram"
2. Открывается страница Facebook OAuth
3. Происходит ошибка (например, "Error getting user email")
4. Facebook редиректит на `https://markvision-alpha.vercel.app/integrations?error=server_error&error_description=Error%20getting%20user%20email`
5. `IntegrationsManagement.tsx` или `FacebookIntegration.tsx` обнаруживают параметр `error` в URL
6. Показывается `toast.error('Error getting user email')`
7. URL очищается от параметров ошибки
8. Пользователь остается на `/integrations` и может попробовать снова

---

## ✅ Checklist

- [ ] Добавлен `https://markvision-alpha.vercel.app/integrations` в Supabase Redirect URLs
- [ ] Добавлен `http://localhost:8080/integrations` в Supabase Redirect URLs
- [ ] Код обновлен (уже сделано)
- [ ] Протестирована успешная авторизация
- [ ] Протестирована ошибка авторизации (должен показаться toast)

---

## 🧪 Тестирование

### Локально:
1. Запустите `npm run dev`
2. Откройте `http://localhost:8080/integrations`
3. Нажмите "Привязать Facebook & Instagram"
4. Проверьте, что редирект работает корректно

### Production:
1. Деплой на Vercel
2. Откройте `https://markvision-alpha.vercel.app/integrations`
3. Нажмите "Привязать Facebook & Instagram"
4. Проверьте, что редирект работает корректно

---

## 🐛 Возможные проблемы

### Проблема: "Invalid Redirect URL"
**Решение:** Убедитесь, что URL добавлен ТОЧНО так, как указано выше, без пробелов

### Проблема: Ошибка не показывается
**Решение:** Проверьте консоль браузера, возможно ошибка в другом месте

### Проблема: Токен не сохраняется
**Решение:** Проверьте RLS policies для таблицы `ad_accounts`

---

## 📁 Затронутые файлы
- ✅ `src/components/integrations/FacebookIntegration.tsx`
- ✅ `src/components/integrations/IntegrationsManagement.tsx`
- ✅ Supabase Dashboard → Authentication → URL Configuration

---

**Статус:** ✅ ГОТОВО К НАСТРОЙКЕ В SUPABASE

После добавления Redirect URL в Supabase, все будет работать автоматически! 🚀
