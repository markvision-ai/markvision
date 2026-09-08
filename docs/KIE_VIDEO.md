# Генерация видео через kie.ai

kie.ai — агрегатор видеомоделей (Veo, Sora, Runway, Kling и другие) с одним общим
API. В проекте он подключён так же, как остальные внешние AI-сервисы: ключ лежит
в секретах Supabase, браузер его не видит.

```
браузер → src/services/kieVideoService.ts
        → supabase/functions/kie-video (KIE_API_KEY)
        → https://api.kie.ai
```

## Настройка

1. Возьми ключ в кабинете kie.ai → API Keys.
2. Supabase Dashboard → Edge Functions → Secrets → добавь `KIE_API_KEY`.
3. Задеплой функцию:

```bash
supabase functions deploy kie-video
```

Переменной `VITE_KIE_API_KEY` быть не должно — префикс `VITE_` попадает в бандл
и отдаёт ключ всем посетителям сайта.

## Использование

```ts
import { generateVideo, getKieCredits, KIE_VIDEO_MODELS } from '@/services/kieVideoService';

// Проверить, что ключ живой, и посмотреть остаток
const credits = await getKieCredits();

// Сгенерировать ролик и дождаться результата
const task = await generateVideo(
  {
    model: 'veo3_fast',
    prompt: 'Девушка распаковывает коробку с кроссовками, мягкий утренний свет',
    aspectRatio: '9:16',
  },
  {
    pollIntervalMs: 5000,
    timeoutMs: 10 * 60 * 1000,
    onProgress: (t) => console.log(t.state),
  }
);

console.log(task.videoUrls[0]);
```

Если ждать в UI неудобно, задачу можно поставить и опросить позже:

```ts
const { taskId } = await createVideoTask({ model: 'veo3_fast', prompt: '...' });
// ...позже
const task = await getVideoTask(taskId);
```

Либо передать `callBackUrl` — тогда kie.ai сам постучится на вебхук, когда
ролик будет готов.

### Отмена

`waitForVideoTask` и `generateVideo` принимают `AbortSignal`. Отмена
останавливает опрос на нашей стороне; задача на kie.ai продолжает считаться и
кредиты за неё уже списаны.

## Модели

`KIE_VIDEO_MODELS` — список известных моделей для выпадашек в UI. Это подсказка,
а не белый список: `createVideoTask` примет любой слаг, поэтому новая модель
kie.ai заработает без правок кода.

Актуальные слаги и набор полей `input` у каждой модели смотри в
[документации kie.ai](https://docs.kie.ai) — состав каталога у них меняется, и
слаг может отличаться от того, что записан в константе.

## Что происходит на стороне edge-функции

- **Авторизация.** Без валидного JWT Supabase функция отвечает 401.
- **Лимиты.** 20 генераций в час на пользователя, 100 для админа — считается по
  таблице `api_key_usage`, как в `generate-ad-copy`. Чтение статуса и баланса
  лимит не тратит.
- **Формат ответов kie.ai.** Сервис отвечает `{ code, msg, data }` и отдаёт
  HTTP 200 даже на ошибках, поэтому конверт разбирается вручную, а код ошибки
  пробрасывается наверх (401 — плохой ключ, 402 — кончились кредиты, 429 — лимит
  на стороне kie.ai).
- **Состояния задачи.** У разных эндпоинтов kie.ai названия статусов немного
  расходятся (`waiting`, `queuing`, `generating`, `success`, `fail`), поэтому они
  сводятся к четырём: `pending`, `running`, `success`, `failed`. Незнакомый
  статус считается `running` — так задача не потеряется, если kie.ai добавит
  новое состояние.
- **Ссылка на видео.** Результат приходит JSON-строкой в поле `resultJson`, её
  надо распарсить и достать `resultUrls`. Ссылки у kie.ai временные — если
  ролик нужен надолго, перекладывай его в Supabase Storage.
