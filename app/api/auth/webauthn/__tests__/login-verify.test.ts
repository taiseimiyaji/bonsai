import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));
const mockVerifyAuthentication = vi.hoisted(() => vi.fn());
const mockFindPasskeyByCredentialId = vi.hoisted(() => vi.fn());
const mockUpdatePasskeyCounter = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() => vi.fn());
const mockVerifyCookie = vi.hoisted(() => vi.fn());
const mockCreateAuthToken = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock('@/app/lib/webauthn/authentication', () => ({
  verifyAuthentication: mockVerifyAuthentication,
}));

vi.mock('@/server/passkey/actions', () => ({
  findPasskeyByCredentialId: mockFindPasskeyByCredentialId,
  updatePasskeyCounter: mockUpdatePasskeyCounter,
}));

vi.mock('@/app/lib/webauthn/config', () => ({
  CHALLENGE_COOKIE_NAME: '__webauthn_challenge',
  AUTH_TOKEN_COOKIE_NAME: '__passkey_auth_token',
  authTokenCookieOptions: {
    httpOnly: true,
    secure: false,
    sameSite: 'strict' as const,
    maxAge: 300,
    path: '/',
  },
}));

vi.mock('@/server/passkey/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock('@/server/passkey/auth-token', () => ({
  verifyCookie: mockVerifyCookie,
  createAuthToken: mockCreateAuthToken,
}));

import { POST } from '../login-verify/route';

function createRequest(
  body: Record<string, unknown>,
  headers: HeadersInit = {},
): NextRequest {
  return new NextRequest('http://localhost/api/auth/webauthn/login-verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/webauthn/login-verify', () => {
  const mockPasskey = {
    id: 'passkey-1',
    userId: 'user-123',
    credentialId: 'cred-abc',
    credentialPublicKey: Buffer.from('public-key-data'),
    counter: BigInt(5),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({ allowed: true });
    mockVerifyCookie.mockImplementation((value: string) => value.replace('signed:', ''));
  });

  function setChallengeCookie(value = 'signed:test-challenge') {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === '__webauthn_challenge') {
        return { value };
      }

      return undefined;
    });
  }

  const validRequestBody = {
    id: 'cred-abc',
    response: {
      authenticatorData: 'data',
      clientDataJSON: 'json',
      signature: 'sig',
    },
    type: 'public-key',
  };

  it('sets authToken as an HttpOnly cookie when authentication succeeds', async () => {
    setChallengeCookie();
    mockFindPasskeyByCredentialId.mockResolvedValue(mockPasskey);
    mockVerifyAuthentication.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 6 },
    });
    mockUpdatePasskeyCounter.mockResolvedValue(undefined);
    mockCreateAuthToken.mockReturnValue('auth-token-xyz');

    const response = await POST(
      createRequest(validRequestBody, { 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).authToken).toBeUndefined();
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      '__passkey_auth_token',
      'auth-token-xyz',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
      }),
    );
  });

  it('updates the passkey counter after successful verification', async () => {
    setChallengeCookie();
    mockFindPasskeyByCredentialId.mockResolvedValue(mockPasskey);
    mockVerifyAuthentication.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 10 },
    });
    mockCreateAuthToken.mockReturnValue('token');

    await POST(createRequest(validRequestBody, { 'x-forwarded-for': '127.0.0.1' }));

    expect(mockUpdatePasskeyCounter).toHaveBeenCalledWith('cred-abc', BigInt(10));
  });

  it('deletes the challenge cookie after successful verification', async () => {
    setChallengeCookie();
    mockFindPasskeyByCredentialId.mockResolvedValue(mockPasskey);
    mockVerifyAuthentication.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 6 },
    });
    mockCreateAuthToken.mockReturnValue('token');

    await POST(createRequest(validRequestBody, { 'x-forwarded-for': '127.0.0.1' }));

    expect(mockCookieStore.delete).toHaveBeenCalledWith('__webauthn_challenge');
  });

  it('continues when IP headers are missing and still performs rate limiting', async () => {
    setChallengeCookie();
    mockFindPasskeyByCredentialId.mockResolvedValue(mockPasskey);
    mockVerifyAuthentication.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 6 },
    });
    mockCreateAuthToken.mockReturnValue('token');

    const response = await POST(createRequest(validRequestBody));

    expect(response.status).toBe(200);
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringMatching(/^login-verify:/),
      5,
      60_000,
    );
  });

  it('returns 400 when the challenge cookie is missing', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const response = await POST(
      createRequest({ id: 'cred-abc' }, { 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBeDefined();
  });

  it('returns 400 when the challenge cookie signature is invalid', async () => {
    setChallengeCookie('tampered-value');
    mockVerifyCookie.mockReturnValue(null);

    const response = await POST(
      createRequest({ id: 'cred-abc' }, { 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(400);
  });

  it('returns 400 when credentialId is missing from the request body', async () => {
    setChallengeCookie('signed:challenge');

    const response = await POST(
      createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBeDefined();
  });

  it('returns 404 when the passkey is not registered', async () => {
    setChallengeCookie('signed:challenge');
    mockFindPasskeyByCredentialId.mockResolvedValue(null);

    const response = await POST(
      createRequest({ id: 'unknown-cred' }, { 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error).toBeDefined();
  });

  it('returns 400 when verification fails', async () => {
    setChallengeCookie('signed:challenge');
    mockFindPasskeyByCredentialId.mockResolvedValue(mockPasskey);
    mockVerifyAuthentication.mockResolvedValue({
      verified: false,
      authenticationInfo: undefined,
    });

    const response = await POST(
      createRequest(
        {
          ...validRequestBody,
          response: {
            authenticatorData: 'bad',
            clientDataJSON: 'bad',
            signature: 'bad',
          },
        },
        { 'x-forwarded-for': '127.0.0.1' },
      ),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBeDefined();
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 30000 });

    const response = await POST(
      createRequest({ id: 'cred-abc' }, { 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(429);
  });

  it('returns 500 when verifyAuthentication throws an unexpected error', async () => {
    setChallengeCookie('signed:challenge');
    mockFindPasskeyByCredentialId.mockResolvedValue(mockPasskey);
    mockVerifyAuthentication.mockRejectedValue(new Error('unexpected error'));

    const response = await POST(
      createRequest(validRequestBody, { 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(500);
  });

  it('creates authToken with the authenticated user id', async () => {
    setChallengeCookie('signed:challenge');
    mockFindPasskeyByCredentialId.mockResolvedValue(mockPasskey);
    mockVerifyAuthentication.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 6 },
    });
    mockCreateAuthToken.mockReturnValue('token-for-user-123');

    await POST(createRequest(validRequestBody, { 'x-forwarded-for': '127.0.0.1' }));

    expect(mockCreateAuthToken).toHaveBeenCalledWith('user-123');
  });
});
