# discord-ingress

Discord Interaction の受け口専用サービスです。  
責務は次の 3 点のみです。

- Discord 署名検証
- PING (`type: 1`) 応答
- Cloud Tasks へのジョブ投入と `type: 5`（defer）応答

## Endpoints

- `POST /interactions`
- `GET /healthz`

## Required Environment Variables

- `DISCORD_PUBLIC_KEY`
- `CLOUD_TASKS_LOCATION`
- `CLOUD_TASKS_QUEUE`
- `DISCORD_WORKER_URL`

## Optional Environment Variables

- `GOOGLE_CLOUD_PROJECT` (or `GCLOUD_PROJECT` / `GCP_PROJECT`)
- `CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL`
- `CLOUD_TASKS_AUDIENCE`
- `WORKER_TASK_SHARED_SECRET`

## Local Run

```bash
PORT=8080 node index.js
```

## Deploy Example

```bash
gcloud run deploy discord-ingress \
  --source services/discord-ingress \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances=0
```
