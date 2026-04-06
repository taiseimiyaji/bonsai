import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockCookieStore = vi.hoisted(() => ({
  delete: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

vi.mock('@/app/lib/webauthn/config', () => ({
  AUTH_TOKEN_COOKIE_NAME: '__passkey_auth_token',
}));

import { POST } from '../route';

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the passkey auth token cookie', async () => {
    const response = await POST(
      new Request('http://localhost/api/auth/logout', { method: 'POST' }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockCookieStore.delete).toHaveBeenCalledWith('__passkey_auth_token');
  });
});
