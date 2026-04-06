import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('WebAuthn Config', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('AUTH_URL', 'http://127.0.0.1:3000');
  });

  it('rpNameが定義されている', async () => {
    const { rpName } = await import('../config');
    expect(rpName).toBeDefined();
    expect(typeof rpName).toBe('string');
    expect(rpName.length).toBeGreaterThan(0);
  });

  it('環境変数からRP設定を読み取れる', async () => {
    vi.stubEnv('WEBAUTHN_RP_ID', 'example.com');
    vi.stubEnv('WEBAUTHN_ORIGIN', 'https://example.com');
    vi.stubEnv('AUTH_URL', 'https://fallback.example.com');

    vi.resetModules();
    const config = await import('../config');

    expect(config.getRpID()).toBe('example.com');
    expect(config.getRpOrigin()).toBe('https://example.com');
  });

  it('WEBAUTHN_* が未設定でも AUTH_URL からRP設定を導出できる', async () => {
    vi.stubEnv('AUTH_URL', 'https://bonsai.example.com');

    vi.resetModules();
    const config = await import('../config');

    expect(config.getRpID()).toBe('bonsai.example.com');
    expect(config.getRpOrigin()).toBe('https://bonsai.example.com');
  });

  it('RP設定を使わない import では AUTH_URL がなくても失敗しない', async () => {
    vi.unstubAllEnvs();

    vi.resetModules();
    const config = await import('../config');

    expect(config.AUTH_TOKEN_COOKIE_NAME).toBe('__passkey_auth_token');
  });

  it('Cookie名定数がエクスポートされている', async () => {
    const { CHALLENGE_COOKIE_NAME, USER_COOKIE_NAME } = await import('../config');
    expect(CHALLENGE_COOKIE_NAME).toBe('__webauthn_challenge');
    expect(USER_COOKIE_NAME).toBe('__webauthn_user');
  });

  it('challengeCookieOptionsが必須プロパティを含む', async () => {
    const { challengeCookieOptions } = await import('../config');
    expect(challengeCookieOptions.httpOnly).toBe(true);
    expect(challengeCookieOptions.sameSite).toBe('strict');
    expect(challengeCookieOptions.path).toBe('/');
    expect(challengeCookieOptions.maxAge).toBeGreaterThan(0);
  });
});
