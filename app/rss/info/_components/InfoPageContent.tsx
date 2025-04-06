/**
 * RSSリーダーのInfoページコンテンツ - 収集した記事の一覧表示
 */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '../../../trpc-client';
import ArticleList from './ArticleList';
import SourceFilter from './SourceFilter';
import FlipClock from './Clock';

// タブの種類を定義
type TabType = 'userFeeds' | 'zennTrend' | 'qiitaTrend';
// 既読フィルターの種類を定義
type ReadFilterType = 'all' | 'read' | 'unread';

export interface InfoPageProps {
  isTopPage?: boolean;
}

export function InfoPageContent({ isTopPage = false }: InfoPageProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  
  // アクティブなタブの状態（ログイン状態に応じてデフォルト値を設定）
  const [activeTab, setActiveTab] = useState<TabType>('zennTrend');
  
  // ログイン状態が変わったらタブを適切に設定
  useEffect(() => {
    if (isLoggedIn && !isTopPage) {
      setActiveTab('userFeeds');
    } else {
      setActiveTab('zennTrend');
    }
  }, [isLoggedIn, isTopPage]);
  
  // フィルター状態
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilterType>('all');
  const [limit, setLimit] = useState(20);
  
  // ログイン状態に応じて適切なクエリを使用
  const articlesQuery = isLoggedIn && !isTopPage
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
        article.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 選択されたソースでフィルタリング
      const matchesSource = selectedSources.length === 0 || 
        (article.feed && selectedSources.includes(article.feed.id));
      
      return matchesSearch && matchesSource;
    }) || []);
  };
  
  // 記事が既読になった時の処理
  const handleArticleRead = (articleId: string) => {
    // 既読記事の状態を更新
    const updatedArticles = articlesQuery.data?.map(article => {
      if (article.id === articleId) {
        return { ...article, isRead: true };
      }
      return article;
    });
    
    // クエリのデータを更新
    if (updatedArticles) {
      articlesQuery.data = updatedArticles;
    }
  };

  return (
    <div className={isTopPage ? "" : "min-h-screen bg-gray-900 p-6"}>
      {!isTopPage && <FlipClock />}
      
      {/* タブ切り替え */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {!isTopPage && isLoggedIn && (
              <button
                onClick={() => setActiveTab('userFeeds')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'userFeeds'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'}
                `}
              >
                マイフィード
              </button>
            )}
            <button
              onClick={() => setActiveTab('zennTrend')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'zennTrend'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'}
              `}
            >
              Zennトレンド
            </button>
            <button
              onClick={() => setActiveTab('qiitaTrend')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'qiitaTrend'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'}
              `}
            >
              Qiitaトレンド
            </button>
          </nav>
        </div>
      </div>
      
      {/* フィルターとコントロール */}
      {!isTopPage && (
        <div className="mb-6 flex flex-wrap gap-4">
          {/* ソースフィルター */}
          {activeTab === 'userFeeds' && feedsQuery.data && (
            <SourceFilter
              feeds={feedsQuery.data}
              selectedSources={selectedSources}
              onChange={setSelectedSources}
            />
          )}
          
          {/* 検索フィルター */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="記事を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          {/* 既読フィルター */}
          {isLoggedIn && (
            <div className="flex items-center space-x-2">
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value as ReadFilterType)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              >
                <option value="all">すべて表示</option>
                <option value="read">既読のみ</option>
                <option value="unread">未読のみ</option>
              </select>
            </div>
          )}
          
          {/* 表示件数 */}
          <div className="flex items-center space-x-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
            >
              <option value="10">10件</option>
              <option value="20">20件</option>
              <option value="50">50件</option>
              <option value="100">100件</option>
            </select>
          </div>
        </div>
      )}
      
      {/* 記事リスト */}
      <ArticleList
        articles={getActiveArticles()}
        isZennFeed={activeTab === 'zennTrend'}
        onArticleRead={handleArticleRead}
      />
    </div>
  );
}
