# 🚀 ГОТОВО: Можно подключать Facebook!

## ✅ Все настроено и готово

### Что сделано:
1. ✅ Supabase client настроен правильно (`detectSessionInUrl: true`)
2. ✅ `redirectTo` → `https://markvision-alpha.vercel.app/integrations`
3. ✅ Обработка user без email (используется `user.id`)
4. ✅ Сохранение в проект `64c94e87-630c-470e-8ab1-8f7c8c835efa`
5. ✅ Обработка ошибок через `toast.error` (остаемся на странице)
6. ✅ Детальные логи для отладки

---

## 🎯 Сейчас нажмите кнопку!

1. Откройте консоль: **F12**
2. Перейдите на: `https://markvision-alpha.vercel.app/integrations`
3. Нажмите: **"Привязать Facebook & Instagram"**
4. Авторизуйтесь на Facebook
5. Вернитесь на сайт

---

## 📊 Что вы увидите в консоли:

```
🔗 OAuth redirect URL: https://markvision-alpha.vercel.app/integrations
🔍 Checking OAuth params: { hasAccessToken: true, ... }
🔍 AuthProvider Session: { ... }
👤 User: { id: "...", ... }
🆔 User ID: abc-123-def-456
🎫 Provider Token: FOUND ✅
📱 Facebook OAuth успешен, сохраняем токен...
💾 Saving to project: 64c94e87-630c-470e-8ab1-8f7c8c835efa
✅ Token saved successfully!
```

**И увидите Toast:**
```
✅ Facebook & Instagram подключены! 🎉
```

---

## 🐛 Если возникнет ошибка:

Вы увидите:
```
❌ Error: [текст ошибки]
```

**И Toast:**
```
❌ [Описание ошибки]
Попробуйте еще раз или обратитесь в поддержку
```

**Важно:** Вы останетесь на `/integrations` и сможете попробовать снова!

---

## 🔍 После подключения проверьте:

1. **Интерфейс:**
   - Кнопка изменилась на "Отключить"
   - Badge показывает "Активно" (зеленый)

2. **База данных (Supabase):**
   - Откройте таблицу `ad_accounts`
   - Найдите запись с `project_id = 64c94e87-630c-470e-8ab1-8f7c8c835efa`
   - Проверьте, что `access_token` заполнен
   - Проверьте `status = 'active'`

---

**ВСЁ ГОТОВО! НАЖИМАЙТЕ КНОПКУ! 🚀**
