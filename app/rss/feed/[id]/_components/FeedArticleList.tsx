/**
 * 特定のRSSフィードの記事一覧を表示するコンポーネント
 */
'use client';

import { useState } from 'react';
import { trpc } from '../../../../trpc-client';

interface FeedArticleListProps {
  feedId: string;
}

export default function FeedArticleList({ feedId }: FeedArticleListProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // 記事一覧を取得
  const articlesQuery = trpc.rss.getFeedArticles.useQuery({
    feedId,
    page,
    pageSize,
  });
  
  if (articlesQuery.isLoading) {
    return <div className="py-2">記事を読み込み中...</div>;
  }
  
  if (articlesQuery.isError) {
    return (
      <div className="py-2 text-red-500">
        エラーが発生しました: {articlesQuery.error.message}
      </div>
    );
  }
  
  const { articles, pagination } = articlesQuery.data || { articles: [], pagination: { totalItems: 0, page: 1, pageSize, totalPages: 1 } };
  const totalPages = pagination.totalPages;
  
  if (articles.length === 0) {
    return (
      <div className="py-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          このフィードには記事が登録されていません。
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <ul className="space-y-6">
        {articles.map((article) => (
          <li key={article.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
            <h3 className="text-lg font-medium mb-2">
              <a 
                href={article.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {article.title}
              </a>
            </h3>
            
            {article.description && (
              <div 
                className="text-gray-700 dark:text-gray-300 mb-2 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: article.description }}
              />
            )}
            
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span>
                {article.publishedAt 
                  ? new Date(article.publishedAt).toLocaleString('ja-JP')
                  : '日付不明'
                }
              </span>
              <a 
                href={article.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                記事を読む
              </a>
            </div>
          </li>
        ))}
      </ul>
      
      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前へ
          </button>
          
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {page} / {totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
