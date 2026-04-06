// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PasskeyLoginButton from '../PasskeyLoginButton.client';

const mockSignIn = vi.hoisted(() => vi.fn());
const mockPerformPasskeyAuthentication = vi.hoisted(() => vi.fn());
const mockIsPasskeySupported = vi.hoisted(() => vi.fn());

vi.mock('next-auth/react', () => ({
  signIn: mockSignIn,
}));

vi.mock('@/app/lib/webauthn/passkey-client', () => ({
  performPasskeyAuthentication: mockPerformPasskeyAuthentication,
  isPasskeySupported: mockIsPasskeySupported,
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

describe('PasskeyLoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPasskeySupported.mockReturnValue(true);
  });

  it('renders nothing when Passkey is not supported', () => {
    mockIsPasskeySupported.mockReturnValue(false);

    const { container } = render(<PasskeyLoginButton />);

    expect(container.firstChild).toBeNull();
  });

  it('signs in with the passkey provider after WebAuthn authentication succeeds', async () => {
    mockPerformPasskeyAuthentication.mockResolvedValue(undefined);

    render(<PasskeyLoginButton />);
    fireEvent.click(screen.getByRole('button', { name: 'PassKeyでログイン' }));

    await waitFor(() => {
      expect(mockPerformPasskeyAuthentication).toHaveBeenCalledTimes(1);
      expect(mockSignIn).toHaveBeenCalledWith('passkey', { callbackUrl: '/' });
    });
  });

  it('shows a loading label while passkey authentication is pending', async () => {
    const deferred = createDeferred<void>();
    mockPerformPasskeyAuthentication.mockReturnValue(deferred.promise);

    render(<PasskeyLoginButton />);
    fireEvent.click(screen.getByRole('button', { name: 'PassKeyでログイン' }));

    expect(screen.getByRole('button', { name: '認証中...' })).toBeDefined();

    deferred.resolve(undefined);
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('shows the authentication error when WebAuthn fails', async () => {
    mockPerformPasskeyAuthentication.mockRejectedValue(
      new Error('Passkey 認証に失敗しました'),
    );

    render(<PasskeyLoginButton />);
    fireEvent.click(screen.getByRole('button', { name: 'PassKeyでログイン' }));

    await waitFor(() => {
      expect(screen.getByText('Passkey 認証に失敗しました')).toBeDefined();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
