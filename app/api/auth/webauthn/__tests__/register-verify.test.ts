import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));
const mockAuth = vi.hoisted(() => vi.fn());
const mockVerifyRegistration = vi.hoisted(() => vi.fn());
const mockCreatePasskey = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() => vi.fn());
const mockVerifyCookie = vi.hoisted(() => vi.fn());
const mockCreateAuthToken = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/app/lib/webauthn/registration', () => ({
  verifyRegistration: mockVerifyRegistration,
}));

vi.mock('@/server/passkey/actions', () => ({
  createPasskey: mockCreatePasskey,
}));

vi.mock('@/app/lib/webauthn/config', () => ({
  CHALLENGE_COOKIE_NAME: '__webauthn_challenge',
  USER_COOKIE_NAME: '__webauthn_user',
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

import { POST } from '../register-verify/route';

function createRequest(
  body: Record<string, unknown>,
  headers: HeadersInit = {},
): NextRequest {
  return new NextRequest('http://localhost/api/auth/webauthn/register-verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const mockUserData = JSON.stringify({
  userId: 'new-user-uuid',
  email: 'new@example.com',
  name: 'New User',
});

const mockVerificationResult = {
  verified: true,
  registrationInfo: {
    credential: {
      id: 'new-cred-id',
      publicKey: new Uint8Array([1, 2, 3]),
      counter: 0,
    },
    credentialDeviceType: 'multiDevice',
    credentialBackedUp: true,
  },
};

describe('POST /api/auth/webauthn/register-verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({ allowed: true });
    mockVerifyCookie.mockImplementation((value: string) => value.replace('signed:', ''));
    mockCreateAuthToken.mockReturnValue('auth-token-new');
  });

  function setupCookies(challenge: string, userData: string) {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === '__webauthn_challenge') {
        return { value: `signed:${challenge}` };
      }
      if (name === '__webauthn_user') {
        return { value: `signed:${userData}` };
      }
      if (name === '__passkey_auth_token') {
        return { value: 'stale-auth-token' };
      }

      return undefined;
    });
  }

  describe('when the user is authenticated', () => {
    it('adds the passkey to the existing user and does not return authToken in the body', async () => {
      setupCookies('test-challenge', mockUserData);
      mockAuth.mockResolvedValue({ user: { id: 'existing-user-id' } });
      mockVerifyRegistration.mockResolvedValue(mockVerificationResult);
      mockCreatePasskey.mockResolvedValue({ id: 'passkey-1' });

      const response = await POST(
        createRequest(
          { response: { transports: ['internal'] } },
          { 'x-forwarded-for': '127.0.0.1' },
        ),
      );

      expect(response.status).toBe(200);
      expect((await response.json()).authToken).toBeUndefined();
    });

    it('uses the session userId for passkey creation', async () => {
      setupCookies('challenge', mockUserData);
      mockAuth.mockResolvedValue({ user: { id: 'session-user-id' } });
      mockVerifyRegistration.mockResolvedValue(mockVerificationResult);
      mockCreatePasskey.mockResolvedValue({ id: 'pk-1' });

      await POST(
        createRequest(
          { response: { transports: ['internal'] } },
          { 'x-forwarded-for': '127.0.0.1' },
        ),
      );

      expect(mockCreatePasskey).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'session-user-id',
          credentialId: 'new-cred-id',
        }),
      );
    });

    it('deletes challenge, user, and stale auth cookies after successful registration', async () => {
      setupCookies('challenge', mockUserData);
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockVerifyRegistration.mockResolvedValue(mockVerificationResult);
      mockCreatePasskey.mockResolvedValue({ id: 'pk-1' });

      await POST(
        createRequest(
          { response: { transports: ['internal'] } },
          { 'x-forwarded-for': '127.0.0.1' },
        ),
      );

      expect(mockCookieStore.delete).toHaveBeenCalledWith('__webauthn_challenge');
      expect(mockCookieStore.delete).toHaveBeenCalledWith('__webauthn_user');
      expect(mockCookieStore.delete).toHaveBeenCalledWith('__passkey_auth_token');
    });

    it('does not create or set a new auth token after successful registration', async () => {
      setupCookies('challenge', mockUserData);
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockVerifyRegistration.mockResolvedValue(mockVerificationResult);
      mockCreatePasskey.mockResolvedValue({ id: 'pk-1' });

      await POST(
        createRequest(
          { response: { transports: ['internal'] } },
          { 'x-forwarded-for': '127.0.0.1' },
        ),
      );

      expect(mockCreateAuthToken).not.toHaveBeenCalled();
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('continues when IP headers are missing and still performs rate limiting', async () => {
      setupCookies('challenge', mockUserData);
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockVerifyRegistration.mockResolvedValue(mockVerificationResult);
      mockCreatePasskey.mockResolvedValue({ id: 'pk-1' });

      const response = await POST(
        createRequest({ response: { transports: ['internal'] } }),
      );

      expect(response.status).toBe(200);
      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        expect.stringMatching(/^register-verify:/),
        5,
        60_000,
      );
    });
  });

  describe('when the user is not authenticated', () => {
    it('returns 401 for an unauthenticated user', async () => {
      setupCookies('challenge', mockUserData);
      mockAuth.mockResolvedValue(null);
      mockVerifyRegistration.mockResolvedValue(mockVerificationResult);

      const response = await POST(
        createRequest(
          { response: { transports: ['internal', 'hybrid'] } },
          { 'x-forwarded-for': '127.0.0.1' },
        ),
      );

      expect(response.status).toBe(401);
    });

    it('does not create a passkey for an unauthenticated user', async () => {
      setupCookies('challenge', mockUserData);
      mockAuth.mockResolvedValue(null);
      mockVerifyRegistration.mockResolvedValue(mockVerificationResult);

      await POST(
        createRequest(
          { response: { transports: [] } },
          { 'x-forwarded-for': '127.0.0.1' },
        ),
      );

      expect(mockCreatePasskey).not.toHaveBeenCalled();
    });
  });

  describe('validation errors', () => {
    it('returns 400 when the challenge cookie is missing', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const response = await POST(
        createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
      );

      expect(response.status).toBe(400);
    });

    it('returns 400 when the user data cookie is missing', async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === '__webauthn_challenge') {
          return { value: 'signed:challenge' };
        }

        return undefined;
      });

      const response = await POST(
        createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
      );

      expect(response.status).toBe(400);
    });

    it('returns 400 when the challenge cookie signature is invalid', async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === '__webauthn_challenge') {
          return { value: 'tampered' };
        }
        if (name === '__webauthn_user') {
          return { value: `signed:${mockUserData}` };
        }

        return undefined;
      });
      mockVerifyCookie.mockImplementation((value: string) => {
        if (value === 'tampered') {
          return null;
        }

        return value.replace('signed:', '');
      });

      const response = await POST(
        createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
      );

      expect(response.status).toBe(400);
    });

    it('returns 400 when verification fails', async () => {
      setupCookies('challenge', mockUserData);
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockVerifyRegistration.mockResolvedValue({
        verified: false,
        registrationInfo: null,
      });

      const response = await POST(
        createRequest(
          { response: { authenticatorData: 'bad' } },
          { 'x-forwarded-for': '127.0.0.1' },
        ),
      );

      expect(response.status).toBe(400);
    });
  });

  it('stores transports as a JSON string and forwards passkeyName', async () => {
    setupCookies('challenge', mockUserData);
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockVerifyRegistration.mockResolvedValue(mockVerificationResult);
    mockCreatePasskey.mockResolvedValue({ id: 'pk-1' });

    await POST(
      createRequest(
        {
          response: { transports: ['internal', 'hybrid'] },
          passkeyName: 'My iPhone',
        },
        { 'x-forwarded-for': '127.0.0.1' },
      ),
    );

    expect(mockCreatePasskey).toHaveBeenCalledWith(
      expect.objectContaining({
        transports: JSON.stringify(['internal', 'hybrid']),
        name: 'My iPhone',
      }),
    );
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 30000 });

    const response = await POST(
      createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(429);
  });

  it('returns 500 when verifyRegistration throws', async () => {
    setupCookies('challenge', mockUserData);
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockVerifyRegistration.mockRejectedValue(new Error('verification explosion'));

    const response = await POST(
      createRequest(
        { response: {} },
        { 'x-forwarded-for': '127.0.0.1' },
      ),
    );

    expect(response.status).toBe(500);
  });
});
