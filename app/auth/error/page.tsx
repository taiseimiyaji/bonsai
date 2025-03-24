import { useSearchParams } from 'next/navigation';

export default function ErrorPage() {
  return (
    <div className="flex h-screen">
      <div className="m-auto text-center">
        <h1 className="text-4xl font-bold mb-4">認証エラー</h1>
        <p className="text-gray-600 mb-4">
          申し訳ありませんが、認証中にエラーが発生しました。
        </p>
        <p className="text-gray-600 mb-8">
          以下の点をご確認ください：
          <ul className="list-disc text-left max-w-md mx-auto mt-4">
            <li>Googleアカウントが正しく設定されているか</li>
            <li>ブラウザのCookieが有効になっているか</li>
            <li>ブラウザのプライバシー設定が適切か</li>
          </ul>
        </p>
        <a
          href="/"
          className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          ホームに戻る
        </a>
      </div>
    </div>
  );
}
