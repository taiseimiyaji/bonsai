import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockStartAuthentication = vi.hoisted(() => vi.fn());
const mockStartRegistration = vi.hoisted(() => vi.fn());
const mockBrowserSupportsWebAuthn = vi.hoisted(() => vi.fn());

vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: mockStartAuthentication,
  startRegistration: mockStartRegistration,
  browserSupportsWebAuthn: mockBrowserSupportsWebAuthn,
}));

import {
  performPasskeyAuthentication,
  performPasskeyRegistration,
  isPasskeySupported,
} from '../passkey-client';

describe('passkey-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('performPasskeyAuthentication', () => {
    it('should complete login flow without returning authToken (cookie-based)', async () => {
      const mockOptions = { challenge: 'auth-challenge', allowCredentials: [] };
      const mockAuthResponse = { id: 'cred-1', response: { authenticatorData: 'data' } };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockOptions), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ verified: true }), { status: 200 }),
        );
      mockStartAuthentication.mockResolvedValue(mockAuthResponse);

      const result = await performPasskeyAuthentication();

      expect(result).toBeUndefined();
    });

    it('should call login-options endpoint first', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ verified: true }), { status: 200 }),
        );
      mockStartAuthentication.mockResolvedValue({ id: 'cred' });

      await performPasskeyAuthentication();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/webauthn/login-options'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should pass authentication response to login-verify endpoint', async () => {
      const authResponse = { id: 'cred-1', rawId: 'raw', response: { data: 'x' } };
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ verified: true }), { status: 200 }),
        );
      mockStartAuthentication.mockResolvedValue(authResponse);

      await performPasskeyAuthentication();

      const verifyCall = vi.mocked(global.fetch).mock.calls[1];
      expect(verifyCall[0]).toContain('/api/auth/webauthn/login-verify');
      const body = JSON.parse(verifyCall[1]?.body as string);
      expect(body).toEqual(authResponse);
    });

    it('should throw when login-options request fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'server error' }), { status: 500 }),
      );

      await expect(performPasskeyAuthentication()).rejects.toThrow();
    });

    it('should throw when login-verify request fails', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: '認証に失敗しました' }), { status: 400 }),
        );
      mockStartAuthentication.mockResolvedValue({ id: 'cred' });

      await expect(performPasskeyAuthentication()).rejects.toThrow();
    });

    it('should convert NotAllowedError to user-friendly message', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
      );
      const notAllowedError = new DOMException('User cancelled', 'NotAllowedError');
      mockStartAuthentication.mockRejectedValue(notAllowedError);

      await expect(performPasskeyAuthentication()).rejects.toThrow();
      try {
        await performPasskeyAuthentication();
      } catch (err) {
        expect((err as Error).name).not.toBe('NotAllowedError');
      }
    });
  });

  describe('performPasskeyRegistration', () => {
    it('should complete registration flow and return result', async () => {
      const mockOptions = { challenge: 'reg-challenge', rp: { name: 'test' } };
      const mockRegResponse = { id: 'new-cred', response: { attestationObject: 'obj' } };

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockOptions), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ verified: true }),
            { status: 200 },
          ),
        );
      mockStartRegistration.mockResolvedValue(mockRegResponse);

      const result = await performPasskeyRegistration();

      expect(result).toEqual(
        expect.objectContaining({ verified: true }),
      );
    });

    it('should call register-options endpoint', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ verified: true }), { status: 200 }),
        );
      mockStartRegistration.mockResolvedValue({ id: 'cred' });

      await performPasskeyRegistration();

      const optionsCall = vi.mocked(global.fetch).mock.calls[0];
      expect(optionsCall[0]).toContain('/api/auth/webauthn/register-options');
      expect(optionsCall[1]).toEqual(expect.objectContaining({ method: 'POST' }));
    });

    it('should pass registration response to register-verify endpoint', async () => {
      const regResponse = { id: 'new-cred', response: { attestationObject: 'obj', clientDataJSON: 'json' } };
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ verified: true }), { status: 200 }),
        );
      mockStartRegistration.mockResolvedValue(regResponse);

      await performPasskeyRegistration();

      const verifyCall = vi.mocked(global.fetch).mock.calls[1];
      expect(verifyCall[0]).toContain('/api/auth/webauthn/register-verify');
      const body = JSON.parse(verifyCall[1]?.body as string);
      expect(body).toEqual(regResponse);
    });

    it('should forward passkeyName to register-verify when provided', async () => {
      const regResponse = {
        id: 'new-cred',
        response: { attestationObject: 'obj', clientDataJSON: 'json' },
      };
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ verified: true }), { status: 200 }),
        );
      mockStartRegistration.mockResolvedValue(regResponse);

      await performPasskeyRegistration({ passkeyName: 'Work MacBook' });

      const verifyCall = vi.mocked(global.fetch).mock.calls[1];
      const body = JSON.parse(verifyCall[1]?.body as string);
      expect(body).toEqual({
        ...regResponse,
        passkeyName: 'Work MacBook',
      });
    });

    it('should throw when register-options request fails', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'error' }), { status: 500 }),
      );

      await expect(
        performPasskeyRegistration(),
      ).rejects.toThrow();
    });

    it('should throw when register-verify request fails', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: '登録に失敗しました' }), { status: 400 }),
        );
      mockStartRegistration.mockResolvedValue({ id: 'cred' });

      await expect(
        performPasskeyRegistration(),
      ).rejects.toThrow();
    });

    it('should convert NotAllowedError to user-friendly message', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
      );
      const notAllowedError = new DOMException('User cancelled', 'NotAllowedError');
      mockStartRegistration.mockRejectedValue(notAllowedError);

      await expect(
        performPasskeyRegistration(),
      ).rejects.toThrow();

      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
      );
      mockStartRegistration.mockRejectedValue(notAllowedError);
      try {
        await performPasskeyRegistration();
      } catch (err) {
        expect((err as Error).name).not.toBe('NotAllowedError');
      }
    });

    it('should throw when register-verify returns 409 (duplicate email)', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ challenge: 'c' }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ error: 'このメールアドレスは既に登録されています' }),
            { status: 409 },
          ),
        );
      mockStartRegistration.mockResolvedValue({ id: 'cred' });

      await expect(
        performPasskeyRegistration(),
      ).rejects.toThrow();
    });
  });

  describe('isPasskeySupported', () => {
    it('should return true when browser supports WebAuthn', () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(true);

      expect(isPasskeySupported()).toBe(true);
    });

    it('should return false when browser does not support WebAuthn', () => {
      mockBrowserSupportsWebAuthn.mockReturnValue(false);

      expect(isPasskeySupported()).toBe(false);
    });
  });
});
