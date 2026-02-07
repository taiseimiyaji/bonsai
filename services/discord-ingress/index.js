const http = require('node:http');
const { verify } = require('node:crypto');

const PORT = Number(process.env.PORT || 8080);
const MAX_BODY_BYTES = 1024 * 1024;
const PUBLIC_KEY_PREFIX = '302a300506032b6570032100';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const CLOUD_TASKS_LOCATION = process.env.CLOUD_TASKS_LOCATION;
const CLOUD_TASKS_QUEUE = process.env.CLOUD_TASKS_QUEUE;
const DISCORD_WORKER_URL = process.env.DISCORD_WORKER_URL;
const CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL = process.env.CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL;
const CLOUD_TASKS_AUDIENCE = process.env.CLOUD_TASKS_AUDIENCE;
const WORKER_TASK_SHARED_SECRET = process.env.WORKER_TASK_SHARED_SECRET;
const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  '';

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readRawBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('Request body too large');
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

function verifyDiscordSignature(rawBody, signature, timestamp) {
  if (!DISCORD_PUBLIC_KEY) return false;
  const message = Buffer.concat([Buffer.from(timestamp), rawBody]);
  const publicKeyBuffer = Buffer.concat([
    Buffer.from(PUBLIC_KEY_PREFIX, 'hex'),
    Buffer.from(DISCORD_PUBLIC_KEY, 'hex'),
  ]);

  return verify(
    null,
    message,
    {
      key: publicKeyBuffer,
      format: 'der',
      type: 'spki',
    },
    Buffer.from(signature, 'hex'),
  );
}

async function getMetadataAccessToken() {
  const response = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    {
      headers: { 'Metadata-Flavor': 'Google' },
    },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch metadata token: ${response.status} ${body}`);
  }
  const data = await response.json();
  return data.access_token;
}

function buildTaskRequestBody(payload) {
  const headers = { 'Content-Type': 'application/json' };
  if (WORKER_TASK_SHARED_SECRET) {
    headers['X-Worker-Task-Secret'] = WORKER_TASK_SHARED_SECRET;
  }

  const httpRequest = {
    httpMethod: 'POST',
    url: DISCORD_WORKER_URL,
    headers,
    body: Buffer.from(JSON.stringify(payload)).toString('base64'),
  };

  if (CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL) {
    httpRequest.oidcToken = {
      serviceAccountEmail: CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL,
    };
    if (CLOUD_TASKS_AUDIENCE) {
      httpRequest.oidcToken.audience = CLOUD_TASKS_AUDIENCE;
    }
  }

  return { task: { httpRequest } };
}

function assertCloudTasksConfig() {
  if (!PROJECT_ID) throw new Error('Missing project id');
  if (!CLOUD_TASKS_LOCATION) throw new Error('Missing CLOUD_TASKS_LOCATION');
  if (!CLOUD_TASKS_QUEUE) throw new Error('Missing CLOUD_TASKS_QUEUE');
  if (!DISCORD_WORKER_URL) throw new Error('Missing DISCORD_WORKER_URL');
}

async function enqueueInteractionTask(payload) {
  assertCloudTasksConfig();
  const token = await getMetadataAccessToken();
  const queuePath = `projects/${PROJECT_ID}/locations/${CLOUD_TASKS_LOCATION}/queues/${CLOUD_TASKS_QUEUE}`;
  const url = `https://cloudtasks.googleapis.com/v2/${queuePath}/tasks`;
  const body = buildTaskRequestBody(payload);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Failed to create Cloud Task: ${response.status} ${responseBody}`);
  }
  return response.json();
}

function createWorkerPayload(interaction) {
  return {
    interaction,
    enqueuedAt: new Date().toISOString(),
    source: 'discord-ingress',
  };
}

function shouldDefer(interaction) {
  return interaction && interaction.type !== 1;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/healthz') {
      json(res, 200, { ok: true, service: 'discord-ingress' });
      return;
    }

    if (req.method !== 'POST' || req.url !== '/interactions') {
      json(res, 404, { error: 'not found' });
      return;
    }

    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    if (typeof signature !== 'string' || typeof timestamp !== 'string') {
      json(res, 401, { error: 'missing signature headers' });
      return;
    }

    const rawBody = await readRawBody(req);
    if (!verifyDiscordSignature(rawBody, signature, timestamp)) {
      json(res, 401, { error: 'invalid signature' });
      return;
    }

    let interaction;
    try {
      interaction = JSON.parse(rawBody.toString('utf8'));
    } catch {
      json(res, 400, { error: 'invalid json body' });
      return;
    }

    if (interaction.type === 1) {
      json(res, 200, { type: 1 });
      return;
    }

    if (shouldDefer(interaction)) {
      const taskPayload = createWorkerPayload(interaction);
      await enqueueInteractionTask(taskPayload);
      json(res, 200, { type: 5 });
      return;
    }

    json(res, 200, { type: 4, data: { content: 'Unsupported interaction type.' } });
  } catch (error) {
    console.error('discord-ingress error', error);
    json(res, 200, {
      type: 4,
      data: { content: '❌ エラー：一時的に処理に失敗しました。' },
    });
  }
});

server.listen(PORT, () => {
  console.log(`discord-ingress listening on :${PORT}`);
});
