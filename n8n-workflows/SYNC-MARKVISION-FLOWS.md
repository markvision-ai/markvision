# sync-markvision-flows — получение действующих связок из n8n

Кнопка **«Обновить»** в разделе **Автоматизация → Актуальные связки** вызывает webhook:

- **URL:** `https://n8n.zapoinov.com/webhook/sync-markvision-flows`
- **Метод:** POST  
- **Тело:** `{ "project_id": "<uuid проекта>" }`

Workflow должен:

1. Принять POST, взять `project_id` из тела.
2. Запросить в n8n список **активных** workflow (GET n8n API).
3. Для каждого workflow подготовить строку для `automation_flows`:  
   `project_id`, `flow_name` (= имя воркфлоу), `n8n_id` (= id в n8n), при возможности `webhook_url`, `status`, `last_seen`.
4. Сделать upsert в Supabase в таблицу `automation_flows` (по `project_id` + `name` или `n8n_id`).
5. Вернуть **200** (пустое тело или JSON — по желанию).

После этого фронт делает refetch из `automation_flows` и показывает обновлённый список в **«Актуальные связки»**.

---

## n8n API — список workflow

- **GET** `https://<твой-n8n>/api/v1/workflows?active=true`  
- Заголовок: `X-N8N-API-KEY: <ключ>`  
- В ответе — массив `{ id, name, active, ... }`.  
Используй `id` как `n8n_id`, `name` как `flow_name`. При наличии Webhook-нод — их production URL как `webhook_url`.

---

## Supabase: `automation_flows`

Колонки, которые использует фронт:  
`id`, `project_id`, `flow_name`, `status`, `last_seen`, `execution_time`, `n8n_id`, `webhook_url`.

Upsert по уникальному ограничению `(project_id, name)` или по `(project_id, n8n_id)` — в зависимости от твоей схемы.

---

## Чек-лист

- [ ] В n8n есть workflow с Webhook path **sync-markvision-flows**.
- [ ] Webhook принимает POST, читает `project_id`.
- [ ] Есть HTTP Request к n8n API (GET workflows, `active=true`), с `X-N8N-API-KEY`.
- [ ] Результат маппится в строки для `automation_flows` и upsert в Supabase.
- [ ] Workflow возвращает 200.
- [ ] Workflow **активирован** (Active = ON).

После этого кнопка **«Обновить»** будет забирать действующие связки из n8n и выводить их в **«Актуальные связки»**.
