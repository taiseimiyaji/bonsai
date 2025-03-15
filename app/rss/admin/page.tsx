/**
 * RSSリーダーの管理者ページ
 */
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/app/_utils/next-auth-options';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { prisma } from '@/prisma/prisma';
import AddPublicFeedForm from './_components/AddPublicFeedForm';
import AdminFeedList from './_components/AdminFeedList';
import { serverClient } from '@/app/api/trpc/trpc-server';

export default async function AdminPage() {
  // セッションを取得
  const session = await getServerSession(nextAuthOptions);
  
  // 未ログインの場合はログインページにリダイレクト
  if (!session) {
    redirect('/login');
  }
  
  // ユーザーの権限を確認
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { role: true },
  });
  
  // 管理者でない場合はトップページにリダイレクト
  if (!user || user.role !== 'ADMIN') {
    redirect('/');
  }
  
  // 公開フィードの存在確認
  let hasPublicFeeds = false;
  try {
    const feeds = await serverClient.rss.getPublicFeeds();
    hasPublicFeeds = feeds.length > 0;
  } catch (error) {
    console.error('フィード取得エラー:', error);
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">管理者ページ</h1>
        <Link 
          href="/rss" 
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          RSSリーダーに戻る
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 管理者アクション */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">公開フィードを追加</h2>
            <Suspense fallback={<div>読み込み中...</div>}>
              <AddPublicFeedForm />
            </Suspense>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">管理者アクション</h2>
            <Suspense fallback={<div>読み込み中...</div>}>
              <AdminActions />
            </Suspense>
          </div>
        </div>
        
        {/* フィード一覧 */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">公開フィード一覧</h2>
            {!hasPublicFeeds ? (
              <div className="py-6 text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  登録されている公開フィードはありません。
                  新しい公開フィードを追加してください。
                </p>
              </div>
            ) : (
              <Suspense fallback={<div>フィードを読み込み中...</div>}>
                <AdminFeedList />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 管理者アクションコンポーネント
function AdminActions() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">全フィードを更新</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          すべてのRSSフィードを手動で更新します。
        </p>
        <UpdateAllFeedsButton />
      </div>
    </div>
  );
}

// 全フィード更新ボタン
'use client';
import { useState } from 'react';
import { trpc } from '@/app/api/trpc/trpc-client';

function UpdateAllFeedsButton() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const updateAllMutation = trpc.rss.updateAllFeeds.useMutation({
    onSuccess: (data) => {
      setResult({
        success: true,
        message: `${data.newArticlesCount}件の新しい記事を取得しました`
      });
      setIsUpdating(false);
    },
    onError: (error) => {
      setResult({
        success: false,
        message: `エラーが発生しました: ${error.message}`
      });
      setIsUpdating(false);
    }
  });
  
  const handleUpdate = () => {
    setIsUpdating(true);
    setResult(null);
    updateAllMutation.mutate();
  };
  
  return (
    <div>
      <button
        onClick={handleUpdate}
        disabled={isUpdating}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUpdating ? '更新中...' : '全フィードを更新'}
      </button>
      
      {result && (
        <div className={`mt-2 text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
