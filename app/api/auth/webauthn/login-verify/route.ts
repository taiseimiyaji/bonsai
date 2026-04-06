import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthentication } from '@/app/lib/webauthn/authentication';
import {
  findPasskeyByCredentialId,
  updatePasskeyCounter,
} from '@/server/passkey/actions';
import {
  CHALLENGE_COOKIE_NAME,
  AUTH_TOKEN_COOKIE_NAME,
  authTokenCookieOptions,
} from '@/app/lib/webauthn/config';
import { checkRateLimit } from '@/server/passkey/rate-limit';
import { verifyCookie, createAuthToken } from '@/server/passkey/auth-token';
import { getClientIp } from '@/server/passkey/ip';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request) ?? 'unknown';
  const rateLimitResult = checkRateLimit(`login-verify:${ip}`, 5, 60_000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらくしてからお試しください' },
      { status: 429 },
    );
  }

  try {
    const cookieStore = await cookies();
    const challengeCookie = cookieStore.get(CHALLENGE_COOKIE_NAME)?.value;

    if (!challengeCookie) {
      return NextResponse.json(
        { error: 'チャレンジが見つかりません。もう一度お試しください' },
        { status: 400 },
      );
    }

    const challenge = verifyCookie(challengeCookie);
    if (!challenge) {
      return NextResponse.json(
        { error: 'チャレンジの署名が無効です' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const credentialId = body.id;

    if (!credentialId) {
      return NextResponse.json(
        { error: 'クレデンシャルIDが必要です' },
        { status: 400 },
      );
    }

    const passkey = await findPasskeyByCredentialId(credentialId);
    if (!passkey) {
      return NextResponse.json(
        { error: '登録されていないPassKeyです' },
        { status: 404 },
      );
    }

    const verification = await verifyAuthentication({
      response: body,
      expectedChallenge: challenge,
      passkey: {
        credentialId: passkey.credentialId,
        credentialPublicKey: Buffer.from(passkey.credentialPublicKey),
        counter: passkey.counter,
      },
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: '認証の検証に失敗しました' },
        { status: 400 },
      );
    }

    const { newCounter } = verification.authenticationInfo;
    await updatePasskeyCounter(passkey.credentialId, BigInt(newCounter));

    cookieStore.delete(CHALLENGE_COOKIE_NAME);

    const authToken = createAuthToken(passkey.userId);

    cookieStore.set(AUTH_TOKEN_COOKIE_NAME, authToken, authTokenCookieOptions);

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error('login-verify error:', error);
    return NextResponse.json(
      { error: '認証の検証中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
