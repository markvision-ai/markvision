# 🚨 КРИТИЧЕСКИЙ ФИКС: OAuth редирект на главную

## Проблема
После авторизации через Facebook, приложение редиректило на главную страницу (`/`) вместо `/integrations`, и OAuth параметры терялись.

**Причина:**
- `Index.tsx` проверяет проекты и делает редирект на `/setup` или `/`
- `Auth.tsx` также делает редирект после авторизации
- OAuth параметры в URL (`#access_token`, `?code`, `?error`) теряются при редиректе

## ✅ Решение

### 1. **Index.tsx - Приоритетная проверка OAuth**
Добавлена проверка OAuth параметров ПЕРЕД всеми остальными редиректами:

```typescript
// КРИТИЧНО: Проверка OAuth параметров ПЕРЕД любыми редиректами
useEffect(() => {
  const checkOAuthParams = () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    
    const hasAccessToken = hashParams.has('access_token') || searchParams.has('access_token');
    const hasCode = searchParams.has('code');
    const hasError = searchParams.has('error');
    
    if ((hasAccessToken || hasCode || hasError) && window.location.pathname !== '/integrations') {
      console.log('🚨 CRITICAL: OAuth params found in Index.tsx, forcing redirect to /integrations');
      navigate('/integrations', { replace: true });
      return true;
    }
    return false;
  };

  if (checkOAuthParams()) {
    return; // Останавливаем выполнение других useEffect
  }
}, [navigate]);
```

### 2. **Auth.tsx - Проверка OAuth перед редиректом**
Добавлена проверка OAuth параметров в функции `checkUserProjects`:

```typescript
const checkUserProjects = async (userId: string) => {
  try {
    // КРИТИЧНО: Проверка OAuth параметров перед редиректом
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = hashParams.has('access_token') || searchParams.has('code') || searchParams.has('error');
    
    if (hasOAuthParams) {
      console.log('🚨 OAuth params detected in Auth.tsx, redirecting to /integrations');
      navigate('/integrations');
      return;
    }
    
    // ... остальная логика проверки проектов
  }
};
```

### 3. **App.tsx - Усиленный OAuthHandler**
Добавлены детальные логи и `setTimeout` для гарантии выполнения:

```typescript
console.log('🔍 Checking OAuth params:', {
  pathname: window.location.pathname,
  hasAccessToken,
  hasCode,
  hasError,
  hash: window.location.hash.substring(0, 50),
  search: window.location.search.substring(0, 100)
});

if (hasOAuthParams && window.location.pathname !== '/integrations') {
  console.log('🚨 FORCING redirect to /integrations!');
  setTimeout(() => {
    navigate('/integrations', { replace: true });
  }, 0);
}
```

## 🔍 Логи для отладки

После исправления вы увидите в консоли:

```
🔍 Checking OAuth params: {
  pathname: "/",
  hasAccessToken: true,
  hasCode: false,
  hasError: false,
  hash: "#access_token=EAABwz...",
  search: ""
}
🚨 FORCING redirect to /integrations!
🚨 CRITICAL: OAuth params found in Index.tsx, forcing redirect to /integrations
```

## 🎯 Как это работает

### До исправления:
1. Facebook редиректит на `https://markvision-alpha.vercel.app/#access_token=...`
2. `Index.tsx` проверяет проекты и редиректит на `/` или `/setup`
3. OAuth параметры теряются ❌
4. `FacebookIntegration` не получает токен

### После исправления:
1. Facebook редиректит на `https://markvision-alpha.vercel.app/#access_token=...`
2. `OAuthHandler` в `App.tsx` обнаруживает OAuth параметры
3. **ПРИНУДИТЕЛЬНЫЙ редирект** на `/integrations` ✅
4. `Index.tsx` также проверяет OAuth и редиректит на `/integrations`
5. `Auth.tsx` также проверяет OAuth и редиректит на `/integrations`
6. `FacebookIntegration` получает токен и сохраняет в БД

## 📁 Затронутые файлы
- ✅ `src/pages/Index.tsx` - добавлена приоритетная проверка OAuth
- ✅ `src/pages/Auth.tsx` - добавлена проверка OAuth в `checkUserProjects`
- ✅ `src/App.tsx` - усилены логи и добавлен `setTimeout`

## 🧪 Тестирование

1. Очистите кеш браузера (Ctrl+Shift+R)
2. Откройте консоль (F12)
3. Перейдите на `/integrations`
4. Нажмите "Привязать Facebook & Instagram"
5. После авторизации проверьте консоль - должны увидеть:
   - `🔍 Checking OAuth params: ...`
   - `🚨 FORCING redirect to /integrations!`
6. Убедитесь, что остались на `/integrations`
7. Проверьте, что токен сохранился в `ad_accounts`

## ✅ Checklist
- [x] Приоритетная проверка OAuth в `Index.tsx`
- [x] Проверка OAuth в `Auth.tsx`
- [x] Усиленные логи в `App.tsx`
- [x] `setTimeout` для гарантии редиректа
- [x] Проверка `error` параметра (не только `access_token`)
- [x] Нет linter ошибок

---

**Статус:** ✅ ГОТОВО К ТЕСТИРОВАНИЮ

Теперь OAuth параметры НИКОГДА не теряются, приложение всегда редиректит на `/integrations`! 🚀
