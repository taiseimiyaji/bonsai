// @vitest-environment jsdom
import { createElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from '../Header';

const mockSignOut = vi.hoisted(() => vi.fn());

vi.mock('next-auth/react', () => ({
  signOut: mockSignOut,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => createElement('img', props),
}));

vi.mock('../../components/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

vi.mock('@heroicons/react/outline', () => ({
  MenuIcon: () => createElement('span', null, 'menu'),
  XIcon: () => createElement('span', null, 'close'),
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

const mockSession: NonNullable<Parameters<typeof Header>[0]['session']> = {
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: '/test-avatar.png',
  },
  expires: '2030-01-01',
};

describe('Header logout flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
  });

  it('cleans up the passkey auth cookie before desktop logout', async () => {
    const deferred = createDeferred<Response>();
    global.fetch = vi.fn().mockReturnValue(deferred.promise);

    render(createElement(Header, { session: mockSession }));

    fireEvent.click(screen.getAllByRole('button', { name: 'ログアウト' })[0]);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockSignOut).not.toHaveBeenCalled();

    deferred.resolve(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  it('cleans up the passkey auth cookie before mobile logout', async () => {
    const deferred = createDeferred<Response>();
    global.fetch = vi.fn().mockReturnValue(deferred.promise);

    render(createElement(Header, { session: mockSession }));

    fireEvent.click(screen.getByRole('button', { name: 'menu' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'ログアウト' })[1]);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockSignOut).not.toHaveBeenCalled();

    deferred.resolve(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });
});
