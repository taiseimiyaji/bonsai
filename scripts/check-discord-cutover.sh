#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-bonsai-410001}"
REGION="${REGION:-asia-northeast1}"
APP_SERVICE="${APP_SERVICE:-bonsai}"
INGRESS_SERVICE="${INGRESS_SERVICE:-discord-ingress}"
WORKER_SERVICE="${WORKER_SERVICE:-discord-worker}"
QUEUE_NAME="${QUEUE_NAME:-discord-update-queue}"

echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo

APP_URL="$(gcloud run services describe "${APP_SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')"
INGRESS_URL="$(gcloud run services describe "${INGRESS_SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')"
WORKER_URL="$(gcloud run services describe "${WORKER_SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format='value(status.url)')"

echo "App URL:      ${APP_URL}"
echo "Ingress URL:  ${INGRESS_URL}"
echo "Worker URL:   ${WORKER_URL}"
echo
echo "Discord Interactions Endpoint (set this in Discord Developer Portal):"
echo "${INGRESS_URL}/interactions"
echo

if gcloud tasks queues describe "${QUEUE_NAME}" --project "${PROJECT_ID}" --location "${REGION}" >/dev/null 2>&1; then
  echo "Queue status: found (${QUEUE_NAME})"
else
  echo "Queue status: NOT FOUND (${QUEUE_NAME})"
fi
echo

LEGACY_VALUE="$(gcloud run services describe "${APP_SERVICE}" --project "${PROJECT_ID}" --region "${REGION}" --format='value(spec.template.spec.containers[0].env[?name=DISCORD_LEGACY_HANDLER_ENABLED].value)' || true)"
if [[ -z "${LEGACY_VALUE}" ]]; then
  LEGACY_VALUE="(unset -> defaults to true)"
fi
echo "bonsai DISCORD_LEGACY_HANDLER_ENABLED: ${LEGACY_VALUE}"
