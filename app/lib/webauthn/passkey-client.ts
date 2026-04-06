'use client';

import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';

const LOGIN_OPTIONS_URL = '/api/auth/webauthn/login-options';
const LOGIN_VERIFY_URL = '/api/auth/webauthn/login-verify';
const REGISTER_OPTIONS_URL = '/api/auth/webauthn/register-options';
const REGISTER_VERIFY_URL = '/api/auth/webauthn/register-verify';

function convertNotAllowedError(err: unknown): never {
  if (err instanceof DOMException && err.name === 'NotAllowedError') {
    const friendlyError = new Error('認証がキャンセルされました');
    friendlyError.name = 'PasskeyCancelledError';
    throw friendlyError;
  }
  throw err;
}

export async function performPasskeyAuthentication(): Promise<void> {
  const optionsRes = await fetch(LOGIN_OPTIONS_URL, {
    method: 'POST',
  });
  if (!optionsRes.ok) {
    throw new Error('認証オプションの取得に失敗しました');
  }
  const options = await optionsRes.json();

  let authResponse;
  try {
    authResponse = await startAuthentication({ optionsJSON: options });
  } catch (err) {
    convertNotAllowedError(err);
  }

  const verifyRes = await fetch(LOGIN_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(authResponse),
  });
  if (!verifyRes.ok) {
    const data = await verifyRes.json();
    throw new Error(data.error ?? '認証に失敗しました');
  }
  // Why: authToken is set as HttpOnly cookie by the server — no client extraction needed
}

type RegistrationResult = {
  verified: boolean;
};

type PasskeyRegistrationParams = {
  passkeyName?: string;
};

export async function performPasskeyRegistration(
  params: PasskeyRegistrationParams = {},
): Promise<RegistrationResult> {
  const optionsRes = await fetch(REGISTER_OPTIONS_URL, {
    method: 'POST',
  });
  if (!optionsRes.ok) {
    const data = await optionsRes.json();
    throw new Error(data.error ?? '登録オプションの取得に失敗しました');
  }
  const options = await optionsRes.json();

  let regResponse;
  try {
    regResponse = await startRegistration({ optionsJSON: options });
  } catch (err) {
    convertNotAllowedError(err);
  }

  const verifyRes = await fetch(REGISTER_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...regResponse,
      passkeyName: params.passkeyName,
    }),
  });
  if (!verifyRes.ok) {
    const data = await verifyRes.json();
    throw new Error(data.error ?? '登録に失敗しました');
  }
  return verifyRes.json();
}

export function isPasskeySupported(): boolean {
  return browserSupportsWebAuthn();
}
