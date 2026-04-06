import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { createTRPCContext } from '../../init';
import { passkeyRouter } from '../passkey';

const mockFindPasskeysByUserId = vi.hoisted(() => vi.fn());
const mockDeletePasskey = vi.hoisted(() => vi.fn());
const mockRenamePasskey = vi.hoisted(() => vi.fn());

vi.mock('@/server/passkey/actions', () => ({
  findPasskeysByUserId: mockFindPasskeysByUserId,
  deletePasskey: mockDeletePasskey,
  renamePasskey: mockRenamePasskey,
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
  }),
}));

type AppContext = Awaited<ReturnType<typeof createTRPCContext>>;

function createCallerWithSession(userId: string) {
  const context = {
    session: { user: { id: userId } },
    req: undefined,
  } satisfies AppContext;

  return passkeyRouter.createCaller(context);
}

describe('passkey tRPC router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns mapped passkey data without sensitive fields', async () => {
      const rawPasskeys = [
        {
          id: 'pk-1',
          userId: 'user-123',
          credentialId: 'cred-1',
          credentialPublicKey: Buffer.from('secret-key'),
          counter: BigInt(10),
          name: 'iPhone',
          credentialDeviceType: 'multiDevice',
          credentialBackedUp: true,
          transports: '["internal"]',
          createdAt: new Date('2026-01-15'),
        },
        {
          id: 'pk-2',
          userId: 'user-123',
          credentialId: 'cred-2',
          credentialPublicKey: Buffer.from('another-key'),
          counter: BigInt(3),
          name: null,
          credentialDeviceType: 'singleDevice',
          credentialBackedUp: false,
          transports: null,
          createdAt: new Date('2026-02-20'),
        },
      ];
      mockFindPasskeysByUserId.mockResolvedValue(rawPasskeys);

      const caller = createCallerWithSession('user-123');
      const result = await caller.list();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'pk-1',
        credentialId: 'cred-1',
        name: 'iPhone',
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        createdAt: new Date('2026-01-15'),
      });
      expect(result[1]).toEqual({
        id: 'pk-2',
        credentialId: 'cred-2',
        name: null,
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        createdAt: new Date('2026-02-20'),
      });
      expect(result[0]).not.toHaveProperty('credentialPublicKey');
      expect(result[0]).not.toHaveProperty('counter');
      expect(result[0]).not.toHaveProperty('transports');
    });

    it('returns an empty array when the user has no passkeys', async () => {
      mockFindPasskeysByUserId.mockResolvedValue([]);

      const caller = createCallerWithSession('user-no-passkeys');
      const result = await caller.list();

      expect(result).toEqual([]);
    });

    it('passes the session user id to the list action', async () => {
      mockFindPasskeysByUserId.mockResolvedValue([]);

      const caller = createCallerWithSession('user-abc');
      await caller.list();

      expect(mockFindPasskeysByUserId).toHaveBeenCalledWith('user-abc');
    });
  });

  describe('delete', () => {
    it('deletes the passkey and returns success', async () => {
      mockDeletePasskey.mockResolvedValue({ id: 'pk-1' });

      const caller = createCallerWithSession('user-123');
      const result = await caller.delete({ passkeyId: 'pk-1' });

      expect(result).toEqual({ success: true });
      expect(mockDeletePasskey).toHaveBeenCalledWith('pk-1', 'user-123');
    });

    it('throws when deleting another user passkey', async () => {
      mockDeletePasskey.mockRejectedValue(
        new Error('PassKeyが見つからないか、削除権限がありません'),
      );

      const caller = createCallerWithSession('attacker-user');

      await expect(
        caller.delete({ passkeyId: 'pk-owned-by-other' }),
      ).rejects.toThrow();
    });

    it('throws when the passkey does not exist', async () => {
      mockDeletePasskey.mockRejectedValue(
        new Error('PassKeyが見つからないか、削除権限がありません'),
      );

      const caller = createCallerWithSession('user-123');

      await expect(caller.delete({ passkeyId: 'nonexistent-pk' })).rejects.toThrow();
    });

    it('passes the session user id for the ownership check', async () => {
      mockDeletePasskey.mockResolvedValue({ id: 'pk-1' });

      const caller = createCallerWithSession('owner-user-id');
      await caller.delete({ passkeyId: 'pk-1' });

      expect(mockDeletePasskey).toHaveBeenCalledWith('pk-1', 'owner-user-id');
    });
  });

  describe('rename', () => {
    it('renames the passkey and returns success', async () => {
      mockRenamePasskey.mockResolvedValue({ id: 'pk-1', name: 'My YubiKey' });

      const caller = createCallerWithSession('user-123');
      const result = await caller.rename({
        passkeyId: 'pk-1',
        name: 'My YubiKey',
      });

      expect(result).toEqual({ success: true });
      expect(mockRenamePasskey).toHaveBeenCalledWith('pk-1', 'user-123', 'My YubiKey');
    });

    it('throws when renaming another user passkey', async () => {
      mockRenamePasskey.mockRejectedValue(
        new Error('PassKeyが見つからないか、変更権限がありません'),
      );

      const caller = createCallerWithSession('attacker-user');

      await expect(
        caller.rename({ passkeyId: 'pk-owned-by-other', name: 'Evil' }),
      ).rejects.toThrow();
    });

    it('rejects an empty name via validation', async () => {
      const caller = createCallerWithSession('user-123');

      await expect(
        caller.rename({ passkeyId: 'pk-1', name: '' }),
      ).rejects.toThrow();
      expect(mockRenamePasskey).not.toHaveBeenCalled();
    });

    it('rejects names longer than 100 characters via validation', async () => {
      const caller = createCallerWithSession('user-123');
      const longName = 'a'.repeat(101);

      await expect(
        caller.rename({ passkeyId: 'pk-1', name: longName }),
      ).rejects.toThrow();
      expect(mockRenamePasskey).not.toHaveBeenCalled();
    });

    it('accepts a name with exactly 100 characters', async () => {
      mockRenamePasskey.mockResolvedValue({ id: 'pk-1' });
      const caller = createCallerWithSession('user-123');
      const maxName = 'a'.repeat(100);

      const result = await caller.rename({
        passkeyId: 'pk-1',
        name: maxName,
      });

      expect(result).toEqual({ success: true });
      expect(mockRenamePasskey).toHaveBeenCalledWith('pk-1', 'user-123', maxName);
    });
  });
});
