import { describe, it, expect, beforeEach, vi } from 'vitest';

import { checkRateLimit } from '../rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow request when under limit', () => {
      const result = checkRateLimit('ip-1', 5, 60_000);

      expect(result.allowed).toBe(true);
    });

    it('should allow multiple requests within limit', () => {
      for (let i = 0; i < 4; i++) {
        const result = checkRateLimit('ip-2', 5, 60_000);
        expect(result.allowed).toBe(true);
      }
    });

    it('should deny request when limit is reached', () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit('ip-3', 5, 60_000);
      }

      const result = checkRateLimit('ip-3', 5, 60_000);

      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeDefined();
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it('should track different keys independently', () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit('ip-4', 5, 60_000);
      }

      const deniedResult = checkRateLimit('ip-4', 5, 60_000);
      const allowedResult = checkRateLimit('ip-5', 5, 60_000);

      expect(deniedResult.allowed).toBe(false);
      expect(allowedResult.allowed).toBe(true);
    });

    it('should reset after window expires', () => {
      vi.useFakeTimers();

      for (let i = 0; i < 5; i++) {
        checkRateLimit('ip-6', 5, 60_000);
      }

      const deniedResult = checkRateLimit('ip-6', 5, 60_000);
      expect(deniedResult.allowed).toBe(false);

      vi.advanceTimersByTime(60_001);

      const allowedResult = checkRateLimit('ip-6', 5, 60_000);
      expect(allowedResult.allowed).toBe(true);
    });

    it('should allow exactly the limit number of requests', () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(checkRateLimit('ip-7', 5, 60_000));
      }

      expect(results.every((r) => r.allowed)).toBe(true);

      const overLimit = checkRateLimit('ip-7', 5, 60_000);
      expect(overLimit.allowed).toBe(false);
    });

    it('should apply different limits per configuration', () => {
      for (let i = 0; i < 10; i++) {
        checkRateLimit('ip-8-options', 10, 60_000);
      }
      const optionsResult = checkRateLimit('ip-8-options', 10, 60_000);

      for (let i = 0; i < 5; i++) {
        checkRateLimit('ip-8-verify', 5, 60_000);
      }
      const verifyResult = checkRateLimit('ip-8-verify', 5, 60_000);

      expect(optionsResult.allowed).toBe(false);
      expect(verifyResult.allowed).toBe(false);
    });
  });
});
