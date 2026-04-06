import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.stubEnv('AUTH_SECRET', 'test-secret-key-for-hmac-signing-32chars');

import {
  createAuthToken,
  verifyAndConsumeAuthToken,
  signCookie,
  verifyCookie,
} from '../auth-token';

describe('auth-token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('createAuthToken', () => {
    it('should generate token containing userId', () => {
      const token = createAuthToken('user-123');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for same userId', () => {
      const token1 = createAuthToken('user-123');
      const token2 = createAuthToken('user-123');

      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens for different userIds', () => {
      const token1 = createAuthToken('user-123');
      const token2 = createAuthToken('user-456');

      expect(token1).not.toBe(token2);
    });

    it('should include iat in token payload (4-part format)', () => {
      const token = createAuthToken('user-123');
      const parts = token.split('.');

      expect(parts.length).toBe(4);

      const iat = Number(parts[2]);
      expect(Number.isFinite(iat)).toBe(true);
      expect(iat).toBeGreaterThan(0);
    });
  });

  describe('verifyAndConsumeAuthToken', () => {
    it('should return userId when token is valid', () => {
      const token = createAuthToken('user-123');

      const userId = verifyAndConsumeAuthToken(token);

      expect(userId).toBe('user-123');
    });

    it('should return null when token is consumed (one-time use)', () => {
      const token = createAuthToken('user-123');

      const firstUse = verifyAndConsumeAuthToken(token);
      const secondUse = verifyAndConsumeAuthToken(token);

      expect(firstUse).toBe('user-123');
      expect(secondUse).toBeNull();
    });

    it('should return null when token is tampered', () => {
      const token = createAuthToken('user-123');
      const tampered = token.slice(0, -5) + 'xxxxx';

      const result = verifyAndConsumeAuthToken(tampered);

      expect(result).toBeNull();
    });

    it('should return null when token format is invalid', () => {
      const result = verifyAndConsumeAuthToken('invalid-token-format');

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = verifyAndConsumeAuthToken('');

      expect(result).toBeNull();
    });

    it('should return null when token has wrong number of parts', () => {
      const result = verifyAndConsumeAuthToken('part1.part2');

      expect(result).toBeNull();
    });

    it('should return null when TTL has expired', () => {
      vi.useFakeTimers();

      const token = createAuthToken('user-123');

      // 5分 + 1ms 経過させる
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      const result = verifyAndConsumeAuthToken(token);

      expect(result).toBeNull();
    });

    it('should return userId when within TTL', () => {
      vi.useFakeTimers();

      const token = createAuthToken('user-123');

      // 4分59秒経過（TTL内）
      vi.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000);

      const result = verifyAndConsumeAuthToken(token);

      expect(result).toBe('user-123');
    });

    it('should return null when iat is tampered', () => {
      const token = createAuthToken('user-123');
      const parts = token.split('.');

      // iat を改ざんする（署名が不一致になる）
      parts[2] = '0';
      const tampered = parts.join('.');

      const result = verifyAndConsumeAuthToken(tampered);

      expect(result).toBeNull();
    });

    it('should return null when signature length differs', () => {
      const result = verifyAndConsumeAuthToken('user-123.nonce.12345.short');

      expect(result).toBeNull();
    });
  });

  describe('signCookie', () => {
    it('should return signed value different from original', () => {
      const original = 'cookie-value-data';

      const signed = signCookie(original);

      expect(signed).not.toBe(original);
      expect(signed).toContain(original);
    });

    it('should produce consistent signature for same input at same time', () => {
      vi.useFakeTimers();
      const value = 'test-value';

      const signed1 = signCookie(value);
      const signed2 = signCookie(value);

      expect(signed1).toBe(signed2);
    });

    it('should include timestamp in signed cookie', () => {
      vi.useFakeTimers({ now: 1000000 });
      const signed = signCookie('test-value');

      // signed format: value.iat.signature
      expect(signed).toContain('1000000');
    });
  });

  describe('verifyCookie', () => {
    it('should return original value when signature is valid', () => {
      const original = 'cookie-value-data';
      const signed = signCookie(original);

      const result = verifyCookie(signed);

      expect(result).toBe(original);
    });

    it('should return null when signature is tampered', () => {
      const signed = signCookie('cookie-value');
      const tampered = signed.slice(0, -5) + 'xxxxx';

      const result = verifyCookie(tampered);

      expect(result).toBeNull();
    });

    it('should return null when value is not signed', () => {
      const result = verifyCookie('plain-unsigned-value');

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = verifyCookie('');

      expect(result).toBeNull();
    });

    it('should verify JSON string cookies correctly', () => {
      const jsonValue = JSON.stringify({ userId: 'u1', email: 'a@b.com', name: 'Test' });
      const signed = signCookie(jsonValue);

      const result = verifyCookie(signed);

      expect(result).toBe(jsonValue);
      expect(JSON.parse(result!)).toEqual({ userId: 'u1', email: 'a@b.com', name: 'Test' });
    });

    it('should return null when cookie TTL has expired', () => {
      vi.useFakeTimers();

      const signed = signCookie('challenge-data');

      // 5分 + 1ms 経過させる
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      const result = verifyCookie(signed);

      expect(result).toBeNull();
    });

    it('should return value when cookie is within TTL', () => {
      vi.useFakeTimers();

      const signed = signCookie('challenge-data');

      // 4分59秒経過（TTL内）
      vi.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000);

      const result = verifyCookie(signed);

      expect(result).toBe('challenge-data');
    });

    it('should return null when timestamp is tampered', () => {
      const signed = signCookie('test-value');
      const parts = signed.split('.');

      // タイムスタンプ部分を改ざん
      if (parts.length >= 3) {
        parts[parts.length - 2] = '0';
        const tampered = parts.join('.');

        const result = verifyCookie(tampered);

        expect(result).toBeNull();
      }
    });
  });
});
