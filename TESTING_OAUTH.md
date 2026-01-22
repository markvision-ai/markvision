# 🧪 Тестирование Facebook OAuth

## 🚀 Быстрый тест

### Подготовка:
1. Откройте консоль браузера (F12)
2. Перейдите на вкладку **Console**

### Тест 1: Успешное подключение
1. Откройте `https://markvision-alpha.vercel.app/integrations`
2. Нажмите **"Привязать Facebook & Instagram"**
3. Авторизуйтесь на Facebook
4. После редиректа проверьте консоль:

**Ожидаемые логи:**
```
🔄 OAuth params detected, redirecting to /integrations
🔐 Auth event: SIGNED_IN
👤 Session: { user: {...}, provider_token: 'EAABwz...', ... }
✅ SIGNED_IN with OAuth params, redirecting to /integrations
🎫 Provider token found: EAABwz...
🔍 AuthProvider Session: { ... }
🎫 Provider Token: FOUND ✅
🔄 Refresh Token: FOUND ✅
📱 Facebook OAuth успешен, сохраняем токен...
```

**Ожидаемый результат:**
- ✅ Toast: "Facebook & Instagram подключены! 🎉"
- ✅ Кнопка меняется на "Отключить"
- ✅ Badge: "Активно" (зеленый)

---

### Тест 2: Обработка ошибки
1. Если OAuth настроен неправильно, получите ошибку
2. Проверьте консоль:

**Ожидаемые логи:**
```
🔐 Auth event: ...
🎫 Provider Token: NOT FOUND ❌
```

**Ожидаемый результат:**
- ❌ Toast с текстом ошибки (например, "Error getting user email")
- ✅ Остаетесь на `/integrations`
- ✅ Можете попробовать снова

---

### Тест 3: Редирект авторизованного пользователя
1. Авторизуйтесь в системе
2. Откройте `https://markvision-alpha.vercel.app/`
3. Проверьте, что вас **сразу** перебросило в Dashboard

**Ожидаемый результат:**
- ✅ Открывается Dashboard, НЕ лендинг
- ✅ Видны KPI карточки, графики
- ✅ В URL остается `/` (или `/dashboard`)

---

### Тест 4: Размеры шрифтов
1. Откройте Dashboard на Vercel
2. Проверьте KPI карточки (вверху)
3. Убедитесь, что цифры **НЕ обрезаются**

**Ожидаемый результат:**
- ✅ Все цифры видны полностью
- ✅ Нет `...` (многоточия)
- ✅ Символ `₸` на той же строке, что и число

---

## 🐛 Что проверять в консоли

| Сообщение | Значение |
|-----------|----------|
| `🔄 OAuth params detected` | OAuth параметры найдены в URL |
| `🔐 Auth event: SIGNED_IN` | Успешная авторизация |
| `🎫 Provider Token: FOUND ✅` | Токен Facebook получен |
| `🎫 Provider Token: NOT FOUND ❌` | Токен НЕ получен (проблема) |
| `📱 Facebook OAuth успешен` | Токен сохраняется в БД |

---

## 📋 Checklist

- [ ] OAuth редиректит на `/integrations`
- [ ] В консоли видны логи с эмодзи
- [ ] `provider_token` найден (`FOUND ✅`)
- [ ] Toast показывается при успехе/ошибке
- [ ] Авторизованные пользователи редиректятся на Dashboard
- [ ] Шрифты на Dashboard не обрезаются

---

## 🔧 Если что-то не работает

### Проблема: Токен не найден (`NOT FOUND ❌`)
**Решение:**
1. Проверьте Supabase Dashboard → Authentication → Providers
2. Убедитесь, что Facebook Provider включен
3. Проверьте Client ID и Client Secret
4. Убедитесь, что в Redirect URLs добавлен `https://markvision-alpha.vercel.app/integrations`

### Проблема: Редирект не работает
**Решение:**
1. Очистите кеш браузера
2. Проверьте Network вкладку в консоли
3. Убедитесь, что в URL есть параметры OAuth

### Проблема: Шрифты обрезаются
**Решение:**
1. Проверьте, что изменения задеплоены на Vercel
2. Очистите кеш браузера (Ctrl+Shift+R)
3. Проверьте CSS в DevTools

---

**Готово!** Следуйте этим шагам для тестирования OAuth 🎉
