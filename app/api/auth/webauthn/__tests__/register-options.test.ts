import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));
const mockAuth = vi.hoisted(() => vi.fn());
const mockCreateRegistrationOptions = vi.hoisted(() => vi.fn());
const mockFindPasskeysByUserId = vi.hoisted(() => vi.fn());
const mockCheckRateLimit = vi.hoisted(() => vi.fn());
const mockSignCookie = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/app/lib/webauthn/registration', () => ({
  createRegistrationOptions: mockCreateRegistrationOptions,
}));

vi.mock('@/server/passkey/actions', () => ({
  findPasskeysByUserId: mockFindPasskeysByUserId,
}));

vi.mock('@/app/lib/webauthn/config', () => ({
  CHALLENGE_COOKIE_NAME: '__webauthn_challenge',
  USER_COOKIE_NAME: '__webauthn_user',
  challengeCookieOptions: {
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
  signCookie: mockSignCookie,
}));

import { POST } from '../register-options/route';

function createRequest(body: Record<string, unknown> = {}, headers: HeadersInit = {}): NextRequest {
  return new NextRequest('http://localhost/api/auth/webauthn/register-options', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/webauthn/register-options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({ allowed: true });
    mockSignCookie.mockImplementation((value: string) => `signed:${value}`);
  });

  describe('when the user is authenticated', () => {
    const sessionUser = {
      user: { id: 'user-123', email: 'user@example.com', name: 'Test User' },
    };

    it('uses the session data and returns registration options', async () => {
      mockAuth.mockResolvedValue(sessionUser);
      mockFindPasskeysByUserId.mockResolvedValue([{ credentialId: 'existing-cred-1' }]);
      const mockOptions = {
        challenge: 'reg-challenge',
        rp: { name: 'bonsai', id: 'localhost' },
        user: { id: 'user-123', name: 'Test User', displayName: 'user@example.com' },
      };
      mockCreateRegistrationOptions.mockResolvedValue(mockOptions);

      const response = await POST(
        createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockOptions);
    });

    it('passes existing credential IDs for exclusion', async () => {
      mockAuth.mockResolvedValue(sessionUser);
      mockFindPasskeysByUserId.mockResolvedValue([
        { credentialId: 'cred-1' },
        { credentialId: 'cred-2' },
      ]);
      mockCreateRegistrationOptions.mockResolvedValue({ challenge: 'c' });

      await POST(createRequest({}, { 'x-forwarded-for': '127.0.0.1' }));

      expect(mockCreateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          existingCredentialIds: ['cred-1', 'cred-2'],
        }),
      );
    });

    it('sets signed challenge and user cookies', async () => {
      mockAuth.mockResolvedValue(sessionUser);
      mockFindPasskeysByUserId.mockResolvedValue([]);
      mockCreateRegistrationOptions.mockResolvedValue({ challenge: 'my-challenge' });

      await POST(createRequest({}, { 'x-forwarded-for': '127.0.0.1' }));

      expect(mockSignCookie).toHaveBeenCalledWith('my-challenge');
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        '__webauthn_challenge',
        'signed:my-challenge',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        '__webauthn_user',
        expect.stringContaining('signed:'),
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('continues when IP headers are missing and still performs rate limiting', async () => {
      mockAuth.mockResolvedValue(sessionUser);
      mockFindPasskeysByUserId.mockResolvedValue([]);
      mockCreateRegistrationOptions.mockResolvedValue({ challenge: 'fallback-ip' });

      const response = await POST(createRequest());

      expect(response.status).toBe(200);
      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        expect.stringMatching(/^register-options:/),
        10,
        60_000,
      );
    });
  });

  describe('when the session has null email or name', () => {
    it('returns 400 when email is null', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: null, name: 'Test' },
      });

      const response = await POST(
        createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
      );

      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain('メールアドレスまたは名前');
    });

    it('returns 400 when name is null', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'a@b.com', name: null },
      });

      const response = await POST(
        createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
      );

      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain('メールアドレスまたは名前');
    });

    it('returns 400 when both email and name are null', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: null, name: null },
      });

      const response = await POST(
        createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
      );

      expect(response.status).toBe(400);
      expect(mockCreateRegistrationOptions).not.toHaveBeenCalled();
    });
  });

  describe('when the user is not authenticated', () => {
    it('returns 401 for an unauthenticated user', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await POST(
        createRequest(
          { email: 'new@example.com', name: 'New User' },
          { 'x-forwarded-for': '127.0.0.1' },
        ),
      );

      expect(response.status).toBe(401);
    });

    it('returns 401 even with valid email and name', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await POST(
        createRequest(
          { email: 'a@b.com', name: 'Test' },
          { 'x-forwarded-for': '127.0.0.1' },
        ),
      );

      expect(response.status).toBe(401);
      expect(mockCreateRegistrationOptions).not.toHaveBeenCalled();
    });

    it('returns 401 without email or name', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await POST(
        createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
      );

      expect(response.status).toBe(401);
    });
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 30000 });

    const response = await POST(
      createRequest(
        { email: 'a@b.com', name: 'Test' },
        { 'x-forwarded-for': '127.0.0.1' },
      ),
    );

    expect(response.status).toBe(429);
  });

  it('returns 500 when createRegistrationOptions throws', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'a@b.com', name: 'Test' },
    });
    mockFindPasskeysByUserId.mockResolvedValue([]);
    mockCreateRegistrationOptions.mockRejectedValue(new Error('options generation failed'));

    const response = await POST(
      createRequest({}, { 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBeDefined();
  });
});
