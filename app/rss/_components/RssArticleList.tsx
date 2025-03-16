/**
 * RSSの記事一覧を表示するコンポーネント
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { trpc } from '@/app/api/trpc/trpc-client';

interface RssArticleListProps {
  isLoggedIn: boolean;
}

export default function RssArticleList({ isLoggedIn }: RssArticleListProps) {
  const [limit, setLimit] = useState(20);
  
  // ログイン状態に応じて適切なクエリを使用
  const articlesQuery = isLoggedIn
    ? trpc.rss.getUserArticles.useQuery({ limit })
    : trpc.rss.getPublicArticles.useQuery({ limit });
  
  if (articlesQuery.isLoading) {
    return <div className="py-4">記事を読み込み中...</div>;
  }
  
  if (articlesQuery.isError) {
    return (
      <div className="py-4 text-red-500">
        エラーが発生しました: {articlesQuery.error.message}
      </div>
    );
  }
  
  const articles = articlesQuery.data || [];
  
  if (articles.length === 0) {
    return (
      <div className="py-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          表示できる記事が登録されていません。
          {isLoggedIn && ' フィードを追加してください。'}
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="space-y-6">
        {articles.map((article) => (
          <article 
            key={article.id} 
            className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* 記事画像（あれば表示） */}
              {article.imageUrl && (
                <div className="md:w-1/4 flex-shrink-0">
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded"
                  >
                    <div className="relative h-40 w-full">
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover"
                        onError={(e) => {
                          // 画像読み込みエラー時に非表示
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </a>
                </div>
              )}
              
              {/* 記事情報 */}
              <div className={article.imageUrl ? "md:w-3/4" : "w-full"}>
                <h3 className="text-xl font-semibold mb-2">
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {article.title}
                  </a>
                </h3>
                
                {article.description && (
                  <div 
                    className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: article.description }}
                  />
                )}
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  {article.author && (
                    <span className="mr-3">
                      著者: {article.author}
                    </span>
                  )}
                  <span>{article.timeAgo}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      {/* もっと読み込むボタン */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setLimit(prev => prev + 20)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          disabled={articlesQuery.isLoading}
        >
          もっと読み込む
        </button>
      </div>
    </div>
  );
}
