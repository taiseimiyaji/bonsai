/**
 * 記事一覧コンポーネント
 */
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { trpc } from '../../../trpc-client';
import { useSession } from 'next-auth/react';

interface Article {
  id: string;
  title: string;
  description: string | null;
  link: string;
  publishedAt: string;
  author: string | null;
  imageUrl: string | null;
  timeAgo: string;
  feedId: string;
  isRead?: boolean;
  feed?: {
    title: string;
    id: string;
  };
}

interface ArticleListProps {
  articles: Article[];
  isZennFeed?: boolean; // Zennのフィードかどうかを示すフラグ
  onArticleRead?: (articleId: string) => void; // 記事が既読になった時のコールバック
}

export default function ArticleList({ articles, isZennFeed = false, onArticleRead }: ArticleListProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [readArticles, setReadArticles] = useState<Set<string>>(
    new Set(articles.filter(article => article.isRead).map(article => article.id))
  );
  
  // 記事を既読にするミューテーション
  const markAsReadMutation = trpc.rss.markAsRead.useMutation({
    onSuccess: (_, variables) => {
      // 成功時に既読状態を更新
      setReadArticles(prev => {
        const newSet = new Set(prev);
        newSet.add(variables.articleId);
        return newSet;
      });
      
      // 親コンポーネントに通知
      if (onArticleRead) {
        onArticleRead(variables.articleId);
      }
    }
  });
  
  // 記事の展開/折りたたみを切り替える
  const toggleArticle = (articleId: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };
  
  // 記事を既読にする
  const markAsRead = (articleId: string, e: React.MouseEvent) => {
    e.preventDefault(); // リンククリックのデフォルト動作を防止
    
    if (!isLoggedIn) return; // ログインしていない場合は何もしない
    
    // 既に既読の場合は何もしない
    if (readArticles.has(articleId)) return;
    
    // 既読にするAPIを呼び出す
    markAsReadMutation.mutate({ articleId });
  };
  
  return (
    <div className="space-y-6">
      {articles.map((article) => {
        const isExpanded = expandedArticles.has(article.id);
        const isRead = readArticles.has(article.id) || article.isRead;
        
        return (
          <article 
            key={article.id} 
            className={`border ${isRead ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' : 'border-gray-200 dark:border-gray-700'} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition`}
          >
            <div className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* 記事画像（あれば表示） */}
                {article.imageUrl && (
                  <div className={`flex-shrink-0 ${isZennFeed ? 'md:w-1/4' : 'md:w-1/4'}`}>
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded"
                      onClick={(e) => isLoggedIn && markAsRead(article.id, e)}
                    >
                      <div className={`relative ${isZennFeed ? 'aspect-[1.91/1] w-full' : 'h-40 w-full'}`}>
                        {/* 画像URLが有効かどうかを確認 */}
                        {(() => {
                          try {
                            // URLが有効かチェック
                            new URL(article.imageUrl);
                            return (
                              <Image
                                src={article.imageUrl}
                                alt={article.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 25vw"
                                className={`${isZennFeed ? 'object-contain' : 'object-cover'}`}
                                onError={(e) => {
                                  // 画像読み込みエラー時に非表示
                                  const target = e.target as HTMLImageElement;
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.style.display = 'none';
                                  }
                                }}
                              />
                            );
                          } catch (e) {
                            // 無効なURLの場合は何も表示しない
                            return null;
                          }
                        })()}
                      </div>
                    </a>
                  </div>
                )}
                
                {/* 記事情報 */}
                <div className={article.imageUrl ? "md:w-3/4" : "w-full"}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`text-xl font-semibold ${isRead ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                      <a 
                        href={article.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`hover:text-blue-600 dark:hover:text-blue-400 ${isRead ? 'visited:text-gray-500 dark:visited:text-gray-400' : ''}`}
                        onClick={(e) => isLoggedIn && markAsRead(article.id, e)}
                      >
                        {article.title}
                      </a>
                    </h3>
                    {isLoggedIn && (
                      <span 
                        className={`text-xs px-2 py-0.5 rounded ${
                          isRead 
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' 
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        }`}
                      >
                        {isRead ? '既読' : '未読'}
                      </span>
                    )}
                  </div>
                  
                  {article.description && (
                    <div 
                      className={`text-gray-600 dark:text-gray-300 mb-3 ${isExpanded ? '' : 'line-clamp-3'} ${isRead ? 'opacity-80' : ''}`}
                      dangerouslySetInnerHTML={{ __html: article.description }}
                    />
                  )}
                  
                  <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 gap-x-4 gap-y-1">
                    {article.feed?.title && (
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                        {article.feed.title}
                      </span>
                    )}
                    
                    {article.author && (
                      <span>
                        著者: {article.author}
                      </span>
                    )}
                    
                    <span>{article.timeAgo}</span>
                    
                    <button
                      onClick={() => toggleArticle(article.id)}
                      className="text-blue-600 dark:text-blue-400 hover:underline ml-auto"
                    >
                      {isExpanded ? '折りたたむ' : 'もっと見る'}
                    </button>
                    
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={(e) => isLoggedIn && markAsRead(article.id, e)}
                    >
                      記事を読む
                    </a>
                    
                    {isLoggedIn && !isRead && (
                      <button
                        onClick={() => markAsReadMutation.mutate({ articleId: article.id })}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        disabled={markAsReadMutation.isLoading}
                      >
                        既読にする
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
