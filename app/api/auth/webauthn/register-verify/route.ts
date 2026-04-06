import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { verifyRegistration } from '@/app/lib/webauthn/registration';
import { createPasskey } from '@/server/passkey/actions';
import {
  CHALLENGE_COOKIE_NAME,
  USER_COOKIE_NAME,
  AUTH_TOKEN_COOKIE_NAME,
} from '@/app/lib/webauthn/config';
import { checkRateLimit } from '@/server/passkey/rate-limit';
import { verifyCookie } from '@/server/passkey/auth-token';
import { getClientIp } from '@/server/passkey/ip';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request) ?? 'unknown';
  const rateLimitResult = checkRateLimit(`register-verify:${ip}`, 5, 60_000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。しばらくしてからお試しください' },
      { status: 429 },
    );
  }

  try {
    const cookieStore = await cookies();
    const challengeCookie = cookieStore.get(CHALLENGE_COOKIE_NAME)?.value;
    const userDataCookie = cookieStore.get(USER_COOKIE_NAME)?.value;

    if (!challengeCookie) {
      return NextResponse.json(
        { error: 'チャレンジが見つかりません。もう一度お試しください' },
        { status: 400 },
      );
    }

    if (!userDataCookie) {
      return NextResponse.json(
        { error: 'ユーザー情報が見つかりません。もう一度お試しください' },
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

    const userDataRaw = verifyCookie(userDataCookie);
    if (!userDataRaw) {
      return NextResponse.json(
        { error: 'ユーザー情報の署名が無効です' },
        { status: 400 },
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Passkey登録には認証が必要です' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const verification = await verifyRegistration({
      response: body,
      expectedChallenge: challenge,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: '登録の検証に失敗しました' },
        { status: 400 },
      );
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    const userId = session.user.id;

    const transports = body.response?.transports
      ? JSON.stringify(body.response.transports)
      : null;

    await createPasskey({
      userId,
      credentialId: credential.id,
      credentialPublicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      transports,
      credentialDeviceType,
      credentialBackedUp,
      name: body.passkeyName ?? null,
    });

    cookieStore.delete(CHALLENGE_COOKIE_NAME);
    cookieStore.delete(USER_COOKIE_NAME);
    cookieStore.delete(AUTH_TOKEN_COOKIE_NAME);

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error('register-verify error:', error);
    return NextResponse.json(
      { error: '登録の検証中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
