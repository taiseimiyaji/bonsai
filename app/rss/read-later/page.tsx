/**
 * 後で読むリストページ
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '../../trpc-client';
import ArticleList from '../info/_components/ArticleList';
import { FaClock, FaSync, FaTrash } from 'react-icons/fa';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function ReadLaterPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;
  const [isLoading, setIsLoading] = useState(true);
  
  // 後で読むリストの記事を取得
  const readLaterArticlesQuery = trpc.rss.getReadLaterArticles.useQuery(
    { limit: 100 },
    {
      enabled: isLoggedIn,
      onSuccess: () => {
        setIsLoading(false);
      },
      onError: () => {
        setIsLoading(false);
      }
    }
  );
  
  // 既読になった記事を後で読むリストから自動的に削除するミューテーション
  const cleanupReadLaterMutation = trpc.rss.cleanupReadLater.useMutation({
    onSuccess: (result) => {
      if (result.count > 0) {
        toast.success(`既読の${result.count}件の記事を削除しました`, {
          icon: '🧹',
          duration: 3000
        });
        
        // 記事リストを再取得
        readLaterArticlesQuery.refetch();
      } else {
        toast.success('削除対象の記事はありませんでした', {
          duration: 2000
        });
      }
    },
    onError: (error) => {
      toast.error(`クリーンアップに失敗しました: ${error.message}`, {
        duration: 3000
      });
    }
  });
  
  // 記事が既読になった時のコールバック
  const handleArticleRead = () => {
    // 少し遅延させてから再取得（既読状態が反映されるのを待つ）
    setTimeout(() => {
      readLaterArticlesQuery.refetch();
    }, 500);
  };
  
  // クリーンアップを実行
  const handleCleanup = () => {
    cleanupReadLaterMutation.mutate();
  };
  
  // ログイン状態に応じたコンテンツを表示
  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">ログインが必要です</h1>
          <p className="mb-6">後で読むリストを利用するには、ログインしてください。</p>
          <Link 
            href="/api/auth/signin"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            ログイン
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px'
          },
        }}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <FaClock className="text-blue-500 mr-2" size={24} />
          <h1 className="text-2xl font-bold">後で読むリスト</h1>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => readLaterArticlesQuery.refetch()}
            className="flex items-center px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            disabled={readLaterArticlesQuery.isRefetching}
          >
            <FaSync className={`mr-2 ${readLaterArticlesQuery.isRefetching ? 'animate-spin' : ''}`} />
            更新
          </button>
          
          <button
            onClick={handleCleanup}
            className="flex items-center px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            disabled={cleanupReadLaterMutation.isLoading}
          >
            <FaTrash className="mr-2" />
            既読記事を削除
          </button>
        </div>
      </div>
      
      {readLaterArticlesQuery.isError ? (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded mb-6">
          エラーが発生しました: {readLaterArticlesQuery.error.message}
        </div>
      ) : readLaterArticlesQuery.data?.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">後で読む記事がありません</h2>
          <p className="mb-6">記事一覧から「後で読む」ボタンをクリックして記事を保存できます。</p>
          <Link 
            href="/rss/info"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            記事一覧へ
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <ArticleList 
            articles={readLaterArticlesQuery.data || []} 
            onArticleRead={handleArticleRead}
          />
        </div>
      )}
    </div>
  );
}
