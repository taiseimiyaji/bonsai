/**
 * RSSリーダーのメインページ
 */
import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/prisma/prisma';

import { serverClient } from '@/app/api/trpc/trpc-server';
import RssArticleList from './_components/RssArticleList';
import AddFeedForm from './_components/AddFeedForm';
import FeedList from './_components/FeedList';

export default async function RssPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  // 管理者かどうかを確認
  let isAdmin = false;
  if (session && session.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    isAdmin = user?.role === 'ADMIN';
  }

  // フィードの存在確認
  let hasFeeds = false;
  try {
    const feeds = session 
      ? await serverClient.rss.getUserFeeds()
      : await serverClient.rss.getPublicFeeds();
    hasFeeds = feeds.length > 0;
  } catch (error) {
    console.error('フィード取得エラー:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">RSSリーダー</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* サイドバー */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">メニュー</h2>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/rss" 
                  className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  最新記事
                </Link>
              </li>
              <li>
                <Link 
                  href="/rss/info" 
                  className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  情報ダッシュボード
                </Link>
              </li>
              {session && (
                <li>
                  <Link 
                    href="/rss/my-feeds" 
                    className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    マイフィード
                  </Link>
                </li>
              )}
              {isAdmin && (
                <li>
                  <Link 
                    href="/rss/admin" 
                    className="block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    管理者ページ
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* フィード一覧 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">フィード一覧</h2>
            <Suspense fallback={<div>フィードを読み込み中...</div>}>
              <FeedList isLoggedIn={!!session} />
            </Suspense>
            
            {/* フィード追加フォーム（ログインユーザーのみ） */}
            {session && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-2">新しいフィードを追加</h3>
                <AddFeedForm />
              </div>
            )}
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <div className="md:col-span-3">
          {!hasFeeds ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <h2 className="text-xl font-semibold mb-4">フィードが登録されていません</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {session 
                  ? 'RSSフィードを追加して、最新の記事を閲覧しましょう。'
                  : '現在、公開フィードが登録されていません。管理者が公開フィードを追加するまでお待ちください。'}
              </p>
              {session && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">フィードを追加</h3>
                  <AddFeedForm />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">
                {session ? 'あなたのフィードの最新記事' : '公開フィードの最新記事'}
              </h2>
              <Suspense fallback={<div>記事を読み込み中...</div>}>
                <RssArticleList isLoggedIn={!!session} />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
