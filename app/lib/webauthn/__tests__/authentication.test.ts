import { describe, it, expect, beforeEach, vi } from 'vitest';

// @simplewebauthn/server のモック
vi.mock('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
}));

vi.mock('../config', () => ({
  rpName: 'Test App',
  getRpID: vi.fn(() => 'localhost'),
  getRpOrigin: vi.fn(() => 'http://localhost:3000'),
}));

import {
  generateAuthenticationOptions as simpleGenerateAuthOptions,
  verifyAuthenticationResponse as simpleVerifyAuthResponse,
} from '@simplewebauthn/server';
import {
  createAuthenticationOptions,
  verifyAuthentication,
} from '../authentication';

describe('WebAuthn Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuthenticationOptions', () => {
    it('登録済みcredentialを指定して認証オプションを生成できる', async () => {
      const expectedOptions = {
        challenge: 'auth-challenge-base64url',
        allowCredentials: [
          { id: 'cred-1', type: 'public-key' },
          { id: 'cred-2', type: 'public-key' },
        ],
        userVerification: 'preferred',
        rpId: 'localhost',
      };

      vi.mocked(simpleGenerateAuthOptions).mockResolvedValue(
        expectedOptions as any
      );

      const credentialIds = ['cred-1', 'cred-2'];

      const result = await createAuthenticationOptions(credentialIds);

      expect(result).toEqual(expectedOptions);
      expect(simpleGenerateAuthOptions).toHaveBeenCalledTimes(1);
      expect(simpleGenerateAuthOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: 'localhost',
          allowCredentials: expect.arrayContaining([
            expect.objectContaining({ id: 'cred-1' }),
            expect.objectContaining({ id: 'cred-2' }),
          ]),
        })
      );
    });

    it('credentialId未指定でdiscoverable credential認証オプションを生成できる', async () => {
      const expectedOptions = {
        challenge: 'discoverable-challenge',
        allowCredentials: [],
        userVerification: 'preferred',
        rpId: 'localhost',
      };

      vi.mocked(simpleGenerateAuthOptions).mockResolvedValue(
        expectedOptions as any
      );

      const result = await createAuthenticationOptions([]);

      expect(result).toEqual(expectedOptions);
      expect(simpleGenerateAuthOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: 'localhost',
          allowCredentials: [],
        })
      );
    });
  });

  describe('verifyAuthentication', () => {
    const mockPasskey = {
      credentialId: 'cred-1',
      credentialPublicKey: Buffer.from('public-key-data'),
      counter: BigInt(5),
    };

    it('有効な認証レスポンスを検証できる', async () => {
      const verificationResult = {
        verified: true,
        authenticationInfo: {
          newCounter: 6,
          credentialID: 'cred-1',
          userVerified: true,
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
        },
      };

      vi.mocked(simpleVerifyAuthResponse).mockResolvedValue(
        verificationResult as any
      );

      const response = {
        id: 'cred-1',
        rawId: 'raw-cred-1',
        response: {
          authenticatorData: 'auth-data',
          clientDataJSON: 'client-data',
          signature: 'signature-data',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      const result = await verifyAuthentication({
        response,
        expectedChallenge: 'auth-challenge',
        passkey: mockPasskey,
      });

      expect(result.verified).toBe(true);
      expect(result.authenticationInfo).toBeDefined();
      expect(result.authenticationInfo.newCounter).toBe(6);
      expect(simpleVerifyAuthResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: 'auth-challenge',
          expectedOrigin: 'http://localhost:3000',
          expectedRPID: 'localhost',
        })
      );
    });

    it('無効な認証レスポンスは検証に失敗する', async () => {
      vi.mocked(simpleVerifyAuthResponse).mockResolvedValue({
        verified: false,
        authenticationInfo: undefined,
      } as any);

      const response = {
        id: 'cred-1',
        rawId: 'raw-cred-1',
        response: {
          authenticatorData: 'bad-auth-data',
          clientDataJSON: 'bad-client-data',
          signature: 'bad-signature',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      const result = await verifyAuthentication({
        response,
        expectedChallenge: 'auth-challenge',
        passkey: mockPasskey,
      });

      expect(result.verified).toBe(false);
    });

    it('counterが期待値より小さい場合に@simplewebauthn/serverがエラーを投げるとそれを伝播する', async () => {
      vi.mocked(simpleVerifyAuthResponse).mockRejectedValue(
        new Error('Counter too low')
      );

      const response = {
        id: 'cred-1',
        rawId: 'raw-cred-1',
        response: {
          authenticatorData: 'replay-data',
          clientDataJSON: 'client-data',
          signature: 'replayed-sig',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      await expect(
        verifyAuthentication({
          response,
          expectedChallenge: 'auth-challenge',
          passkey: mockPasskey,
        })
      ).rejects.toThrow('Counter too low');
    });

    it('passkey情報がverifyAuthenticationResponseに渡される', async () => {
      vi.mocked(simpleVerifyAuthResponse).mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 6 },
      } as any);

      const response = {
        id: 'cred-1',
        rawId: 'raw-cred-1',
        response: {
          authenticatorData: 'auth-data',
          clientDataJSON: 'client-data',
          signature: 'signature',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      await verifyAuthentication({
        response,
        expectedChallenge: 'challenge',
        passkey: mockPasskey,
      });

      expect(simpleVerifyAuthResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          credential: expect.objectContaining({
            id: mockPasskey.credentialId,
            publicKey: mockPasskey.credentialPublicKey,
            counter: Number(mockPasskey.counter),
          }),
        })
      );
    });
  });
});
