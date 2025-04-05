/**
 * RSSリーダーのInfoページ - 収集した記事の一覧表示
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '../../trpc-client';
import ArticleList from './_components/ArticleList';
import SourceFilter from './_components/SourceFilter';
import FlipClock from './_components/Clock';

// タブの種類を定義
type TabType = 'userFeeds' | 'zennTrend' | 'qiitaTrend';
// 既読フィルターの種類を定義
type ReadFilterType = 'all' | 'read' | 'unread';

export default function InfoPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  
  // アクティブなタブの状態（ログイン状態に応じてデフォルト値を設定）
  const [activeTab, setActiveTab] = useState<TabType>('zennTrend');
  
  // ログイン状態が変わったらタブを適切に設定
  useEffect(() => {
    if (isLoggedIn) {
      setActiveTab('userFeeds');
    } else {
      setActiveTab('zennTrend');
    }
  }, [isLoggedIn]);
  
  // フィルター状態
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilterType>('all');
  const [limit, setLimit] = useState(20);
  
  // ログイン状態に応じて適切なクエリを使用
  const articlesQuery = isLoggedIn
    ? trpc.rss.getUserArticles.useQuery({ 
        limit,
        readFilter
      }, {
        // limitが変更されたときにクエリを再取得
        keepPreviousData: true
      })
    : trpc.rss.getPublicArticles.useQuery({ limit }, {
        keepPreviousData: true
      });
  
  // Zennトレンド記事の取得
  const zennTrendQuery = trpc.rss.getZennTrendArticles.useQuery({ 
    limit,
    readFilter: isLoggedIn ? readFilter : 'all'
  }, {
    keepPreviousData: true
  });
  
  // Qiitaトレンド記事の取得
  const qiitaTrendQuery = trpc.rss.getQiitaTrendArticles.useQuery({ 
    limit,
    readFilter: isLoggedIn ? readFilter : 'all'
  }, {
    keepPreviousData: true
  });
  
  // フィードの取得（ソースフィルター用）
  const feedsQuery = isLoggedIn
    ? trpc.rss.getUserFeeds.useQuery()
    : trpc.rss.getPublicFeeds.useQuery();
  
  // Zennフィードのidを取得
  const zennFeedId = zennTrendQuery.data && zennTrendQuery.data.length > 0
    ? zennTrendQuery.data[0].feed?.id
    : undefined;
  
  // Qiitaフィードのidを取得
  const qiitaFeedId = qiitaTrendQuery.data && qiitaTrendQuery.data.length > 0
    ? qiitaTrendQuery.data[0].feed?.id
    : undefined;
  
  // アクティブなタブに応じた記事データを取得
  const getActiveArticles = () => {
    if (activeTab === 'zennTrend') {
      return zennTrendQuery.data || [];
    } else if (activeTab === 'qiitaTrend') {
      return qiitaTrendQuery.data || [];
    }
    
    // ユーザーフィードタブの場合は通常のフィルタリングを適用
    return (articlesQuery.data?.filter(article => {
      // トレンドフィードの記事を除外
      if ((zennFeedId && article.feedId === zennFeedId) || 
          (qiitaFeedId && article.feedId === qiitaFeedId)) {
        return false;
      }
      
      // 検索クエリでフィルタリング
      const matchesSearch = searchQuery === '' || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.description && article.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // ソースでフィルタリング
      const matchesSource = selectedSources.length === 0 || 
        selectedSources.includes(article.feedId);
      
      return matchesSearch && matchesSource;
    }) || []);
  };
  
  // 現在のタブに応じたローディング状態
  const isLoading = activeTab === 'userFeeds' 
    ? articlesQuery.isLoading 
    : activeTab === 'zennTrend'
      ? zennTrendQuery.isLoading
      : qiitaTrendQuery.isLoading;
  
  // 現在のタブに応じたエラー状態
  const error = activeTab === 'userFeeds' 
    ? articlesQuery.error 
    : activeTab === 'zennTrend'
      ? zennTrendQuery.error
      : qiitaTrendQuery.error;
  
  // 現在のタブに応じたisFetchingの状態
  const isFetching = activeTab === 'userFeeds' 
    ? articlesQuery.isFetching 
    : activeTab === 'zennTrend'
      ? zennTrendQuery.isFetching
      : qiitaTrendQuery.isFetching;
  
  // もっと読み込む
  const handleLoadMore = () => {
    setLimit(prevLimit => prevLimit + 20);
  };
  
  // 検索クエリの変更
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // ソースフィルターの変更
  const handleSourceFilterChange = (sources: string[]) => {
    setSelectedSources(sources);
  };
  
  // タブの切り替え
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };
  
  // 既読フィルターの変更
  const handleReadFilterChange = (filter: ReadFilterType) => {
    setReadFilter(filter);
  };
  
  // 記事が既読になった時の処理
  const handleArticleRead = (articleId: string) => {
    // 既読フィルターが「未読のみ」の場合、該当記事を表示から除外するために再取得
    if (readFilter === 'unread') {
      if (activeTab === 'userFeeds') {
        articlesQuery.refetch();
      } else if (activeTab === 'zennTrend') {
        zennTrendQuery.refetch();
      } else if (activeTab === 'qiitaTrend') {
        qiitaTrendQuery.refetch();
      }
    }
  };
  
  // 表示する記事
  const filteredArticles = getActiveArticles();
  
  // タブに応じたタイトルを取得
  const getTabTitle = () => {
    switch (activeTab) {
      case 'userFeeds':
        return '最新記事';
      case 'zennTrend':
        return 'Zennトレンド記事';
      case 'qiitaTrend':
        return 'Qiitaトレンド記事';
      default:
        return '記事一覧';
    }
  };
  
  // タブに応じた空の状態メッセージを取得
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'userFeeds':
        return (
          <>
            表示できる記事が登録されていません。
            {isLoggedIn && ' フィードを追加してください。'}
          </>
        );
      case 'zennTrend':
        return 'Zennのトレンド記事を読み込めませんでした。';
      case 'qiitaTrend':
        return 'Qiitaのトレンド記事を読み込めませんでした。';
      default:
        return '記事が見つかりませんでした。';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <FlipClock />
      </div>
      
      <div className="mb-8">
        {/* タブ切り替え - ログイン中のみユーザーフィードタブを表示 */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px">
            {isLoggedIn && (
              <li className="mr-2">
                <button
                  onClick={() => handleTabChange('userFeeds')}
                  className={`inline-block p-4 ${
                    activeTab === 'userFeeds'
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  ユーザーフィード
                </button>
              </li>
            )}
            <li className="mr-2">
              <button
                onClick={() => handleTabChange('zennTrend')}
                className={`inline-block p-4 ${
                  activeTab === 'zennTrend'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Zennトレンド
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => handleTabChange('qiitaTrend')}
                className={`inline-block p-4 ${
                  activeTab === 'qiitaTrend'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Qiitaトレンド
              </button>
            </li>
          </ul>
        </div>
        
        {/* フィルターエリア */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* 既読/未読フィルター - ログイン中のみ表示 */}
          {isLoggedIn && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">表示:</span>
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleReadFilterChange('all')}
                  className={`px-3 py-1 text-sm ${
                    readFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => handleReadFilterChange('unread')}
                  className={`px-3 py-1 text-sm ${
                    readFilter === 'unread'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  未読のみ
                </button>
                <button
                  onClick={() => handleReadFilterChange('read')}
                  className={`px-3 py-1 text-sm ${
                    readFilter === 'read'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  既読のみ
                </button>
              </div>
            </div>
          )}
          
          {/* ユーザーフィードタブの場合のみ検索とソースフィルターを表示 */}
          {activeTab === 'userFeeds' && isLoggedIn && (
            <>
              {/* 検索バー */}
              <div className="flex-grow">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="記事を検索..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800"
                  />
                  <svg 
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
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
            </>
          )}
        </div>
        
        {/* ソースフィルター - ユーザーフィードタブの場合のみ表示 */}
        {activeTab === 'userFeeds' && isLoggedIn && !feedsQuery.isLoading && feedsQuery.data && (
          <div className="mb-6">
            <SourceFilter 
              feeds={feedsQuery.data.filter(feed => 
                (!zennFeedId || feed.id !== zennFeedId) && 
                (!qiitaFeedId || feed.id !== qiitaFeedId)
              )}
              selectedSources={selectedSources}
              onChange={handleSourceFilterChange}
            />
          </div>
        )}
      </div>
      
      {/* 記事一覧 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {getTabTitle()}
        </h2>
        
        {isLoading && !isFetching ? (
          <div className="py-4">記事を読み込み中...</div>
        ) : error ? (
          <div className="py-4 text-red-500">
            エラーが発生しました: {error.message}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {getEmptyMessage()}
            </p>
          </div>
        ) : (
          <>
            <ArticleList 
              articles={filteredArticles} 
              isZennFeed={activeTab === 'zennTrend' || activeTab === 'qiitaTrend'}
              onArticleRead={handleArticleRead}
            />
            
            {/* もっと読み込むボタン */}
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                disabled={isFetching}
              >
                {isFetching ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    読み込み中...
                  </span>
                ) : (
                  'もっと読み込む'
                )}
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
