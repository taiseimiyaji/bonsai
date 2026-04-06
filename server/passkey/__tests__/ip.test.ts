import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { getClientIp } from '../ip';

function createRequest(headers: HeadersInit = {}): NextRequest {
  return new NextRequest('http://localhost/api/auth/webauthn', { headers });
}

describe('getClientIp', () => {
  it('returns the first IP from x-forwarded-for', () => {
    const request = createRequest({
      'x-forwarded-for': '203.0.113.50',
    });

    expect(getClientIp(request)).toBe('203.0.113.50');
  });

  it('returns the first IP when x-forwarded-for contains multiple IPs', () => {
    const request = createRequest({
      'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178',
    });

    expect(getClientIp(request)).toBe('203.0.113.50');
  });

  it('trims whitespace from x-forwarded-for', () => {
    const request = createRequest({
      'x-forwarded-for': '  203.0.113.50  , 70.41.3.18',
    });

    expect(getClientIp(request)).toBe('203.0.113.50');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const request = createRequest({
      'x-real-ip': '10.0.0.1',
    });

    expect(getClientIp(request)).toBe('10.0.0.1');
  });

  it('returns null when no IP headers are present', () => {
    expect(getClientIp(createRequest())).toBeNull();
  });

  it('skips an empty x-forwarded-for and falls back to x-real-ip', () => {
    const request = createRequest({
      'x-forwarded-for': '',
      'x-real-ip': '10.0.0.1',
    });

    expect(getClientIp(request)).toBe('10.0.0.1');
  });

  it('handles IPv6 addresses in x-forwarded-for', () => {
    const request = createRequest({
      'x-forwarded-for': '::1',
    });

    expect(getClientIp(request)).toBe('::1');
  });
});
