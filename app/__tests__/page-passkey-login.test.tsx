// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TopPage from '../page';

const mockSignIn = vi.hoisted(() => vi.fn());
const mockUseSession = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
const mockPerformPasskeyAuthentication = vi.hoisted(() => vi.fn());
const mockIsPasskeySupported = vi.hoisted(() => vi.fn());
const mockAlert = vi.hoisted(() => vi.fn());

vi.mock('next-auth/react', () => ({
  signIn: mockSignIn,
  useSession: mockUseSession,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('../lib/webauthn/passkey-client', () => ({
  performPasskeyAuthentication: mockPerformPasskeyAuthentication,
  isPasskeySupported: mockIsPasskeySupported,
}));

vi.mock('../_components/TermsModal', () => ({
  TermsModal: () => null,
}));

vi.mock('../rss/info/_components/InfoPageContent', () => ({
  InfoPageContent: () => null,
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

describe('TopPage passkey login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    mockIsPasskeySupported.mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue(
      new Response('document body', { status: 200 }),
    );
    vi.stubGlobal('alert', mockAlert);
  });

  it('requires terms agreement before starting passkey login', () => {
    render(<TopPage />);

    fireEvent.click(screen.getByRole('button', { name: 'PassKeyでログイン' }));

    expect(mockAlert).toHaveBeenCalledWith(
      '利用規約とプライバシーポリシーに同意してください。',
    );
    expect(mockPerformPasskeyAuthentication).not.toHaveBeenCalled();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('signs in with the passkey provider after successful WebAuthn authentication', async () => {
    mockPerformPasskeyAuthentication.mockResolvedValue(undefined);

    render(<TopPage />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'PassKeyでログイン' }));

    await waitFor(() => {
      expect(mockPerformPasskeyAuthentication).toHaveBeenCalledTimes(1);
      expect(mockSignIn).toHaveBeenCalledWith('passkey', {
        callbackUrl: '/rss/info',
      });
    });
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it('shows a loading label while passkey authentication is pending', async () => {
    const deferred = createDeferred<void>();
    mockPerformPasskeyAuthentication.mockReturnValue(deferred.promise);

    render(<TopPage />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'PassKeyでログイン' }));

    expect(screen.getByRole('button', { name: '認証中...' })).toBeDefined();

    deferred.resolve(undefined);
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('shows the error message when passkey authentication fails', async () => {
    mockPerformPasskeyAuthentication.mockRejectedValue(
      new Error('Passkey ログインに失敗しました'),
    );

    render(<TopPage />);

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'PassKeyでログイン' }));

    await waitFor(() => {
      expect(screen.getByText('Passkey ログインに失敗しました')).toBeDefined();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
