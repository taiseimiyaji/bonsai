import { beforeEach, describe, expect, it, vi } from 'vitest';

type PasskeyAuthorize = (
  credentials: Record<string, unknown>,
  request: Request,
) => Promise<{
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
} | null>;

const credentialsState = vi.hoisted(() => ({
  authorize: undefined as PasskeyAuthorize | undefined,
}));

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  passkey: {
    findFirst: vi.fn(),
  },
}));

const mockVerifyAndConsumeAuthToken = vi.hoisted(() => vi.fn());

vi.mock('@/prisma/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/server/passkey/auth-token', () => ({
  verifyAndConsumeAuthToken: mockVerifyAndConsumeAuthToken,
}));

vi.mock('@auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn().mockReturnValue({}),
}));

vi.mock('next-auth/providers/google', () => ({
  default: vi.fn().mockReturnValue({ id: 'google', type: 'oauth' }),
}));

vi.mock('@/app/lib/webauthn/config', () => ({
  AUTH_TOKEN_COOKIE_NAME: '__passkey_auth_token',
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn().mockImplementation(
    (config: { id: string; authorize: PasskeyAuthorize }) => {
      credentialsState.authorize = config.authorize;
      return { id: config.id, type: 'credentials' };
    },
  ),
}));

vi.mock('next-auth', () => ({
  default: vi.fn().mockImplementation(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
  })),
}));

import '@/auth';

function getAuthorize(): PasskeyAuthorize {
  if (!credentialsState.authorize) {
    throw new Error('authorize function not captured from Credentials provider');
  }

  return credentialsState.authorize;
}

function createRequestWithCookieHeader(cookieHeader?: string): Request {
  return new Request('http://localhost/auth/passkey', {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });
}

describe('auth.ts authorize function (SEC-001)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects authentication when the cookie header is missing', async () => {
    const authorize = getAuthorize();

    const result = await authorize({}, createRequestWithCookieHeader());

    expect(result).toBeNull();
  });

  it('rejects authentication when authToken cookie is empty', async () => {
    const authorize = getAuthorize();

    const result = await authorize({}, createRequestWithCookieHeader(''));

    expect(result).toBeNull();
  });

  it('reads the auth token from a cookie header without spaces between entries', async () => {
    const authorize = getAuthorize();
    mockVerifyAndConsumeAuthToken.mockReturnValue('user-123');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.png',
    });

    const result = await authorize(
      {},
      createRequestWithCookieHeader(
        'foo=1;bar=2;__passkey_auth_token=valid-auth-token',
      ),
    );

    expect(result).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.png',
    });
    expect(mockVerifyAndConsumeAuthToken).toHaveBeenCalledWith('valid-auth-token');
  });

  it('reads the auth token from a cookie header with spaces between entries', async () => {
    const authorize = getAuthorize();
    mockVerifyAndConsumeAuthToken.mockReturnValue('user-123');
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.png',
    });

    const result = await authorize(
      {},
      createRequestWithCookieHeader(
        'foo=1; bar=2; __passkey_auth_token=valid-auth-token',
      ),
    );

    expect(result).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.png',
    });
    expect(mockVerifyAndConsumeAuthToken).toHaveBeenCalledWith('valid-auth-token');
  });

  it('rejects authentication when token verification fails', async () => {
    const authorize = getAuthorize();
    mockVerifyAndConsumeAuthToken.mockReturnValue(null);

    const result = await authorize(
      {},
      createRequestWithCookieHeader('__passkey_auth_token=tampered-token'),
    );

    expect(result).toBeNull();
    expect(mockVerifyAndConsumeAuthToken).toHaveBeenCalledWith('tampered-token');
  });

  it('returns null when the user does not exist in the database', async () => {
    const authorize = getAuthorize();
    mockVerifyAndConsumeAuthToken.mockReturnValue('nonexistent-user');
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await authorize(
      {},
      createRequestWithCookieHeader('__passkey_auth_token=valid-token-bad-user'),
    );

    expect(result).toBeNull();
  });

  it('does not allow authentication with passkeyUserId alone', async () => {
    const authorize = getAuthorize();
    mockVerifyAndConsumeAuthToken.mockReturnValue(null);

    const result = await authorize(
      { passkeyUserId: 'user-123' },
      createRequestWithCookieHeader(),
    );

    expect(result).toBeNull();
  });
});
