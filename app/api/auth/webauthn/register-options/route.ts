import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { createRegistrationOptions } from '@/app/lib/webauthn/registration';
import { findPasskeysByUserId } from '@/server/passkey/actions';
import {
  CHALLENGE_COOKIE_NAME,
  USER_COOKIE_NAME,
  challengeCookieOptions,
} from '@/app/lib/webauthn/config';
import { checkRateLimit } from '@/server/passkey/rate-limit';
import { signCookie } from '@/server/passkey/auth-token';
import { getClientIp } from '@/server/passkey/ip';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request) ?? 'unknown';
  const rateLimitResult = checkRateLimit(`register-options:${ip}`, 10, 60_000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらくしてからお試しください' },
      { status: 429 },
    );
  }

  try {
    const session = await auth();

    // Why: Passkey registration is limited to authenticated users only (C-3).
    // New user creation via passkey is not supported — users must first sign in via Google OAuth.
    // Therefore, early email duplicate check (M-7) is unnecessary in this flow.
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Passkey登録には認証が必要です' },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const email = session.user.email;
    const name = session.user.name;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'ユーザーのメールアドレスまたは名前が設定されていません' },
        { status: 400 },
      );
    }

    const existingPasskeys = await findPasskeysByUserId(userId);
    const existingCredentialIds = existingPasskeys.map((p) => p.credentialId);

    const options = await createRegistrationOptions({
      userId,
      email,
      name,
      existingCredentialIds,
    });

    const cookieStore = await cookies();
    cookieStore.set(
      CHALLENGE_COOKIE_NAME,
      signCookie(options.challenge),
      challengeCookieOptions,
    );
    cookieStore.set(
      USER_COOKIE_NAME,
      signCookie(JSON.stringify({ userId, email, name })),
      challengeCookieOptions,
    );

    return NextResponse.json(options);
  } catch (error) {
    console.error('register-options error:', error);
    return NextResponse.json(
      { error: '登録オプションの生成に失敗しました' },
      { status: 500 },
    );
  }
}
