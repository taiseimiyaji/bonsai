// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());
const mockRedirect = vi.hoisted(() => vi.fn());

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

vi.mock('../SignInForm.client', () => ({
  default: () => <button type="button">Googleでログイン</button>,
}));

vi.mock('../PasskeyLoginButton.client', () => ({
  default: () => <button type="button">PassKeyでログイン</button>,
}));

import SignInPage from '../page';

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the passkey login entry point for unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);

    render(await SignInPage());

    expect(screen.getByRole('heading', { name: 'ログイン' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'PassKeyでログイン' })).toBeDefined();
  });

  it('redirects authenticated users away from the sign-in page', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1' },
      expires: '2030-01-01',
    });

    await SignInPage();

    expect(mockRedirect).toHaveBeenCalledWith('/');
  });
});
