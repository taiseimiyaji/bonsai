/**
 * 特定のRSSフィードの記事一覧ページ
 */
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/app/_utils/next-auth-options';
import Link from 'next/link';

import { serverClient } from '@/app/api/trpc/trpc-server';
import FeedArticleList from './_components/FeedArticleList';
import { prisma } from '@/prisma/prisma';

export default async function FeedPage({ params }: { params: { id: string } }) {
  const feedId = params.id;
  const session = await getServerSession(nextAuthOptions);
  const isLoggedIn = !!session;
  
  // フィードの情報を取得
  try {
    const feed = await prisma.rssFeed.findUnique({
      where: { id: feedId },
    });
    
    if (!feed) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">フィードが見つかりません</h1>
            <p className="mb-4">指定されたRSSフィードは存在しないか、削除された可能性があります。</p>
            <Link 
              href="/rss" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              RSSリーダーに戻る
            </Link>
          </div>
        </div>
      );
    }
    
    // プライベートフィードの場合、アクセス権をチェック
    if (feed.feedType === 'PRIVATE' && (!isLoggedIn || feed.userId !== session?.userId)) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">アクセス権限がありません</h1>
            <p className="mb-4">このRSSフィードはプライベートです。閲覧するには権限が必要です。</p>
            <Link 
              href="/rss" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              RSSリーダーに戻る
            </Link>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{feed.title}</h1>
          <Link 
            href="/rss" 
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            RSSリーダーに戻る
          </Link>
        </div>
        
        {feed.description && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <p className="text-gray-700 dark:text-gray-300">{feed.description}</p>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">記事一覧</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {feed.lastFetched 
                ? `最終更新: ${new Date(feed.lastFetched).toLocaleString('ja-JP')}`
                : '未取得'
              }
            </div>
          </div>
          
          <Suspense fallback={<div>記事を読み込み中...</div>}>
            <FeedArticleList feedId={feedId} />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('フィード取得エラー:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
          <p className="mb-4">フィードの取得中にエラーが発生しました。</p>
          <Link 
            href="/rss" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            RSSリーダーに戻る
          </Link>
        </div>
      </div>
    );
  }
}
