import { signIn } from 'next-auth/react';
export default function TopPage() {
  const handleLogin = async () => {
    signIn("google", { callbackUrl: "/" });
  }
  return (
      <div className="m-3">
          トップページだよ
      </div>
  );
}
