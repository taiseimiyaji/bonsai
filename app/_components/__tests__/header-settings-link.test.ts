// @vitest-environment jsdom
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Header from '../Header';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => createElement('img', props),
}));

vi.mock('../../components/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));

vi.mock('@heroicons/react/outline', () => ({
  MenuIcon: () => null,
  XIcon: () => null,
}));

const mockSession: NonNullable<Parameters<typeof Header>[0]['session']> = {
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: '/test-avatar.png',
  },
  expires: '2030-01-01',
};

describe('Header settings link', () => {
  it('renders settings link with the expected destination when authenticated', () => {
    render(createElement(Header, { session: mockSession }));

    const settingsLink = screen.getByRole('link', { name: '設定' });

    expect(settingsLink.getAttribute('href')).toBe('/settings');
  });

  it('does not render the settings link when the session is missing', () => {
    render(createElement(Header, { session: null }));

    expect(screen.queryByRole('link', { name: '設定' })).toBeNull();
  });
});
