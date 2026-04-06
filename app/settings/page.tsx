import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import PasskeySettings from './passkeys/PasskeySettings.client';

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">設定</h1>
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">PassKey管理</h2>
        <PasskeySettings />
      </section>
    </div>
  );
}
