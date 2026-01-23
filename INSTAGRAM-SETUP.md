# 📸 НАСТРОЙКА INSTAGRAM BUSINESS

## ❗ ПОЧЕМУ INSTAGRAM НЕ ПОДКЛЮЧАЕТСЯ?

Instagram Business API требует:
1. ✅ Facebook Page (бизнес-страница)
2. ✅ Instagram Business аккаунт **привязан** к этой Page
3. ✅ Права администратора на Page

---

## 🔧 ПОШАГОВАЯ НАСТРОЙКА

### ШАГ 1: Привязать Instagram к Facebook Page

1. Открой **Facebook Business Manager** → **Настройки**
2. **Instagram аккаунты** → **Добавить**
3. Войди в Instagram аккаунт
4. **Привяжи** Instagram к Facebook Page:
   - Открой настройки Instagram
   - **Связанные аккаунты** → **Facebook**
   - Выбери свою Page

### ШАГ 2: Проверить тип аккаунта Instagram

Instagram аккаунт должен быть **Business** или **Creator**, НЕ личный:

1. Открой Instagram → **Настройки**
2. **Аккаунт** → **Переключиться на профессиональный аккаунт**
3. Выбери **Бизнес** (рекомендуется)

### ШАГ 3: Получить Page ID

Открой **Graph API Explorer** и выполни:

```
GET /me/accounts?fields=id,name,instagram_business_account
```

**Пример ответа:**
```json
{
  "data": [
    {
      "id": "123456789012345",
      "name": "Стоматология Уали",
      "instagram_business_account": {
        "id": "17841400001234567"
      }
    }
  ]
}
```

Сохрани:
- `page_id`: `123456789012345`
- `instagram_business_account.id`: `17841400001234567`

---

## 📊 ОБНОВИТЬ SUPABASE

Добавь Instagram аккаунт в базу:

```sql
-- Добавляем Page ID
INSERT INTO ad_accounts (
  project_id,
  platform,
  external_id,
  access_token,
  status
) VALUES (
  '64c94e87-630c-470e-8ab1-8f7c8c835efa',
  'facebook_page',
  '123456789012345', -- твой page_id
  'EAAT8DcsZBww8BQuZA1cWLWN4TzMVGd6E8cNK5jexC6O2BE12sBs8dPuFmZBFPhPJEMcw9Y7Dz6ZBbOPqSsnYm2o408swDmIZAQxpZAJTaJNz4YN2CSWQEA15LuF8g84EgEbnbPmXOBGQGHBSUekvOxyLDlsW8eSyOZCWWPf9bWQWW8UBfJdQbrpxp8OuWSZBaZAwIeAs33UfZA4exxlCnTufzCqGz5XVyKPJZBzbqI77eNnn51lZCscr3UtpvYNoWECUknPpWnza9CjYL2tEYgorJGTU',
  'active'
)
ON CONFLICT (project_id, platform, external_id) 
DO UPDATE SET 
  access_token = EXCLUDED.access_token,
  status = 'active';

-- Добавляем Instagram Business аккаунт
INSERT INTO ad_accounts (
  project_id,
  platform,
  external_id,
  access_token,
  status
) VALUES (
  '64c94e87-630c-470e-8ab1-8f7c8c835efa',
  'instagram',
  '17841400001234567', -- твой instagram_business_account.id
  'EAAT8DcsZBww8BQuZA1cWLWN4TzMVGd6E8cNK5jexC6O2BE12sBs8dPuFmZBFPhPJEMcw9Y7Dz6ZBbOPqSsnYm2o408swDmIZAQxpZAJTaJNz4YN2CSWQEA15LuF8g84EgEbnbPmXOBGQGHBSUekvOxyLDlsW8eSyOZCWWPf9bWQWW8UBfJdQbrpxp8OuWSZBaZAwIeAs33UfZA4exxlCnTufzCqGz5XVyKPJZBzbqI77eNnn51lZCscr3UtpvYNoWECUknPpWnza9CjYL2tEYgorJGTU',
  'active'
)
ON CONFLICT (project_id, platform, external_id) 
DO UPDATE SET 
  access_token = EXCLUDED.access_token,
  status = 'active';
```

---

## 🔄 N8N WORKFLOW ДЛЯ INSTAGRAM

Создай новый workflow `instagram-sync-daily.json`:

```json
{
  "name": "Instagram_Daily_Stats",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "cronExpression", "expression": "0 10 * * *"}]
        }
      },
      "name": "Every Day 10 AM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [240, 300]
    },
    {
      "parameters": {
        "method": "GET",
        "url": "=https://graph.facebook.com/v21.0/17841400001234567/insights",
        "sendQuery": true,
        "queryParameters": {
          "parameters": [
            {
              "name": "access_token",
              "value": "ТВОЙ_ТОКЕН"
            },
            {
              "name": "metric",
              "value": "impressions,reach,profile_views,follower_count,website_clicks"
            },
            {
              "name": "period",
              "value": "day"
            }
          ]
        }
      },
      "name": "Get Instagram Stats",
      "type": "n8n-nodes-base.httpRequest",
      "position": [460, 300]
    }
  ]
}
```

---

## ✅ ПРОВЕРКА

После настройки:

1. **Обнови страницу** в MarkVision
2. **Интеграции** → должно появиться:
   - ✅ Facebook & Instagram (Активно)
   - ✅ Instagram Business (Подключено)
3. **Посты** и **Stories** начнут подгружаться

---

## 📞 TROUBLESHOOTING

### "Found pages: 0"

**Причина:** Токен не имеет доступа к Pages

**Решение:**
```
Graph API Explorer → Get Token → выбери разрешения:
- pages_show_list
- pages_read_engagement
- instagram_basic
- instagram_manage_insights
```

### "Instagram Business аккаунт не найден"

**Причина:** Instagram не привязан к Page

**Решение:**
1. Instagram → Настройки → Аккаунт
2. **Связанные аккаунты** → Facebook
3. Привяжи к своей Page

---

**Создано:** 2026-01-23  
**Проект:** MarkVision AI
