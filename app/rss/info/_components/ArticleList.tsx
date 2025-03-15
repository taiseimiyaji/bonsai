/**
 * 記事一覧コンポーネント
 */
'use client';

import Image from 'next/image';
import { useState } from 'react';

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
  feed?: {
    title: string;
  };
}

interface ArticleListProps {
  articles: Article[];
}

export default function ArticleList({ articles }: ArticleListProps) {
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  
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
  
  return (
    <div className="space-y-6">
      {articles.map((article) => {
        const isExpanded = expandedArticles.has(article.id);
        
        return (
          <article 
            key={article.id} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
          >
            <div className="p-4">
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
                                className="object-cover"
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
                      className={`text-gray-600 dark:text-gray-300 mb-3 ${isExpanded ? '' : 'line-clamp-3'}`}
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
                    >
                      記事を読む
                    </a>
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
