import { sign } from 'crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DISCORD_SHEET_ID = process.env.DISCORD_SHEET_ID;
const DISCORD_SHEET_NAME = process.env.DISCORD_SHEET_NAME ?? 'メンバー管理';
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const API_SECRET_KEY = process.env.CRON_API_SECRET_KEY;

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function formatSheetName(sheetName: string): string {
  const escaped = sheetName.replace(/'/g, "''");
  return `'${escaped}'`;
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

async function clearSheetRanges(accessToken: string, ranges: string[]) {
  if (!DISCORD_SHEET_ID) {
    throw new Error('Missing DISCORD_SHEET_ID');
  }
  if (ranges.length === 0) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${DISCORD_SHEET_ID}/values:batchClear`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ranges }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to clear sheet ranges: ${res.status} ${body}`);
  }
}

function resolveTargetColumn(target?: string | null): 'D' | 'E' {
  if (target === 'D' || target === 'E') return target;
  throw new Error('Invalid target column. Use ?target=D or ?target=E');
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (process.env.NODE_ENV === 'production') {
      if (!API_SECRET_KEY) {
        return NextResponse.json({ error: '認証設定エラー' }, { status: 500 });
      }
      if (!apiKey || apiKey !== API_SECRET_KEY) {
        return NextResponse.json({ error: '認証エラー' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const target = resolveTargetColumn(searchParams.get('target'));

    const sheetRange = formatSheetName(DISCORD_SHEET_NAME);
    const ranges = [
      `${sheetRange}!${target}2:${target}`,
    ];

    const accessToken = await getGoogleAccessToken();
    await clearSheetRanges(accessToken, ranges);

    return NextResponse.json({
      success: true,
      cleared: ranges,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sheet reset error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
