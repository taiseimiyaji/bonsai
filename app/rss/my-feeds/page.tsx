/**
 * ユーザーのRSSフィード管理ページ
 */
import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import AddFeedForm from '../_components/AddFeedForm';
import FeedList from '../_components/FeedList';
import { serverClient } from '@/app/api/trpc/trpc-server';

export default async function MyFeedsPage() {
  // セッション確認
  const session = await auth();
  
  // 未ログインの場合はログインページにリダイレクト
  if (!session) {
    redirect('/auth/signin');
  }
  
  // ユーザーのフィードを取得して存在確認
  let hasFeeds = false;
  try {
    const feeds = await serverClient.rss.getUserFeeds();
    hasFeeds = feeds.length > 0;
  } catch (error) {
    console.error('フィード取得エラー:', error);
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">マイフィード</h1>
        <Link 
          href="/rss" 
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          RSSリーダーに戻る
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* フィード追加フォーム */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">新しいフィードを追加</h2>
            <AddFeedForm />
          </div>
        </div>
        
        {/* フィード一覧 */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">登録済みフィード</h2>
            {!hasFeeds ? (
              <div className="py-6 text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  登録されているフィードはありません。
                  新しいRSSフィードを追加してください。
                </p>
              </div>
            ) : (
              <Suspense fallback={<div>フィードを読み込み中...</div>}>
                <FeedList isLoggedIn={true} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
