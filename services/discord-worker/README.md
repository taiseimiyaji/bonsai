# discord-worker

Cloud Tasks から Discord 更新ジョブを受け取り、Sheets 更新と followup 返信を行うサービスです。

## Endpoints

- `POST /tasks/discord-update`
- `GET /healthz`

## Required Environment Variables

- `DISCORD_SHEET_ID`
- `DISCORD_SHEET_NAME` (default: `メンバー管理`)
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

## Optional Environment Variables

- `WORKER_TASK_SHARED_SECRET`
- `REQUIRE_CLOUD_TASKS_HEADERS` (`true` で `x-cloudtasks-taskname` を必須化)

## Task Payload

`discord-ingress` が投入する payload を受け取ります。

```json
{
  "interaction": {
    "id": "123",
    "application_id": "456",
    "token": "xxx",
    "type": 2,
    "data": {
      "name": "atoraku-done"
    }
  },
  "source": "discord-ingress",
  "enqueuedAt": "2026-02-07T00:00:00.000Z"
}
```

## Local Run

```bash
PORT=8080 node index.js
```
