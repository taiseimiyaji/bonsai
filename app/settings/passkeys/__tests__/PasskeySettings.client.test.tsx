// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PasskeySettings from '../PasskeySettings.client';

type ListedPasskey = {
  id: string;
  credentialId: string;
  name: string | null;
  credentialDeviceType: 'multiDevice' | 'singleDevice';
  credentialBackedUp: boolean;
  createdAt: Date;
};

type DeleteInput = { passkeyId: string };
type RenameInput = { passkeyId: string; name: string };
type MutationCallbacks = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

const mockPerformPasskeyRegistration = vi.hoisted(() => vi.fn());
const mockIsPasskeySupported = vi.hoisted(() => vi.fn());

const queryState = vi.hoisted(() => ({
  data: [] as ListedPasskey[],
  isLoading: false,
  refetch: vi.fn(),
}));

const deleteMutationState = vi.hoisted(() => ({
  mode: 'success' as 'success' | 'error',
  error: new Error('削除に失敗しました'),
  calls: [] as DeleteInput[],
  isLoading: false,
}));

const renameMutationState = vi.hoisted(() => ({
  mode: 'success' as 'success' | 'error',
  error: new Error('名前の変更に失敗しました'),
  calls: [] as RenameInput[],
  isLoading: false,
}));

vi.mock('@/app/lib/webauthn/passkey-client', () => ({
  performPasskeyRegistration: mockPerformPasskeyRegistration,
  isPasskeySupported: mockIsPasskeySupported,
}));

vi.mock('@/app/trpc-client', () => ({
  trpc: {
    passkey: {
      list: {
        useQuery: vi.fn(() => queryState),
      },
      delete: {
        useMutation: vi.fn((options?: MutationCallbacks) => ({
          isLoading: deleteMutationState.isLoading,
          isPending: deleteMutationState.isLoading,
          mutate: (input: DeleteInput) => {
            deleteMutationState.calls.push(input);
            if (deleteMutationState.mode === 'success') {
              options?.onSuccess?.();
              return;
            }

            options?.onError?.(deleteMutationState.error);
          },
        })),
      },
      rename: {
        useMutation: vi.fn((options?: MutationCallbacks) => ({
          isLoading: renameMutationState.isLoading,
          isPending: renameMutationState.isLoading,
          mutate: (input: RenameInput) => {
            renameMutationState.calls.push(input);
            if (renameMutationState.mode === 'success') {
              options?.onSuccess?.();
              return;
            }

            options?.onError?.(renameMutationState.error);
          },
        })),
      },
    },
  },
}));

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('PasskeySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryState.data = [];
    queryState.isLoading = false;
    queryState.refetch.mockReset();
    deleteMutationState.mode = 'success';
    deleteMutationState.calls = [];
    deleteMutationState.isLoading = false;
    renameMutationState.mode = 'success';
    renameMutationState.calls = [];
    renameMutationState.isLoading = false;
    mockIsPasskeySupported.mockReturnValue(true);
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('renders the passkey list with device details', () => {
    queryState.data = [
      {
        id: 'pk-1',
        credentialId: 'cred-1',
        name: 'Work MacBook',
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        createdAt: new Date('2026-03-15'),
      },
      {
        id: 'pk-2',
        credentialId: 'cred-2',
        name: null,
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        createdAt: new Date('2026-03-16'),
      },
    ];

    render(<PasskeySettings />);

    expect(screen.getByText('Work MacBook')).toBeDefined();
    expect(screen.getByText('同期対応 • バックアップ済')).toBeDefined();
    expect(screen.getByText('PassKey')).toBeDefined();
    expect(screen.getByText('デバイス固有')).toBeDefined();
  });

  it('shows the unsupported-browser message and hides the add button when Passkey is unavailable', () => {
    mockIsPasskeySupported.mockReturnValue(false);

    render(<PasskeySettings />);

    expect(
      screen.getByText('お使いのブラウザはPassKeyに対応していません'),
    ).toBeDefined();
    expect(screen.queryByRole('button', { name: 'PassKeyを追加' })).toBeNull();
  });

  it('shows a loading label while adding a passkey', async () => {
    const deferred = createDeferred<{ verified: boolean }>();
    mockPerformPasskeyRegistration.mockReturnValue(deferred.promise);

    render(<PasskeySettings />);

    fireEvent.change(screen.getByLabelText('PassKey名'), {
      target: { value: 'Work MacBook' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'PassKeyを追加' }));

    expect(screen.getByRole('button', { name: '登録中...' })).toBeDefined();

    deferred.resolve({ verified: true });
    await waitFor(() => {
      expect(queryState.refetch).toHaveBeenCalled();
    });
  });

  it('passes passkeyName to registration and refetches on success', async () => {
    mockPerformPasskeyRegistration.mockResolvedValue({ verified: true });

    render(<PasskeySettings />);

    fireEvent.change(screen.getByLabelText('PassKey名'), {
      target: { value: 'Work MacBook' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'PassKeyを追加' }));

    await waitFor(() => {
      expect(mockPerformPasskeyRegistration).toHaveBeenCalledWith({
        passkeyName: 'Work MacBook',
      });
      expect(queryState.refetch).toHaveBeenCalled();
    });
  });

  it('shows the registration error when adding a passkey fails', async () => {
    mockPerformPasskeyRegistration.mockRejectedValue(
      new Error('PassKey の追加に失敗しました'),
    );

    render(<PasskeySettings />);

    fireEvent.change(screen.getByLabelText('PassKey名'), {
      target: { value: 'Work MacBook' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'PassKeyを追加' }));

    await waitFor(() => {
      expect(screen.getByText('PassKey の追加に失敗しました')).toBeDefined();
    });
  });

  it('does not delete a passkey when the confirmation is cancelled', () => {
    queryState.data = [
      {
        id: 'pk-1',
        credentialId: 'cred-1',
        name: 'Work MacBook',
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        createdAt: new Date('2026-03-15'),
      },
    ];
    vi.stubGlobal('confirm', vi.fn(() => false));

    render(<PasskeySettings />);
    fireEvent.click(screen.getByRole('button', { name: '削除' }));

    expect(confirm).toHaveBeenCalledWith('このPassKeyを削除しますか？');
    expect(deleteMutationState.calls).toEqual([]);
  });

  it('deletes a passkey after confirmation and refetches the list on success', async () => {
    queryState.data = [
      {
        id: 'pk-1',
        credentialId: 'cred-1',
        name: 'Work MacBook',
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        createdAt: new Date('2026-03-15'),
      },
    ];

    render(<PasskeySettings />);
    fireEvent.click(screen.getByRole('button', { name: '削除' }));

    await waitFor(() => {
      expect(deleteMutationState.calls).toEqual([{ passkeyId: 'pk-1' }]);
      expect(queryState.refetch).toHaveBeenCalled();
    });
  });

  it('shows a UI error when passkey deletion fails', async () => {
    queryState.data = [
      {
        id: 'pk-1',
        credentialId: 'cred-1',
        name: 'Work MacBook',
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        createdAt: new Date('2026-03-15'),
      },
    ];
    deleteMutationState.mode = 'error';

    render(<PasskeySettings />);
    fireEvent.click(screen.getByRole('button', { name: '削除' }));

    await waitFor(() => {
      expect(screen.getByText('削除に失敗しました')).toBeDefined();
    });
  });

  it('reveals the rename form with the current passkey name', () => {
    queryState.data = [
      {
        id: 'pk-1',
        credentialId: 'cred-1',
        name: 'Old Name',
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        createdAt: new Date('2026-03-15'),
      },
    ];

    render(<PasskeySettings />);

    expect(screen.queryByLabelText('新しいPassKey名')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '名前を変更' }));

    const renameInput = screen.getByLabelText('新しいPassKey名') as HTMLInputElement;
    expect(renameInput.value).toBe('Old Name');
    expect(screen.getByRole('button', { name: '保存' })).toBeDefined();
  });

  it('renames a passkey and refetches the list on success', async () => {
    queryState.data = [
      {
        id: 'pk-1',
        credentialId: 'cred-1',
        name: 'Old Name',
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        createdAt: new Date('2026-03-15'),
      },
    ];

    render(<PasskeySettings />);

    fireEvent.click(screen.getByRole('button', { name: '名前を変更' }));
    fireEvent.change(screen.getByLabelText('新しいPassKey名'), {
      target: { value: 'New Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(renameMutationState.calls).toEqual([
        { passkeyId: 'pk-1', name: 'New Name' },
      ]);
      expect(queryState.refetch).toHaveBeenCalled();
    });
  });

  it('shows a UI error when passkey rename fails', async () => {
    queryState.data = [
      {
        id: 'pk-1',
        credentialId: 'cred-1',
        name: 'Old Name',
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        createdAt: new Date('2026-03-15'),
      },
    ];
    renameMutationState.mode = 'error';

    render(<PasskeySettings />);

    fireEvent.click(screen.getByRole('button', { name: '名前を変更' }));
    fireEvent.change(screen.getByLabelText('新しいPassKey名'), {
      target: { value: 'New Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(screen.getByText('名前の変更に失敗しました')).toBeDefined();
    });
  });
});
