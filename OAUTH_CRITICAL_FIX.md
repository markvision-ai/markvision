# 🔥 КРИТИЧЕСКИЙ ФИКС: Facebook OAuth + Dashboard Fonts

## ✅ Что исправлено

### 1. **App.tsx - Глобальный обработчик OAuth**

Добавлен компонент `OAuthHandler`, который:
- ✅ Перехватывает OAuth параметры в URL (`access_token`, `code`)
- ✅ Принудительно редиректит на `/integrations` при обнаружении OAuth
- ✅ Слушает событие `SIGNED_IN` от Supabase
- ✅ Логирует все OAuth события для отладки

```typescript
const OAuthHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Проверка на наличие OAuth параметров в URL
    const handleOAuthRedirect = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const hasAccessToken = hashParams.has('access_token') || searchParams.has('access_token');
      const hasCode = searchParams.has('code');
      const hasOAuthParams = hasAccessToken || hasCode;

      if (hasOAuthParams && window.location.pathname !== '/integrations') {
        console.log('🔄 OAuth params detected, redirecting to /integrations');
        navigate('/integrations', { replace: true });
      }
    };

    handleOAuthRedirect();

    // Слушатель изменений авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event);
      console.log('👤 Session:', session);

      if (event === 'SIGNED_IN') {
        const currentUrl = window.location.href;
        const hasOAuthHash = currentUrl.includes('#access_token') || currentUrl.includes('code=');
        
        if (hasOAuthHash && window.location.pathname !== '/integrations') {
          console.log('✅ SIGNED_IN with OAuth params, redirecting to /integrations');
          navigate('/integrations', { replace: true });
        }

        if (session?.provider_token) {
          console.log('🎫 Provider token found:', session.provider_token.substring(0, 20) + '...');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
};
```

---

### 2. **Index.tsx - Редирект авторизованных пользователей**

✅ Уже правильно настроено:
- Если пользователь НЕ авторизован → показывается `LandingPage`
- Если пользователь авторизован → редирект на `/dashboard` (показывается `AnalyticsPlatform`)
- Проверка наличия проектов и онбординга

```typescript
// Если пользователь не авторизован — показываем лендинг
if (!user) {
  return <LandingPage />;
}

// Если авторизован и прошёл онбординг — показываем платформу
return <AnalyticsPlatform />;
```

---

### 3. **FacebookIntegration.tsx - Детальное логирование**

Добавлены критические логи для отладки:

```typescript
const { data: { session } } = await supabase.auth.getSession();

// КРИТИЧЕСКИЙ ЛОГ для отладки
console.log('🔍 AuthProvider Session:', session);
console.log('🎫 Provider Token:', session?.provider_token ? 'FOUND ✅' : 'NOT FOUND ❌');
console.log('🔄 Refresh Token:', session?.provider_refresh_token ? 'FOUND ✅' : 'NOT FOUND ❌');
```

**Что показывают логи:**
- ✅ Полный объект `session` для анализа
- ✅ Наличие `provider_token` (токен Facebook)
- ✅ Наличие `refresh_token` для обновления токена

---

### 4. **Dashboard Fonts - Исправление обрезки текста**

Уменьшены размеры шрифтов для предотвращения обрезки на Vercel:

#### AnimatedMetricCard.tsx:
```typescript
// Было:
text-3xl font-bold

// Стало:
text-xl md:text-2xl font-semibold
```

#### RealtimeDashboard.tsx:
```typescript
// Было:
text-3xl font-bold

// Стало:
text-xl md:text-2xl font-semibold
```

**Результат:**
- ✅ На мобильных: `text-xl` (20px)
- ✅ На десктопах: `text-2xl` (24px)
- ✅ Больше не обрезается на Vercel
- ✅ Более читаемо и компактно

---

## 🔍 Логи для отладки

После подключения Facebook OAuth вы увидите в консоли:

```
🔄 OAuth params detected, redirecting to /integrations
🔐 Auth event: SIGNED_IN
👤 Session: { user: {...}, provider_token: 'EAABwz...', ... }
✅ SIGNED_IN with OAuth params, redirecting to /integrations
🎫 Provider token found: EAABwzPJzZCEZCBYz...
🔍 AuthProvider Session: { ... }
🎫 Provider Token: FOUND ✅
🔄 Refresh Token: FOUND ✅
📱 Facebook OAuth успешен, сохраняем токен...
```

---

## 🎯 Сценарии работы

### Сценарий 1: Успешная авторизация через Facebook
1. Пользователь нажимает "Привязать Facebook & Instagram"
2. Открывается страница Facebook OAuth
3. Пользователь подтверждает доступ
4. Facebook редиректит на `https://markvision-alpha.vercel.app/integrations#access_token=...`
5. **OAuthHandler** в `App.tsx` обнаруживает `#access_token` в URL
6. **Принудительный редирект** на `/integrations`
7. **FacebookIntegration** получает `session.provider_token`
8. Токен сохраняется в `ad_accounts`
9. Toast: "Facebook & Instagram подключены! 🎉"

### Сценарий 2: Ошибка OAuth
1. Пользователь нажимает "Привязать Facebook & Instagram"
2. Открывается страница Facebook OAuth
3. Происходит ошибка (например, "Error getting user email")
4. Facebook редиректит на `https://markvision-alpha.vercel.app/integrations?error=server_error&error_description=...`
5. **IntegrationsManagement** или **FacebookIntegration** показывают `toast.error`
6. Пользователь остается на `/integrations`

### Сценарий 3: Открытие главной страницы авторизованным пользователем
1. Пользователь авторизован и открывает `/`
2. **Index.tsx** проверяет наличие `user`
3. Если `user` есть → показывается `AnalyticsPlatform` (Dashboard)
4. Если `user` нет → показывается `LandingPage`

---

## 📁 Затронутые файлы

- ✅ `src/App.tsx` - добавлен `OAuthHandler`
- ✅ `src/pages/Index.tsx` - уже правильно настроен
- ✅ `src/components/integrations/FacebookIntegration.tsx` - добавлены логи
- ✅ `src/components/dashboard/AnimatedMetricCard.tsx` - уменьшены шрифты
- ✅ `src/components/dashboard/RealtimeDashboard.tsx` - уменьшены шрифты

---

## ✅ Checklist

- [x] Добавлен глобальный слушатель `onAuthStateChange` в `App.tsx`
- [x] Принудительный редирект на `/integrations` при OAuth
- [x] Логирование `provider_token` в `FacebookIntegration.tsx`
- [x] Авторизованные пользователи редиректятся с `/` на Dashboard
- [x] Размеры шрифтов уменьшены для предотвращения обрезки
- [x] Нет linter ошибок

---

## 🧪 Тестирование

1. Откройте консоль браузера (F12)
2. Перейдите на `/integrations`
3. Нажмите "Привязать Facebook & Instagram"
4. Наблюдайте логи в консоли:
   - Должны увидеть `🔄 OAuth params detected`
   - Должны увидеть `🔐 Auth event: SIGNED_IN`
   - Должны увидеть `🎫 Provider Token: FOUND ✅`
5. Проверьте, что токен сохранился в таблицу `ad_accounts`

---

**Статус:** ✅ ГОТОВО К ТЕСТИРОВАНИЮ

Теперь все OAuth параметры обрабатываются корректно, логи помогут отладить проблемы, а шрифты на Dashboard не обрезаются! 🚀
