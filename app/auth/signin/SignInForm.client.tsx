'use client';

import { signIn as authSignIn } from '@/auth';

export default function SignInForm() {
  const handleSignIn = async () => {
    await authSignIn('google', { callbackUrl: '/' });
  };

  return (
    <button
      onClick={handleSignIn}
      className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
    >
      Googleでログイン
    </button>
  );
}
