import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { nextAuthOptions } from '@/app/_utils/next-auth-options';

export default async function SignInPage() {
  const session = await getServerSession(nextAuthOptions);

  if (session) {
    redirect('/');
  }

  return (
    <div className="flex h-screen">
      <div className="m-auto text-center">
        <h1 className="text-4xl font-bold mb-8">ログイン</h1>
        <p className="text-gray-600 mb-8">
          Googleアカウントでログインしてください
        </p>
        <form
          action="/api/auth/signin/google"
          method="POST"
        >
          <input type="hidden" name="callbackUrl" value="/" />
          <button
            type="submit"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Googleでログイン
          </button>
        </form>
      </div>
    </div>
  );
}
