# Интеграция Heartbeat в рабочие процессы n8n

## Общая структура для каждого рабочего процесса

### Шаблон для добавления в КОНЕЦ каждого workflow:

```json
{
  "parameters": {
    "operation": "update",
    "schema": "public",
    "table": "automation_flows",
    "updateKey": "name",
    "updateKeyValue": "НАЗВАНИЕ_ВАШЕГО_РОБОТА",
    "dataMode": "manual",
    "manualConfigData": {
      "columns": [
        {
          "column": "status",
          "value": "active"
        },
        {
          "column": "last_run",
          "value": "={{ $now }}"
        },
        {
          "column": "execution_time",
          "value": "={{ $execution.duration }}"
        }
      ]
    }
  },
  "id": "supabase-success-ВАШ_РОБОТ",
  "name": "💾 Успешное выполнение",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [ПОЗИЦИЯ_X, ПОЗИЦИЯ_Y],
  "credentials": {
    "supabaseApi": {
      "id": "your-supabase-credential-id",
      "name": "Supabase API"
    }
  }
}
```

```json
{
  "parameters": {
    "errorMessage": "={{ $json.error || $json.message || 'Ошибка выполнения' }}"
  },
  "id": "error-trigger-ВАШ_РОБОТ",
  "name": "❌ Ошибка выполнения",
  "type": "n8n-nodes-base.errorTrigger",
  "typeVersion": 1,
  "position": [ПОЗИЦИЯ_X, ПОЗИЦИЯ_Y + 200]
}
```

```json
{
  "parameters": {
    "operation": "update",
    "schema": "public",
    "table": "automation_flows",
    "updateKey": "name",
    "updateKeyValue": "НАЗВАНИЕ_ВАШЕГО_РОБОТА",
    "dataMode": "manual",
    "manualConfigData": {
      "columns": [
        {
          "column": "status",
          "value": "error"
        },
        {
          "column": "last_run",
          "value": "={{ $now }}"
        },
        {
          "column": "logs",
          "value": "={{ $json.error || $json.message || 'Неизвестная ошибка' }}"
        }
      ]
    }
  },
  "id": "supabase-error-ВАШ_РОБОТ",
  "name": "💾 Запись ошибки",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [ПОЗИЦИЯ_X + 220, ПОЗИЦИЯ_Y + 200],
  "credentials": {
    "supabaseApi": {
      "id": "your-supabase-credential-id",
      "name": "Supabase API"
    }
  }
}
```

## Пример интеграции в существующий workflow

### Для workflow "Facebook Ads Sync":

```json
// ДОБАВИТЬ В КОНЕЦ ОСНОВНОГО ПОТОКА:
{
  "parameters": {
    "operation": "update",
    "schema": "public",
    "table": "automation_flows",
    "updateKey": "name",
    "updateKeyValue": "Facebook Ads Sync",
    "dataMode": "manual",
    "manualConfigData": {
      "columns": [
        {
          "column": "status",
          "value": "active"
        },
        {
          "column": "last_run",
          "value": "={{ $now }}"
        },
        {
          "column": "execution_time",
          "value": "={{ $execution.duration }}"
        }
      ]
    }
  },
  "id": "supabase-facebook-success",
  "name": "💾 Facebook Ads Sync - OK",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1200, 300],
  "credentials": {
    "supabaseApi": {
      "id": "your-supabase-credential-id",
      "name": "Supabase API"
    }
  }
},

// ДОБАВИТЬ ERROR TRIGGER:
{
  "parameters": {
    "errorMessage": "={{ $json.error || $json.message || 'Ошибка Facebook Ads' }}"
  },
  "id": "error-facebook-ads",
  "name": "❌ Ошибка Facebook Ads",
  "type": "n8n-nodes-base.errorTrigger",
  "typeVersion": 1,
  "position": [800, 500]
},

// ДОБАВИТЬ ОБРАБОТКУ ОШИБКИ:
{
  "parameters": {
    "operation": "update",
    "schema": "public",
    "table": "automation_flows",
    "updateKey": "name",
    "updateKeyValue": "Facebook Ads Sync",
    "dataMode": "manual",
    "manualConfigData": {
      "columns": [
        {
          "column": "status",
          "value": "error"
        },
        {
          "column": "last_run",
          "value": "={{ $now }}"
        },
        {
          "column": "logs",
          "value": "={{ $json.error || $json.message || 'Ошибка Facebook Ads Sync' }}"
        }
      ]
    }
  },
  "id": "supabase-facebook-error",
  "name": "💾 Facebook Ads Sync - Error",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1020, 500],
  "credentials": {
    "supabaseApi": {
      "id": "your-supabase-credential-id",
      "name": "Supabase API"
    }
  }
}
```

## Connections для Facebook Ads workflow:

```json
"connections": {
  // ... существующие connections ...

  // ДОБАВИТЬ:
  "❌ Ошибка Facebook Ads": {
    "main": [
      [
        {
          "node": "💾 Facebook Ads Sync - Error",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

## Список всех рабочих процессов для интеграции:

1. **Facebook Ads Sync** - `flow_name: "Facebook Ads Sync"`
2. **Instagram Content Intelligence** - `flow_name: "Instagram Content Intelligence"`
3. **Content Production Stats** - `flow_name: "Content Production Stats"`

## Проверка работы:

После добавления в каждый workflow, в таблице `automation_flows` будут отображаться:
- `status`: "active" при успешном выполнении
- `status`: "error" при ошибке
- `last_run`: время последнего запуска
- `execution_time`: длительность выполнения (мс)
- `logs`: текст ошибки при падении

## Мониторинг:

В интерфейсе интеграций (n8n Automation Hub) будет видно:
- Зеленый статус для активных роботов
- Красный статус для упавших
- Время последнего запуска
- Длительность выполнения