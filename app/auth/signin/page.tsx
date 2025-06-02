import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SignInForm from './SignInForm.client';

export default async function SignInPage() {
  const session = await auth();

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
        <SignInForm />
      </div>
    </div>
  );
}
