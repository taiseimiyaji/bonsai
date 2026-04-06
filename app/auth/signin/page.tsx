import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SignInForm from './SignInForm.client';
import PasskeyLoginButton from './PasskeyLoginButton.client';

export default async function SignInPage() {
  const session = await auth();

  if (session) {
    redirect('/');
  }

  return (
    <div className="flex h-screen">
      <div className="m-auto text-center w-full max-w-sm px-4">
        <h1 className="text-4xl font-bold mb-8">ログイン</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          アカウントにログインしてください
        </p>
        <div className="space-y-4">
          <SignInForm />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">または</span>
            </div>
          </div>
          <PasskeyLoginButton />
        </div>
      </div>
    </div>
  );
}
