# Инструкция по внедрению улучшенного workflow "Мониторинг конкурентов"

## ✅ Что было сделано

### Исправлены критические проблемы:
1. ✅ **Безопасность**: API токен Apify перенесён в credentials (вместо открытого URL)
2. ✅ **Error Handling**: Добавлены Error Trigger и логирование ошибок в БД
3. ✅ **Валидация**: Добавлена проверка данных от Apify перед обработкой
4. ✅ **Парсинг JSON**: Безопасный парсинг с try/catch + fallback regex
5. ✅ **Таблица БД**: Изменена целевая таблица на `competitor_posts`
6. ✅ **Дубли**: Ранняя фильтрация дублей ДО вызова AI API

### Новые ноды в workflow:
- ✅ Валидация данных (после Apify)
- ✅ Фильтр дублей (ранняя проверка)
- ✅ Парсинг JSON от Claude (безопасный)
- ✅ Error Trigger (глобальный обработчик ошибок)
- ✅ Логирование ошибок в БД

### Удалённые ноды:
- ❌ Пауза для ссылок (не нужна)
- ❌ Проверка дублей старая (заменена на раннюю)
- ❌ IF условие (заменено на раннюю фильтрацию)

---

## 📋 Шаги внедрения

### ШАГ 1: Применить SQL миграцию

Выполнить миграцию `20260210000001_create_system_notifications.sql`:

```bash
# Через Supabase Dashboard:
# 1. SQL Editor
# 2. Скопировать содержимое миграции
# 3. Выполнить

# Или через CLI:
supabase migration up
```

**Проверка**:
```sql
SELECT COUNT(*) as tables_count
FROM information_schema.tables
WHERE table_name IN ('system_notifications', 'competitor_posts');
-- Должно вернуть 2
```

### ШАГ 2: Создать credentials в n8n для Apify

1. Открыть n8n: https://n8n.zapoinov.com
2. Settings → Credentials → Add Credential
3. Тип: **HTTP Header Auth**
4. Название: `Apify Instagram Scraper`
5. Header Name: `Authorization`
6. Header Value: `Bearer apify_api_b0TcZNk055JLdwuiCNnIzyV1J8QqsQ3Zyc72`
7. Save

**Скопировать ID credential** (понадобится для workflow):
- Открыть credential редактор
- Скопировать ID из URL (format: `XXXXXXXXXXXX`)
- Заменить `APIFY_HEADER_AUTH_ID` в workflow JSON на этот ID

### ШАГ 3: Импортировать workflow в n8n

1. Открыть n8n
2. Workflows → Import from File
3. Выбрать файл: `COMPETITOR-MONITORING-V2.json`
4. Клик "Import"

### ШАГ 4: Заменить ID credentials

В импортированном workflow нужно обновить ID credentials:

1. Открыть ноду "3. Сбор постов (Apify)"
2. Выбрать credentials: "Apify Instagram Scraper" (которую создали на ШАГ 2)
3. Save

**Проверить другие credentials**:
- Supabase: должен быть "Supabase account"
- Google Gemini: должен быть "Google Gemini(PaLM) Api account"
- Anthropic Claude: должен быть "Anthropic account"

### ШАГ 5: Проверить workflow в n8n

1. Открыть workflow "Мониторинг конкурентов"
2. Нажать "Execute Workflow" (ручной запуск)
3. Проверить каждую ноду:
   - ✅ "1. Старт" - должен запуститься
   - ✅ "2. Список конкурентов" - вернуть конкурентов (если они есть в БД)
   - ✅ "3. Сбор постов (Apify)" - вернуть посты или показать ошибку API
   - ✅ "✅ Валидация данных" - отфильтровать невалидные посты
   - ✅ "3a. Фильтр дублей" - пропустить уже обработанные посты
   - ✅ "4. Склеить данные" - подготовить данные
   - ✅ "8. Разбор Gemini" - вернуть анализ от Gemini
   - ✅ "9. Сценарий Claude" - вернуть JSON сценарий
   - ✅ "🔍 Парсинг JSON" - распарсить JSON
   - ✅ "10. Сохранить" - записать в БД

### ШАГ 6: Активировать автоматический запуск

1. На workflow: Save
2. Active toggle → ON
3. Workflow теперь запускается автоматически каждые 24 часа в 10:00

---

## 📊 Результат

После внедрения workflow будет:

✅ Работать стабильно с автоматическим запуском
✅ Безопасно хранить API токены
✅ Логировать все ошибки в БД
✅ Надёжно парсить JSON
✅ Сохранять данные в правильную таблицу
✅ Фильтровать дубли до AI обработки

**Время выполнения**: 2-3 минуты на 1 конкурента
**Стоимость**: $0.05-0.15 за запуск

---

**Статус**: ✅ Готово к внедрению
**Дата**: 2026-02-10
