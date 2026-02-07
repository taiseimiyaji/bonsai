import { sign, verify } from 'crypto';

type DiscordInteraction = {
  id: string;
  application_id: string;
  type: number;
  token: string;
  data?: {
    name?: string;
    options?: Array<{
      name: string;
      type: number;
      value?: string;
    }>;
    resolved?: {
      users?: Record<string, DiscordUser>;
      members?: Record<string, DiscordMember>;
    };
  };
  member?: DiscordMember;
  user?: DiscordUser;
};

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
};

type DiscordMember = {
  nick?: string | null;
  user?: DiscordUser;
};

type MatchResult =
  | { status: 'matched'; rowIndex: number; displayName: string }
  | { status: 'not_found'; displayName: string }
  | { status: 'ambiguous'; displayName: string; candidates: string[] };

type CommandConfig = {
  columnHeader: 'アトラク' | '祠';
};

export const runtime = 'nodejs';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const DISCORD_SHEET_ID = process.env.DISCORD_SHEET_ID;
const DISCORD_SHEET_NAME = process.env.DISCORD_SHEET_NAME ?? 'メンバー管理';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const DISCORD_LEGACY_HANDLER_ENABLED = process.env.DISCORD_LEGACY_HANDLER_ENABLED !== 'false';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const COMMANDS: Record<string, CommandConfig> = {
  'atoraku-done': { columnHeader: 'アトラク' },
  'hokora-done': { columnHeader: '祠' },
};

const ALIAS_BRACKETS = /[\(（【\[]([^\)）】\]]+)[\)）】\]]/g;
const STRIP_BRACKET_CHARS = /[\(\)（）、,、\[\]【】・\\/／]/g;
const COLLAPSE_SPACES = /\s+/g;

function normalizeName(input: string): string {
  return input
    .replace(STRIP_BRACKET_CHARS, ' ')
    .replace(COLLAPSE_SPACES, ' ')
    .trim();
}

function extractAliases(raw: string): string[] {
  const aliases = new Set<string>();
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const base = trimmed.replace(ALIAS_BRACKETS, ' ').replace(COLLAPSE_SPACES, ' ').trim();
  if (base) aliases.add(base);

  const matches = trimmed.matchAll(ALIAS_BRACKETS);
  for (const match of matches) {
    const content = match[1]?.trim();
    if (content) aliases.add(content);
  }

  return Array.from(aliases);
}

function resolveDisplayName(userId: string, users?: Record<string, DiscordUser>, members?: Record<string, DiscordMember>): string {
  const member = members?.[userId];
  const user = users?.[userId] ?? member?.user;
  return (
    member?.nick?.trim()
    ?? user?.global_name?.trim()
    ?? user?.username?.trim()
    ?? userId
  );
}

function getUserIdsFromOptions(options?: DiscordInteraction['data']): string[] {
  const userIds: string[] = [];
  const opts = options?.options ?? [];
  for (const option of opts) {
    if (option.type === 6 && option.value) {
      userIds.push(option.value);
    }
  }
  return userIds;
}

function columnToLetter(index: number): string {
  let n = index;
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function formatSheetName(sheetName: string): string {
  const escaped = sheetName.replace(/'/g, "''");
  return `'${escaped}'`;
}

function buildMatchResults(
  displayNames: string[],
  sheetNames: string[],
): MatchResult[] {
  const normalizedTargets = displayNames.map((name) => ({
    original: name,
    normalized: normalizeName(name),
  }));

  const sheetAliases = sheetNames.map((raw) => ({
    raw,
    aliases: extractAliases(raw).map((alias) => normalizeName(alias)),
  }));

  return normalizedTargets.map((target) => {
    if (!target.normalized) {
      return { status: 'not_found', displayName: target.original };
    }

    const exactMatches: number[] = [];
    sheetAliases.forEach((entry, idx) => {
      if (entry.aliases.some((alias) => alias === target.normalized)) {
        exactMatches.push(idx);
      }
    });

    if (exactMatches.length === 1) {
      return {
        status: 'matched',
        rowIndex: exactMatches[0],
        displayName: target.original,
      };
    }

    if (exactMatches.length > 1) {
      return {
        status: 'ambiguous',
        displayName: target.original,
        candidates: exactMatches.map((index) => sheetNames[index]).filter(Boolean),
      };
    }

    const partialMatches: number[] = [];
    sheetAliases.forEach((entry, idx) => {
      if (entry.aliases.some((alias) => alias.includes(target.normalized) || target.normalized.includes(alias))) {
        partialMatches.push(idx);
      }
    });

    if (partialMatches.length === 1) {
      return {
        status: 'matched',
        rowIndex: partialMatches[0],
        displayName: target.original,
      };
    }

    if (partialMatches.length > 1) {
      return {
        status: 'ambiguous',
        displayName: target.original,
        candidates: partialMatches.map((index) => sheetNames[index]).filter(Boolean),
      };
    }

    return { status: 'not_found', displayName: target.original };
  });
}

async function getGoogleAccessToken(): Promise<string> {
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
  return payload.access_token as string;
}

async function fetchSheetValues(accessToken: string) {
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
  return data.values as string[][];
}

async function updateSheetValues(accessToken: string, updates: { range: string; value: string }[]) {
  if (!DISCORD_SHEET_ID) {
    throw new Error('Missing DISCORD_SHEET_ID');
  }
  if (updates.length === 0) return;

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

function buildDiscordMessage(columnHeader: string, results: MatchResult[]) {
  const success = results.filter((r) => r.status === 'matched');
  const notFound = results.filter((r) => r.status === 'not_found');
  const ambiguous = results.filter((r) => r.status === 'ambiguous');

  const lines: string[] = [];
  if (success.length > 0) {
    lines.push(`✅ 更新成功：${columnHeader}：済 に更新 → ${success.map((r) => r.displayName).join(', ')}`);
  }
  if (notFound.length > 0) {
    lines.push(`⚠️ 未検出 → ${notFound.map((r) => r.displayName).join(', ')}`);
  }
  if (ambiguous.length > 0) {
    const detail = ambiguous
      .map((r) => `${r.displayName}（候補: ${r.candidates.join(' / ')}）`)
      .join(', ');
    lines.push(`⚠️ 曖昧一致 → ${detail}`);
  }

  return lines.length > 0 ? lines.join('\n') : '⚠️ 対象ユーザーが指定されていません。';
}

async function sendDiscordFollowup(interaction: DiscordInteraction, content: string) {
  const url = `https://discord.com/api/v10/webhooks/${interaction.application_id}/${interaction.token}`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}

function verifyDiscordSignature(rawBody: Buffer, signature: string, timestamp: string): boolean {
  if (!DISCORD_PUBLIC_KEY) return false;
  const message = Buffer.concat([Buffer.from(timestamp), rawBody]);

  const publicKeyBuffer = Buffer.concat([
    Buffer.from('302a300506032b6570032100', 'hex'),
    Buffer.from(DISCORD_PUBLIC_KEY, 'hex'),
  ]);

  return verify(null, message, {
    key: publicKeyBuffer,
    format: 'der',
    type: 'spki',
  }, Buffer.from(signature, 'hex'));
}

export async function POST(req: Request) {
  if (!DISCORD_LEGACY_HANDLER_ENABLED) {
    return new Response(
      'Legacy Discord endpoint is disabled. Update Discord Interactions Endpoint to discord-ingress.',
      { status: 410 },
    );
  }

  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  if (!signature || !timestamp) {
    return new Response('Missing signature headers', { status: 401 });
  }

  const rawBody = Buffer.from(await req.arrayBuffer());
  const isValid = verifyDiscordSignature(rawBody, signature, timestamp);
  if (!isValid) {
    return new Response('Invalid request signature', { status: 401 });
  }

  const interaction = JSON.parse(rawBody.toString()) as DiscordInteraction;

  if (interaction.type === 1) {
    return Response.json({ type: 1 });
  }

  const commandName = interaction.data?.name;
  if (!commandName || !(commandName in COMMANDS)) {
    return Response.json({ type: 4, data: { content: '未対応のコマンドです。' } });
  }

  const config = COMMANDS[commandName];

  const userIds = getUserIdsFromOptions(interaction.data);
  const displayNames = userIds.map((id) => resolveDisplayName(id, interaction.data?.resolved?.users, interaction.data?.resolved?.members));

  const deferredResponse = Response.json({ type: 5 });

  const deferred = (async () => {
    try {
      if (displayNames.length === 0) {
        await sendDiscordFollowup(interaction, '⚠️ 対象ユーザーが指定されていません。');
        return;
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
      const nameCells = dataRows.map((row) => row[nameColumnIndex] ?? '');
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
      const dedupedUpdates = Array.from(
        new Map(updates.map((update) => [update.range, update])).values(),
      );

      await updateSheetValues(accessToken, dedupedUpdates);

      const content = buildDiscordMessage(config.columnHeader, matchResults);
      await sendDiscordFollowup(interaction, content);
    } catch (error) {
      const content = '❌ エラー：更新に失敗しました（管理者ログ参照）';
      await sendDiscordFollowup(interaction, content);
      console.error('Discord bot error', error);
    }
  })();

  void deferred;
  return deferredResponse;
}
