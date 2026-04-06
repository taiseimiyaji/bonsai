import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAuthenticationOptions } from '@/app/lib/webauthn/authentication';
import {
  CHALLENGE_COOKIE_NAME,
  challengeCookieOptions,
} from '@/app/lib/webauthn/config';
import { checkRateLimit } from '@/server/passkey/rate-limit';
import { signCookie } from '@/server/passkey/auth-token';
import { getClientIp } from '@/server/passkey/ip';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request) ?? 'unknown';
  const rateLimitResult = checkRateLimit(`login-options:${ip}`, 10, 60_000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらくしてからお試しください' },
      { status: 429 },
    );
  }

  try {
    const options = await createAuthenticationOptions([]);

    const cookieStore = await cookies();
    const signedChallenge = signCookie(options.challenge);
    cookieStore.set(CHALLENGE_COOKIE_NAME, signedChallenge, challengeCookieOptions);

    return NextResponse.json(options);
  } catch (error) {
    console.error('login-options error:', error);
    return NextResponse.json(
      { error: '認証オプションの生成に失敗しました' },
      { status: 500 },
    );
  }
}
