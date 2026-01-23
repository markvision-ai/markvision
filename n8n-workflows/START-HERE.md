# 🚀 START HERE - Facebook Sync для MarkVision

> **Полная система автоматической синхронизации Facebook Ads → Supabase**

---

## 📚 Навигация по документации

Выберите подходящий файл в зависимости от вашей задачи:

### 🎯 Хочу быстро настроить (5 минут)
→ **[QUICK-START.md](QUICK-START.md)**
- ✅ Чек-лист из 7 шагов
- Команды для копирования
- Быстрая проверка

### 📖 Хочу понять как это работает
→ **[VISUAL-GUIDE.md](VISUAL-GUIDE.md)**
- 🎨 Визуальные схемы
- Сценарии работы
- Data flow диаграммы
- Объяснение концепций

### 🔧 Нужна полная документация
→ **[README.md](README.md)**
- Детальные инструкции
- Troubleshooting
- Все настройки
- FAQ

### 📊 Хочу увидеть что изменилось
→ **[CHANGES.md](CHANGES.md)**
- Сравнение v1 vs v2
- Список исправлений
- Таблицы улучшений
- Roadmap

### 🧪 Нужно протестировать
→ **[test-data.sql](test-data.sql)**
- 14 блоков SQL запросов
- Валидация данных
- Мониторинг
- Troubleshooting queries

### 📦 Общая информация
→ **[SUMMARY.md](SUMMARY.md)**
- Полный обзор проекта
- Архитектура
- Метрики качества
- Список всех файлов

---

## ⚡ Быстрый старт (TL;DR)

```bash
# 1️⃣ Миграция БД (1 мин)
cd /Users/urijzapojnov/MarkVision\ AI\ код/markvision
supabase db push

# 2️⃣ Импорт в N8N (1 мин)
# Откройте n8n → Import → выберите facebook-sync-improved.json

# 3️⃣ Credentials (2 мин)
# Facebook Token: https://developers.facebook.com/tools/explorer/
# Supabase: Service Role Key из вашего проекта

# 4️⃣ Тест (30 сек)
# Execute Workflow → проверьте результат

# 5️⃣ Активация (10 сек)
# Toggle ON → готово!
```

**Итого: 5 минут до работающей системы** ⏱️

---

## 🎯 Что вы получите

### Автоматически каждый час:
```
Facebook Ads → N8N → Supabase → MarkVision Dashboard
```

### Метрики (7 штук):
- 💰 Spend (расходы)
- 👁️ Impressions (показы)
- 🖱️ Clicks (клики)
- 👥 Reach (охват)
- 📊 CTR (кликабельность %)
- 💵 CPC (цена клика)
- 💵 CPM (цена 1000 показов)

### Функции:
- ✅ Auto Create/Update (без дубликатов)
- ✅ Error Handling (не падает при ошибках)
- ✅ Полное логирование
- ✅ Безопасное хранение токенов
- ✅ SQL функции для аналитики

---

## 📁 Структура проекта

```
n8n-workflows/
│
├── 📄 START-HERE.md              ← Вы здесь
│
├── 🚀 QUICK-START.md             ← Быстрая настройка
├── 🎨 VISUAL-GUIDE.md            ← Визуальное объяснение
├── 📖 README.md                  ← Полная документация
├── 📊 CHANGES.md                 ← Changelog v1→v2
├── 📦 SUMMARY.md                 ← Общий обзор
│
├── 🔧 facebook-sync-improved.json ← Main workflow (импортируйте это)
└── 🧪 test-data.sql              ← SQL для тестирования

../supabase/migrations/
└── 20260123000000_add_facebook_metrics.sql ← Миграция БД
```

---

## 🛠️ Что было исправлено

| Проблема | Статус |
|----------|--------|
| 🔴 Token в открытом виде | ✅ Fixed: credentials |
| 🔴 Update не работает | ✅ Fixed: добавлен Merge узел |
| 🔴 Фильтр Supabase неверный | ✅ Fixed: правильный формат |
| 🟡 Нет обработки ошибок | ✅ Added: Error Handler |
| 🟡 Мало метрик (3) | ✅ Expanded: 7 метрик |
| 🟡 Старый API v19 | ✅ Updated: v21 |
| 🟡 Нет документации | ✅ Created: 7 файлов |

---

## 🎓 Уровни сложности

### Новичок? 🟢
1. Читайте **VISUAL-GUIDE.md** - поймете концепции
2. Следуйте **QUICK-START.md** - настроите за 5 минут
3. Используйте **test-data.sql** - проверите работу

### Продвинутый? 🟡
1. Изучите **CHANGES.md** - поймете архитектуру
2. Читайте **README.md** - узнаете все детали
3. Кастомизируйте workflow под свои нужды

### Эксперт? 🔴
1. Клонируйте workflow для Google Ads
2. Добавьте webhooks для real-time sync
3. Интегрируйте уведомления Slack/Telegram
4. Создайте campaign-level детализацию

---

## ⚠️ Важные моменты

### Безопасность:
- ❌ **НЕ коммитьте** `facebook-sync-improved.json` с реальными credentials
- ✅ **Используйте** n8n credentials систему
- ✅ **Храните** токены в Environment Variables

### Токен Facebook:
- ⏰ Обновляется каждые **60 дней**
- 🔄 Используйте **Long-Lived Token**
- 📱 Настройте напоминание для обновления

### Supabase:
- 🔑 Используйте **Service Role Key** (не anon key)
- 📊 Проверяйте **RLS policies** если они есть
- 💾 Делайте бэкапы перед миграциями

---

## 🧪 Тестирование

### Проверка 1: Workflow работает?
```bash
# В n8n: Execute Workflow
# Должны увидеть зеленые галочки на всех узлах
```

### Проверка 2: Данные в Supabase?
```sql
SELECT * FROM marketing_stats 
WHERE date = CURRENT_DATE 
AND source = 'facebook_ads';
```

### Проверка 3: View работает?
```sql
SELECT * FROM facebook_stats_daily LIMIT 5;
```

### Проверка 4: Функция работает?
```sql
SELECT * FROM check_facebook_sync_health('64c94e87-630c-470e-8ab1-8f7c8c835efa');
```

Все 4 теста прошли? **🎉 Готово к продакшену!**

---

## 🆘 Проблемы?

### "Invalid access token"
→ Token истек. Получите новый: https://developers.facebook.com/tools/explorer/

### "Column does not exist"
→ Запустите миграцию: `supabase db push`

### "Permission denied"
→ Проверьте Service Role Key в credentials

### "No data"
→ Нормально для свежих кампаний. Используйте `date_preset: "yesterday"` для теста

**Полный troubleshooting:** [README.md → Troubleshooting](README.md#-troubleshooting)

---

## 📞 Поддержка

**Вопросы?** Проверьте файлы в таком порядке:
1. QUICK-START.md → Частые ошибки
2. README.md → Troubleshooting
3. test-data.sql → SQL для диагностики
4. VISUAL-GUIDE.md → Понимание как работает

---

## 🎯 Следующие шаги

После настройки Facebook Sync:

- [ ] Создайте дашборд в AnalyticsPlatform
- [ ] Настройте алерты на превышение бюджета
- [ ] Добавьте Google Ads (клонируйте workflow)
- [ ] Настройте webhook для ручной синхронизации
- [ ] Добавьте Slack уведомления
- [ ] Создайте недельные/месячные отчеты

---

## 📊 Метрики проекта

| Параметр | Значение |
|----------|----------|
| **Файлов создано** | 8 |
| **Строк кода** | 1500+ |
| **Время настройки** | 5 минут |
| **Метрик FB** | 7 |
| **Узлов N8N** | 10 |
| **SQL запросов** | 14 |
| **Готовность** | ✅ Production |

---

## 🎉 Готовы начать?

### Путь А: Быстро (5 минут)
```
START-HERE.md → QUICK-START.md → Готово!
```

### Путь Б: С пониманием (15 минут)
```
START-HERE.md → VISUAL-GUIDE.md → QUICK-START.md → Готово!
```

### Путь В: Полное погружение (1 час)
```
START-HERE.md → VISUAL-GUIDE.md → README.md → CHANGES.md → 
test-data.sql → Кастомизация → Готово!
```

---

<div align="center">

**🚀 Выберите свой путь и начинайте!**

---

*Создано для MarkVision AI*  
*Версия 2.0.0 • Январь 2026*

</div>
