import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCreateAuthenticationOptions = vi.hoisted(() => vi.fn());
const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));
const mockCheckRateLimit = vi.hoisted(() => vi.fn());
const mockSignCookie = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock('@/app/lib/webauthn/authentication', () => ({
  createAuthenticationOptions: mockCreateAuthenticationOptions,
}));

vi.mock('@/app/lib/webauthn/config', () => ({
  CHALLENGE_COOKIE_NAME: '__webauthn_challenge',
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

import { POST } from '../login-options/route';

function createRequest(headers: HeadersInit = {}): NextRequest {
  return new NextRequest('http://localhost/api/auth/webauthn/login-options', {
    method: 'POST',
    headers,
  });
}

describe('POST /api/auth/webauthn/login-options', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({ allowed: true });
    mockSignCookie.mockImplementation((value: string) => `signed:${value}`);
  });

  it('returns authentication options and sets a signed challenge cookie', async () => {
    const mockOptions = {
      challenge: 'test-challenge-base64url',
      allowCredentials: [],
      userVerification: 'preferred',
      rpId: 'localhost',
    };
    mockCreateAuthenticationOptions.mockResolvedValue(mockOptions);

    const response = await POST(
      createRequest({ 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mockOptions);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      '__webauthn_challenge',
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('calls createAuthenticationOptions with empty credentials for discoverable auth', async () => {
    mockCreateAuthenticationOptions.mockResolvedValue({
      challenge: 'test',
      allowCredentials: [],
    });

    await POST(createRequest({ 'x-forwarded-for': '127.0.0.1' }));

    expect(mockCreateAuthenticationOptions).toHaveBeenCalledWith([]);
  });

  it('continues when IP headers are missing and still performs rate limiting', async () => {
    mockCreateAuthenticationOptions.mockResolvedValue({
      challenge: 'no-ip-challenge',
      allowCredentials: [],
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(200);
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      expect.stringMatching(/^login-options:/),
      10,
      60_000,
    );
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 30000 });

    const response = await POST(
      createRequest({ 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(429);
    expect((await response.json()).error).toBeDefined();
  });

  it('returns 500 when createAuthenticationOptions throws', async () => {
    mockCreateAuthenticationOptions.mockRejectedValue(new Error('generation failed'));

    const response = await POST(
      createRequest({ 'x-forwarded-for': '127.0.0.1' }),
    );

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBeDefined();
  });

  it('signs the challenge cookie value before storing it', async () => {
    mockCreateAuthenticationOptions.mockResolvedValue({ challenge: 'challenge-to-sign' });

    await POST(createRequest({ 'x-forwarded-for': '127.0.0.1' }));

    expect(mockSignCookie).toHaveBeenCalledWith('challenge-to-sign');
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      '__webauthn_challenge',
      'signed:challenge-to-sign',
      expect.any(Object),
    );
  });
});
