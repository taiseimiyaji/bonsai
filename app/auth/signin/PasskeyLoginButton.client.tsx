'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  performPasskeyAuthentication,
  isPasskeySupported,
} from '@/app/lib/webauthn/passkey-client';

export default function PasskeyLoginButton() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isPasskeySupported()) {
    return null;
  }

  const handlePasskeyLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      await performPasskeyAuthentication();
      // Why: authToken is in HttpOnly cookie, automatically sent with signIn request
      await signIn('passkey', { callbackUrl: '/' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={loading}
        className="inline-block w-full bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading ? '認証中...' : 'PassKeyでログイン'}
      </button>
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
    </div>
  );
}
