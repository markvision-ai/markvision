# Автоматическое создание видеоконтента через kie.ai

kie.ai — агрегатор видеомоделей (Veo, Sora, Runway, Kling и другие) с одним API.
Подключён по той же схеме, что остальные внешние AI-сервисы: ключ в секретах
Supabase, браузер его не видит.

## Как устроен конвейер

```
бриф (продукт, ЦА, крючок, CTA, площадка)
  └─ videoContentPipeline.buildVideoPrompt   промпт по осям кадра
      └─ kieVideoService.createVideoTask
          └─ edge kie-video → api.kie.ai/api/v1/jobs/createTask
              ↓ (минуты)
          kie.ai дёргает callBackUrl
              └─ edge kie-video-callback
                  ├─ перекладывает ролик в бакет generated-videos
                  ├─ пишет video_url в content_factory
                  └─ отдаёт в автопостинг (если autoPublish)
```

Клиенту ждать не нужно: он ставит задачу и уходит. Всё остальное доделывают
edge-функции. Поллинг остался как запасной путь на случай, если колбэк не
настроен или не дошёл.

## Настройка

1. Ключ — на https://kie.ai/api-key. Там же включите IP whitelist и лимиты на ключ.
2. Supabase Dashboard → Edge Functions → Secrets:

   | Секрет | Обязателен | Зачем |
   |---|---|---|
   | `KIE_API_KEY` | да | ключ kie.ai |
   | `KIE_CALLBACK_URL` | нет | публичный адрес `kie-video-callback` |
   | `KIE_CALLBACK_SECRET` | нет | закрывает колбэк от посторонних |
   | `PUBLISH_WEBHOOK_URL` | нет | вебхук автопостинга `publishing-video-ready` |
   | `PUBLISH_WEBHOOK_KEY` | нет | его заголовок `x-publish-key` |

3. Миграция и деплой:

```bash
supabase db push
supabase functions deploy kie-video
supabase functions deploy kie-video-callback
```

Переменной `VITE_KIE_API_KEY` быть не должно: префикс `VITE_` попадает в бандл
и отдаёт ключ всем посетителям сайта.

## Использование

Одна задача по брифу:

```ts
import { createFromBrief } from '@/services/videoContentPipeline';

const task = await createFromBrief({
  product: 'Ортопедические матрасы',
  audience: 'женщины 30-45, болит спина по утрам',
  hook: 'просыпаешься разбитой',
  cta: 'запишись на подбор',
  platform: 'reels',
  mood: 'тёплое утро, свет из окна',
  projectId,
}, { autoPublish: true });
```

Пачка брифов — конвейер сам разложит их по лимиту kie.ai:

```ts
const { created, failed } = await runContentPipeline(briefs, {
  model: 'veo3_fast',
  autoPublish: true,
  onTaskCreated: (task, brief) => console.log(brief.platform, task.taskId),
});
```

Ошибка на одном брифе не роняет остальные: каждый попадает либо в `created`,
либо в `failed` с причиной.

Ручной режим, если конвейер не нужен:

```ts
import { generateVideo, getKieCredits, listVideoTasks } from '@/services/kieVideoService';

await getKieCredits();                       // проверить ключ и остаток
const task = await generateVideo({ model: 'veo3_fast', prompt: '...' });
await listVideoTasks(20);                    // история задач
```

## Что важно знать про kie.ai

**Файлы живут 14 дней.** Логи — два месяца. Поэтому готовый ролик сразу
перекладывается в бакет `generated-videos`, и наружу отдаётся `stored_url`,
а не временная ссылка kie.ai. Обе ссылки хранятся в `kie_video_tasks`.

**Лимит: 20 генераций за 10 секунд на аккаунт.** Отброшенный запрос получает
429 и **в очередь не встаёт** — то есть просто теряется. Поэтому лимит
соблюдается с двух сторон: `runContentPipeline` шлёт пачками по 15 с паузой,
а edge-функция перед созданием считает задачи за последние 10 секунд и
возвращает 429 с `Retry-After`, не тратя запрос к kie.ai.

**HTTP 200 не значит «готово».** Он значит «задача создана». Ответы завёрнуты
в `{ code, msg, data }`, и `code` может сигналить об ошибке при HTTP 200 —
конверт разбирается вручную, код ошибки пробрасывается наверх (401 — плохой
ключ, 402 — кончились кредиты, 429 — лимит).

**Статусы называются по-разному** у разных эндпоинтов (`waiting`, `queuing`,
`generating`, `success`, `fail`). Сводятся к четырём: `pending`, `running`,
`success`, `failed`. Незнакомый статус считается `running` — иначе живая
задача потеряется, если kie.ai добавит новое состояние.

**Ссылка на результат** приезжает JSON-строкой в поле `resultJson`, её надо
распарсить и достать `resultUrls`.

**Каталог моделей** — на https://kie.ai/market, отдельного эндпоинта со списком
нет. `KIE_VIDEO_MODELS` — подсказка для выпадашек, а не белый список:
`createVideoTask` примет любой слаг, новая модель заработает без правок кода.
Слаги и поля `input` сверяйте на странице модели и в её Playground.

**Разбор проблем** — https://kie.ai/logs: там видно параметры, статус,
списанные кредиты и текст ошибки по каждой задаче.

## Таблица `kie_video_tasks`

Учёт задач: `task_id`, модель, промпт, состояние, обе ссылки, ошибка, флаг
автопубликации, связи с `project_id` и `content_factory_id`. RLS: пишут только
edge-функции, пользователь видит свои задачи. Включён realtime — статус в UI
обновляется сам, без опроса.

Частичный индекс по незавершённым задачам оставлен под будущую подчистку
зависших: если колбэк не дошёл, такие строки видно одним запросом.
