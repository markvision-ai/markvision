# 🧪 Как протестировать OAuth исправление

## Перед тестированием:
1. **Очистите кеш браузера:** `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
2. **Откройте консоль:** `F12` → вкладка **Console**

---

## Шаг 1: Открыть интеграции
```
https://markvision-alpha.vercel.app/integrations
```
или локально:
```
http://localhost:8080/integrations
```

---

## Шаг 2: Нажать кнопку подключения
Нажмите **"Привязать Facebook & Instagram"**

---

## Шаг 3: Авторизоваться на Facebook
1. Откроется страница Facebook
2. Войдите в свой аккаунт
3. Подтвердите разрешения

---

## Шаг 4: Проверить консоль после редиректа

### ✅ Правильные логи (УСПЕХ):
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
🔍 AuthProvider Session: { ... }
🎫 Provider Token: FOUND ✅
📱 Facebook OAuth успешен, сохраняем токен...
```

### ❌ Неправильные логи (ОШИБКА):
```
🔍 Checking OAuth params: {
  pathname: "/",
  hasAccessToken: false,
  ...
}
```

---

## Шаг 5: Проверить результат

### ✅ Успех:
- [ ] Остались на странице `/integrations`
- [ ] Увидели Toast: "Facebook & Instagram подключены! 🎉"
- [ ] Кнопка изменилась на "Отключить"
- [ ] Badge показывает "Активно" (зеленый)

### ❌ Ошибка:
- [ ] Редирект на главную `/`
- [ ] Нет Toast уведомления
- [ ] Кнопка осталась "Привязать"

---

## Шаг 6: Проверить БД (опционально)

Откройте Supabase Dashboard:
1. Перейдите в таблицу `ad_accounts`
2. Найдите запись с `platform = 'facebook'`
3. Убедитесь, что `access_token` НЕ пустой
4. Проверьте `status = 'active'`

---

## 🐛 Если что-то не работает

### Проблема: Редирект на главную
**Решение:**
1. Проверьте консоль - должны быть логи `🚨 FORCING redirect`
2. Если логов нет - проверьте, что код задеплоен
3. Очистите кеш: `Ctrl+Shift+R`

### Проблема: Токен не найден (`NOT FOUND ❌`)
**Решение:**
1. Проверьте Supabase Dashboard → Authentication → Providers
2. Убедитесь, что Facebook Provider **включен**
3. Проверьте Client ID и Client Secret
4. Проверьте Redirect URLs

### Проблема: Ошибка в консоли
**Решение:**
1. Скопируйте текст ошибки
2. Проверьте, что все таблицы созданы (`ad_accounts`, `integrations`)
3. Проверьте RLS policies

---

## 📋 Быстрый чеклист

Перед тестированием убедитесь:
- [ ] Код задеплоен на Vercel
- [ ] В Supabase добавлен Redirect URL: `https://markvision-alpha.vercel.app/integrations`
- [ ] Facebook Provider включен в Supabase
- [ ] Таблица `ad_accounts` создана
- [ ] RLS policies настроены

Во время тестирования:
- [ ] Консоль открыта (F12)
- [ ] Кеш очищен (Ctrl+Shift+R)
- [ ] Видны логи с эмодзи (🔍, 🚨, 🎫)
- [ ] Остались на `/integrations` после редиректа
- [ ] Токен найден (`FOUND ✅`)

---

**Готово!** Если все пункты чеклиста пройдены ✅, OAuth работает корректно! 🎉
