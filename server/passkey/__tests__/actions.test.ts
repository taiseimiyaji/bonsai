import { describe, it, expect, beforeEach, vi } from 'vitest';

// prisma モックを先に定義（vi.hoisted でホイスティング対応）
const mockPrisma = vi.hoisted(() => ({
  passkey: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  account: {
    findFirst: vi.fn(),
  },
}));

vi.mock('@/prisma/prisma', () => ({
  prisma: mockPrisma,
}));

import {
  createPasskey,
  findPasskeysByUserId,
  findPasskeyByCredentialId,
  updatePasskeyCounter,
  deletePasskey,
  renamePasskey,
} from '../actions';

describe('Passkey Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPasskey', () => {
    it('新しいPassKeyレコードを作成できる', async () => {
      const passkeyData = {
        userId: 'user-123',
        credentialId: 'credential-abc',
        credentialPublicKey: Buffer.from('public-key-bytes'),
        counter: BigInt(0),
        transports: JSON.stringify(['internal', 'hybrid']),
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        name: 'iPhone',
      };

      const expectedResult = {
        id: 'passkey-1',
        ...passkeyData,
        createdAt: new Date(),
      };

      mockPrisma.passkey.create.mockResolvedValue(expectedResult);

      const result = await createPasskey(passkeyData);

      expect(result).toEqual(expectedResult);
      expect(mockPrisma.passkey.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.passkey.create).toHaveBeenCalledWith({
        data: passkeyData,
      });
    });

    it('名前なしでPassKeyを作成できる', async () => {
      const passkeyData = {
        userId: 'user-123',
        credentialId: 'credential-def',
        credentialPublicKey: Buffer.from('public-key-bytes'),
        counter: BigInt(0),
        transports: null,
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        name: null,
      };

      const expectedResult = {
        id: 'passkey-2',
        ...passkeyData,
        createdAt: new Date(),
      };

      mockPrisma.passkey.create.mockResolvedValue(expectedResult);

      const result = await createPasskey(passkeyData);

      expect(result).toEqual(expectedResult);
      expect(mockPrisma.passkey.create).toHaveBeenCalledWith({
        data: passkeyData,
      });
    });
  });

  describe('findPasskeysByUserId', () => {
    it('ユーザーの全PassKeyを取得できる', async () => {
      const userId = 'user-123';
      const passkeys = [
        {
          id: 'passkey-1',
          userId,
          credentialId: 'cred-1',
          name: 'iPhone',
          createdAt: new Date('2026-01-01'),
        },
        {
          id: 'passkey-2',
          userId,
          credentialId: 'cred-2',
          name: 'MacBook',
          createdAt: new Date('2026-02-01'),
        },
      ];

      mockPrisma.passkey.findMany.mockResolvedValue(passkeys);

      const result = await findPasskeysByUserId(userId);

      expect(result).toEqual(passkeys);
      expect(mockPrisma.passkey.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('PassKeyが存在しないユーザーの場合は空配列を返す', async () => {
      mockPrisma.passkey.findMany.mockResolvedValue([]);

      const result = await findPasskeysByUserId('user-no-passkeys');

      expect(result).toEqual([]);
    });
  });

  describe('findPasskeyByCredentialId', () => {
    it('credentialIdでPassKeyを検索できる', async () => {
      const passkey = {
        id: 'passkey-1',
        userId: 'user-123',
        credentialId: 'credential-abc',
        credentialPublicKey: Buffer.from('key'),
        counter: BigInt(5),
      };

      mockPrisma.passkey.findUnique.mockResolvedValue(passkey);

      const result = await findPasskeyByCredentialId('credential-abc');

      expect(result).toEqual(passkey);
      expect(mockPrisma.passkey.findUnique).toHaveBeenCalledWith({
        where: { credentialId: 'credential-abc' },
      });
    });

    it('存在しないcredentialIdの場合はnullを返す', async () => {
      mockPrisma.passkey.findUnique.mockResolvedValue(null);

      const result = await findPasskeyByCredentialId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updatePasskeyCounter', () => {
    it('PassKeyのcounterを更新できる', async () => {
      const updated = {
        id: 'passkey-1',
        credentialId: 'credential-abc',
        counter: BigInt(10),
      };

      mockPrisma.passkey.update.mockResolvedValue(updated);

      const result = await updatePasskeyCounter('credential-abc', BigInt(10));

      expect(result).toEqual(updated);
      expect(mockPrisma.passkey.update).toHaveBeenCalledWith({
        where: { credentialId: 'credential-abc' },
        data: { counter: BigInt(10) },
      });
    });
  });

  describe('deletePasskey', () => {
    it('自分のPassKeyを削除できる（複数Passkey所有時）', async () => {
      const passkey = {
        id: 'passkey-1',
        userId: 'user-123',
        credentialId: 'cred-1',
      };

      mockPrisma.passkey.findFirst.mockResolvedValue(passkey);
      mockPrisma.passkey.count.mockResolvedValue(2);
      mockPrisma.passkey.delete.mockResolvedValue(passkey);

      const result = await deletePasskey('passkey-1', 'user-123');

      expect(result).toEqual(passkey);
      expect(mockPrisma.passkey.findFirst).toHaveBeenCalledWith({
        where: { id: 'passkey-1', userId: 'user-123' },
      });
      expect(mockPrisma.passkey.delete).toHaveBeenCalledWith({
        where: { id: 'passkey-1' },
      });
    });

    it('他ユーザーのPassKeyは削除できない', async () => {
      mockPrisma.passkey.findFirst.mockResolvedValue(null);

      await expect(
        deletePasskey('passkey-1', 'other-user')
      ).rejects.toThrow();

      expect(mockPrisma.passkey.delete).not.toHaveBeenCalled();
    });

    it('存在しないPassKeyの削除はエラーになる', async () => {
      mockPrisma.passkey.findFirst.mockResolvedValue(null);

      await expect(
        deletePasskey('nonexistent', 'user-123')
      ).rejects.toThrow();

      expect(mockPrisma.passkey.delete).not.toHaveBeenCalled();
    });

    it('最後のPassKeyかつ代替認証手段がない場合は削除を拒否する', async () => {
      const passkey = {
        id: 'passkey-1',
        userId: 'user-123',
        credentialId: 'cred-1',
      };

      mockPrisma.passkey.findFirst.mockResolvedValue(passkey);
      mockPrisma.passkey.count.mockResolvedValue(1);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        googleId: null,
      });
      mockPrisma.account.findFirst.mockResolvedValue(null);

      await expect(
        deletePasskey('passkey-1', 'user-123')
      ).rejects.toThrow();

      expect(mockPrisma.passkey.delete).not.toHaveBeenCalled();
    });

    it('最後のPassKeyでもgoogleIdがあれば削除できる', async () => {
      const passkey = {
        id: 'passkey-1',
        userId: 'user-123',
        credentialId: 'cred-1',
      };

      mockPrisma.passkey.findFirst.mockResolvedValue(passkey);
      mockPrisma.passkey.count.mockResolvedValue(1);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        googleId: 'google-id-abc',
      });
      mockPrisma.passkey.delete.mockResolvedValue(passkey);

      const result = await deletePasskey('passkey-1', 'user-123');

      expect(result).toEqual(passkey);
      expect(mockPrisma.passkey.delete).toHaveBeenCalledWith({
        where: { id: 'passkey-1' },
      });
    });

    it('最後のPassKeyでもOAuthアカウントがあれば削除できる', async () => {
      const passkey = {
        id: 'passkey-1',
        userId: 'user-123',
        credentialId: 'cred-1',
      };

      mockPrisma.passkey.findFirst.mockResolvedValue(passkey);
      mockPrisma.passkey.count.mockResolvedValue(1);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        googleId: null,
      });
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account-1',
        provider: 'google',
        userId: 'user-123',
      });
      mockPrisma.passkey.delete.mockResolvedValue(passkey);

      const result = await deletePasskey('passkey-1', 'user-123');

      expect(result).toEqual(passkey);
      expect(mockPrisma.passkey.delete).toHaveBeenCalledWith({
        where: { id: 'passkey-1' },
      });
    });
  });

  describe('renamePasskey', () => {
    it('自分のPassKeyの名前を変更できる', async () => {
      const passkey = {
        id: 'passkey-1',
        userId: 'user-123',
        credentialId: 'cred-1',
        name: 'Old Name',
      };
      const updatedPasskey = {
        ...passkey,
        name: 'New Name',
      };

      mockPrisma.passkey.findFirst.mockResolvedValue(passkey);
      mockPrisma.passkey.update.mockResolvedValue(updatedPasskey);

      const result = await renamePasskey('passkey-1', 'user-123', 'New Name');

      expect(result).toEqual(updatedPasskey);
      expect(mockPrisma.passkey.findFirst).toHaveBeenCalledWith({
        where: { id: 'passkey-1', userId: 'user-123' },
      });
      expect(mockPrisma.passkey.update).toHaveBeenCalledWith({
        where: { id: 'passkey-1' },
        data: { name: 'New Name' },
      });
    });

    it('他ユーザーのPassKeyの名前は変更できない', async () => {
      mockPrisma.passkey.findFirst.mockResolvedValue(null);

      await expect(
        renamePasskey('passkey-1', 'other-user', 'New Name')
      ).rejects.toThrow();

      expect(mockPrisma.passkey.update).not.toHaveBeenCalled();
    });

    it('存在しないPassKeyの名前変更はエラーになる', async () => {
      mockPrisma.passkey.findFirst.mockResolvedValue(null);

      await expect(
        renamePasskey('nonexistent', 'user-123', 'New Name')
      ).rejects.toThrow();

      expect(mockPrisma.passkey.update).not.toHaveBeenCalled();
    });
  });
});
