const http = require('node:http');
const { sign } = require('node:crypto');

const PORT = Number(process.env.PORT || 8080);
const MAX_BODY_BYTES = 1024 * 1024;

const DISCORD_SHEET_ID = process.env.DISCORD_SHEET_ID;
const DISCORD_SHEET_NAME = process.env.DISCORD_SHEET_NAME || 'メンバー管理';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const WORKER_TASK_SHARED_SECRET = process.env.WORKER_TASK_SHARED_SECRET;
const REQUIRE_CLOUD_TASKS_HEADERS = process.env.REQUIRE_CLOUD_TASKS_HEADERS === 'true';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const COMMANDS = {
  'atoraku-done': { columnHeader: 'アトラク' },
  'hokora-done': { columnHeader: '祠' },
};

const ALIAS_BRACKETS = /[\(（【\[]([^\)）】\]]+)[\)）】\]]/g;
const STRIP_BRACKET_CHARS = /[\(\)（）、,、\[\]【】・\\/／]/g;
const COLLAPSE_SPACES = /\s+/g;

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

function normalizeName(input) {
  return input.replace(STRIP_BRACKET_CHARS, ' ').replace(COLLAPSE_SPACES, ' ').trim();
}

function extractAliases(raw) {
  const aliases = new Set();
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const base = trimmed.replace(ALIAS_BRACKETS, ' ').replace(COLLAPSE_SPACES, ' ').trim();
  if (base) aliases.add(base);

  for (const match of trimmed.matchAll(ALIAS_BRACKETS)) {
    const content = match[1] && match[1].trim();
    if (content) aliases.add(content);
  }

  return Array.from(aliases);
}

function resolveDisplayName(userId, users, members) {
  const member = members && members[userId];
  const user = (users && users[userId]) || (member && member.user);
  return (
    (member && member.nick && member.nick.trim()) ||
    (user && user.global_name && user.global_name.trim()) ||
    (user && user.username && user.username.trim()) ||
    userId
  );
}

function getUserIdsFromOptions(data) {
  const userIds = [];
  const options = (data && data.options) || [];
  for (const option of options) {
    if (option && option.type === 6 && option.value) {
      userIds.push(option.value);
    }
  }
  return userIds;
}

function columnToLetter(index) {
  let n = index;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function formatSheetName(sheetName) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

function buildMatchResults(displayNames, sheetNames) {
  const normalizedTargets = displayNames.map((name) => ({
    original: name,
    normalized: normalizeName(name),
  }));

  const sheetAliases = sheetNames.map((raw) => ({
    aliases: extractAliases(raw).map((alias) => normalizeName(alias)),
  }));

  return normalizedTargets.map((target) => {
    if (!target.normalized) {
      return { status: 'not_found', displayName: target.original };
    }

    const exactMatches = [];
    sheetAliases.forEach((entry, idx) => {
      if (entry.aliases.some((alias) => alias === target.normalized)) {
        exactMatches.push(idx);
      }
    });

    if (exactMatches.length === 1) {
      return { status: 'matched', rowIndex: exactMatches[0], displayName: target.original };
    }
    if (exactMatches.length > 1) {
      return {
        status: 'ambiguous',
        displayName: target.original,
        candidates: exactMatches.map((idx) => sheetNames[idx]).filter(Boolean),
      };
    }

    const partialMatches = [];
    sheetAliases.forEach((entry, idx) => {
      if (entry.aliases.some((alias) => alias.includes(target.normalized) || target.normalized.includes(alias))) {
        partialMatches.push(idx);
      }
    });

    if (partialMatches.length === 1) {
      return { status: 'matched', rowIndex: partialMatches[0], displayName: target.original };
    }
    if (partialMatches.length > 1) {
      return {
        status: 'ambiguous',
        displayName: target.original,
        candidates: partialMatches.map((idx) => sheetNames[idx]).filter(Boolean),
      };
    }
    return { status: 'not_found', displayName: target.original };
  });
}

async function getGoogleAccessToken() {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Missing Google service account credentials');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(
    JSON.stringify({
      iss: GOOGLE_CLIENT_EMAIL,
      scope: GOOGLE_SHEETS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url');

  const unsignedJwt = `${header}.${claim}`;
  const key = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  const signature = sign('RSA-SHA256', Buffer.from(unsignedJwt), key);
  const signedJwt = `${unsignedJwt}.${Buffer.from(signature).toString('base64url')}`;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }).toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch Google token: ${response.status} ${body}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

async function fetchSheetValues(accessToken) {
  if (!DISCORD_SHEET_ID) {
    throw new Error('Missing DISCORD_SHEET_ID');
  }

  const range = formatSheetName(DISCORD_SHEET_NAME);
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${DISCORD_SHEET_ID}/values/${encodeURIComponent(range)}`);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to read sheet: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data.values;
}

async function updateSheetValues(accessToken, updates) {
  if (!DISCORD_SHEET_ID) {
    throw new Error('Missing DISCORD_SHEET_ID');
  }
  if (!updates.length) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${DISCORD_SHEET_ID}/values:batchUpdate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: updates.map((update) => ({
        range: update.range,
        values: [[update.value]],
      })),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to update sheet: ${res.status} ${body}`);
  }
}

function buildDiscordMessage(columnHeader, results) {
  const success = results.filter((r) => r.status === 'matched');
  const notFound = results.filter((r) => r.status === 'not_found');
  const ambiguous = results.filter((r) => r.status === 'ambiguous');

  const lines = [];
  if (success.length > 0) {
    lines.push(`✅ 更新成功：${columnHeader}：済 に更新 → ${success.map((r) => r.displayName).join(', ')}`);
  }
  if (notFound.length > 0) {
    lines.push(`⚠️ 未検出 → ${notFound.map((r) => r.displayName).join(', ')}`);
  }
  if (ambiguous.length > 0) {
    const detail = ambiguous.map((r) => `${r.displayName}（候補: ${r.candidates.join(' / ')}）`).join(', ');
    lines.push(`⚠️ 曖昧一致 → ${detail}`);
  }
  return lines.length > 0 ? lines.join('\n') : '⚠️ 対象ユーザーが指定されていません。';
}

async function sendDiscordFollowup(interaction, content) {
  const url = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to send followup: ${res.status} ${body}`);
  }
}

function parseTaskBody(rawBody) {
  const parsed = JSON.parse(rawBody.toString('utf8'));
  if (parsed && parsed.interaction) {
    return parsed.interaction;
  }
  return parsed;
}

function validateTaskRequest(req) {
  if (WORKER_TASK_SHARED_SECRET) {
    const received = req.headers['x-worker-task-secret'];
    if (typeof received !== 'string' || received !== WORKER_TASK_SHARED_SECRET) {
      return { ok: false, statusCode: 401, message: 'invalid task secret' };
    }
  }

  if (REQUIRE_CLOUD_TASKS_HEADERS) {
    const taskName = req.headers['x-cloudtasks-taskname'];
    if (typeof taskName !== 'string' || !taskName) {
      return { ok: false, statusCode: 403, message: 'missing Cloud Tasks headers' };
    }
  }

  return { ok: true };
}

async function processInteraction(interaction) {
  if (!interaction || typeof interaction !== 'object') {
    throw new Error('Invalid interaction payload');
  }
  if (!interaction.application_id || !interaction.token) {
    throw new Error('Interaction is missing webhook fields');
  }

  const commandName = interaction.data && interaction.data.name;
  if (!commandName || !(commandName in COMMANDS)) {
    await sendDiscordFollowup(interaction, '未対応のコマンドです。');
    return { status: 'unsupported' };
  }

  const config = COMMANDS[commandName];
  const userIds = getUserIdsFromOptions(interaction.data);
  const resolved = (interaction.data && interaction.data.resolved) || {};
  const displayNames = userIds.map((id) => resolveDisplayName(id, resolved.users, resolved.members));

  if (displayNames.length === 0) {
    await sendDiscordFollowup(interaction, '⚠️ 対象ユーザーが指定されていません。');
    return { status: 'no_targets' };
  }

  const accessToken = await getGoogleAccessToken();
  const sheetValues = await fetchSheetValues(accessToken);
  if (!sheetValues || sheetValues.length === 0) {
    throw new Error('Sheet is empty');
  }

  const headerRow = sheetValues[0];
  const nameColumnIndex = headerRow.indexOf('名前');
  const targetColumnIndex = headerRow.indexOf(config.columnHeader);
  if (nameColumnIndex === -1 || targetColumnIndex === -1) {
    throw new Error('Required headers not found');
  }

  const dataRows = sheetValues.slice(1);
  const nameCells = dataRows.map((row) => row[nameColumnIndex] || '');
  const matchResults = buildMatchResults(displayNames, nameCells);

  const updates = matchResults
    .filter((result) => result.status === 'matched')
    .map((result) => {
      const rowNumber = result.rowIndex + 2;
      const columnLetter = columnToLetter(targetColumnIndex + 1);
      return {
        range: `${formatSheetName(DISCORD_SHEET_NAME)}!${columnLetter}${rowNumber}`,
        value: '済',
      };
    });

  const dedupedUpdates = Array.from(new Map(updates.map((u) => [u.range, u])).values());
  await updateSheetValues(accessToken, dedupedUpdates);

  const content = buildDiscordMessage(config.columnHeader, matchResults);
  await sendDiscordFollowup(interaction, content);
  return { status: 'ok', updated: dedupedUpdates.length };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/healthz') {
      json(res, 200, { ok: true, service: 'discord-worker' });
      return;
    }

    if (req.method !== 'POST' || req.url !== '/tasks/discord-update') {
      json(res, 404, { error: 'not found' });
      return;
    }

    const validation = validateTaskRequest(req);
    if (!validation.ok) {
      json(res, validation.statusCode, { error: validation.message });
      return;
    }

    const rawBody = await readRawBody(req);
    const interaction = parseTaskBody(rawBody);

    try {
      const result = await processInteraction(interaction);
      json(res, 200, { ok: true, result });
    } catch (error) {
      console.error('discord-worker processing error', error);
      try {
        await sendDiscordFollowup(interaction, '❌ エラー：更新に失敗しました（管理者ログ参照）');
      } catch (followupError) {
        console.error('discord-worker followup error', followupError);
      }
      json(res, 200, { ok: false, error: 'processing failed' });
    }
  } catch (error) {
    console.error('discord-worker request error', error);
    json(res, 400, { ok: false, error: 'invalid request' });
  }
});

server.listen(PORT, () => {
  console.log(`discord-worker listening on :${PORT}`);
});
