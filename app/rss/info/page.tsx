/**
 * RSSリーダーのInfoページ - 収集した記事の一覧表示
 */
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/app/lib/trpc-client';
import ArticleList from './_components/ArticleList';
import SourceFilter from './_components/SourceFilter';

export default function InfoPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  
  // フィルター状態
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(20);
  
  // ログイン状態に応じて適切なクエリを使用
  const articlesQuery = isLoggedIn
    ? trpc.rss.getUserArticles.useQuery({ limit })
    : trpc.rss.getPublicArticles.useQuery({ limit });
  
  // フィードの取得（ソースフィルター用）
  const feedsQuery = isLoggedIn
    ? trpc.rss.getUserFeeds.useQuery()
    : trpc.rss.getPublicFeeds.useQuery();
  
  // 記事をフィルタリング
  const filteredArticles = articlesQuery.data?.filter(article => {
    // 検索クエリでフィルタリング
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.description && article.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // ソースでフィルタリング
    const matchesSource = selectedSources.length === 0 || 
      selectedSources.includes(article.feedId);
    
    return matchesSearch && matchesSource;
  }) || [];
  
  // もっと読み込む
  const handleLoadMore = () => {
    setLimit(prev => prev + 20);
  };
  
  // 検索クエリの変更
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // ソースフィルターの変更
  const handleSourceFilterChange = (sources: string[]) => {
    setSelectedSources(sources);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">情報ダッシュボード</h1>
      
      <div className="mb-8">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          収集した記事の一覧です。検索やフィルターを使って必要な情報を見つけることができます。
        </p>
        
        {/* 検索バー */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="記事を検索..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
            />
            <svg 
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
        </div>
        
        {/* ソースフィルター */}
        {!feedsQuery.isLoading && feedsQuery.data && (
          <SourceFilter 
            feeds={feedsQuery.data}
            selectedSources={selectedSources}
            onChange={handleSourceFilterChange}
          />
        )}
      </div>
      
      {/* 記事一覧 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">最新記事</h2>
        
        {articlesQuery.isLoading ? (
          <div className="py-4">記事を読み込み中...</div>
        ) : articlesQuery.isError ? (
          <div className="py-4 text-red-500">
            エラーが発生しました: {articlesQuery.error.message}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              表示できる記事が登録されていません。
              {isLoggedIn && ' フィードを追加してください。'}
            </p>
          </div>
        ) : (
          <>
            <ArticleList articles={filteredArticles} />
            
            {/* もっと読み込むボタン */}
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                disabled={articlesQuery.isLoading}
              >
                もっと読み込む
              </button>
            </div>
          </>
        )}
      </div>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-2">今後の予定</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
          <li>RSS以外のソース（API、ウェブスクレイピング等）からの情報収集</li>
          <li>カテゴリーによるグループ化と分類</li>
          <li>重要度によるフィルタリング</li>
          <li>お気に入り記事の保存機能</li>
        </ul>
      </div>
    </div>
  );
}
