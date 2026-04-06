import { describe, it, expect, beforeEach, vi } from 'vitest';

// @simplewebauthn/server のモック
vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(),
  verifyRegistrationResponse: vi.fn(),
}));

vi.mock('@simplewebauthn/server/helpers', () => ({
  isoUint8Array: {
    fromUTF8String: vi.fn((str: string) => new TextEncoder().encode(str)),
  },
}));

vi.mock('../config', () => ({
  rpName: 'Test App',
  getRpID: vi.fn(() => 'localhost'),
  getRpOrigin: vi.fn(() => 'http://localhost:3000'),
}));

import {
  generateRegistrationOptions as simpleGenerateOptions,
  verifyRegistrationResponse as simpleVerifyResponse,
} from '@simplewebauthn/server';
import {
  createRegistrationOptions,
  verifyRegistration,
} from '../registration';

describe('WebAuthn Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRegistrationOptions', () => {
    it('ユーザー情報を含む登録オプションを生成できる', async () => {
      const expectedOptions = {
        challenge: 'test-challenge-base64url',
        rp: { name: 'Test App', id: 'localhost' },
        user: {
          id: 'user-123',
          name: 'test@example.com',
          displayName: 'Test User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        excludeCredentials: [],
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      };

      vi.mocked(simpleGenerateOptions).mockResolvedValue(expectedOptions as any);

      const result = await createRegistrationOptions({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        existingCredentialIds: [],
      });

      expect(result).toEqual(expectedOptions);
      expect(simpleGenerateOptions).toHaveBeenCalledTimes(1);
      expect(simpleGenerateOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpName: 'Test App',
          rpID: 'localhost',
          userID: expect.any(Uint8Array),
          userName: 'test@example.com',
          userDisplayName: 'Test User',
        })
      );
    });

    it('既存のcredentialIdを除外リストに含める', async () => {
      vi.mocked(simpleGenerateOptions).mockResolvedValue({
        challenge: 'test-challenge',
      } as any);

      const existingCredentialIds = ['cred-1', 'cred-2'];

      await createRegistrationOptions({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        existingCredentialIds,
      });

      expect(simpleGenerateOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: expect.arrayContaining([
            expect.objectContaining({ id: 'cred-1' }),
            expect.objectContaining({ id: 'cred-2' }),
          ]),
        })
      );
    });

    it('既存のPassKeyがない場合は空の除外リストを渡す', async () => {
      vi.mocked(simpleGenerateOptions).mockResolvedValue({
        challenge: 'test-challenge',
      } as any);

      await createRegistrationOptions({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        existingCredentialIds: [],
      });

      expect(simpleGenerateOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: [],
        })
      );
    });
  });

  describe('verifyRegistration', () => {
    it('有効な登録レスポンスを検証できる', async () => {
      const verificationResult = {
        verified: true,
        registrationInfo: {
          credential: {
            id: 'new-credential-id',
            publicKey: new Uint8Array([1, 2, 3]),
            counter: 0,
          },
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
        },
      };

      vi.mocked(simpleVerifyResponse).mockResolvedValue(verificationResult as any);

      const response = {
        id: 'response-id',
        rawId: 'raw-response-id',
        response: {
          attestationObject: 'attestation-data',
          clientDataJSON: 'client-data',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      const result = await verifyRegistration({
        response,
        expectedChallenge: 'test-challenge',
      });

      expect(result.verified).toBe(true);
      expect(result.registrationInfo).toBeDefined();
      expect(simpleVerifyResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: 'test-challenge',
          expectedOrigin: 'http://localhost:3000',
          expectedRPID: 'localhost',
        })
      );
    });

    it('無効な登録レスポンスは検証に失敗する', async () => {
      vi.mocked(simpleVerifyResponse).mockResolvedValue({
        verified: false,
        registrationInfo: undefined,
      } as any);

      const response = {
        id: 'invalid-response-id',
        rawId: 'raw-invalid',
        response: {
          attestationObject: 'invalid-attestation',
          clientDataJSON: 'invalid-client-data',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      const result = await verifyRegistration({
        response,
        expectedChallenge: 'test-challenge',
      });

      expect(result.verified).toBe(false);
    });

    it('@simplewebauthn/serverが例外を投げた場合はエラーを伝播する', async () => {
      vi.mocked(simpleVerifyResponse).mockRejectedValue(
        new Error('Invalid attestation')
      );

      const response = {
        id: 'bad-response',
        rawId: 'raw-bad',
        response: {
          attestationObject: 'bad-attestation',
          clientDataJSON: 'bad-client-data',
        },
        type: 'public-key' as const,
        clientExtensionResults: {},
      };

      await expect(
        verifyRegistration({
          response,
          expectedChallenge: 'test-challenge',
        })
      ).rejects.toThrow('Invalid attestation');
    });
  });
});
