/**
 * RSSフィード一覧を表示するコンポーネント
 */
'use client';

import { trpc } from '@/app/api/trpc/trpc-client';

interface FeedListProps {
  isLoggedIn: boolean;
}

export default function FeedList({ isLoggedIn }: FeedListProps) {
  // ログイン状態に応じて適切なクエリを使用
  const feedsQuery = isLoggedIn
    ? trpc.rss.getUserFeeds.useQuery()
    : trpc.rss.getPublicFeeds.useQuery();
  
  // 削除ミューテーション（ログインユーザーのみ）
  const deleteFeedMutation = trpc.rss.deleteFeed.useMutation({
    onSuccess: () => {
      // 削除成功時にフィード一覧を再取得
      feedsQuery.refetch();
    }
  });

  // 更新ミューテーション（ログインユーザーのみ）
  const updateFeedMutation = trpc.rss.updateFeed.useMutation({
    onSuccess: () => {
      // 更新成功時にフィード一覧を再取得
      feedsQuery.refetch();
    }
  });
  
  if (feedsQuery.isLoading) {
    return <div className="py-2">フィードを読み込み中...</div>;
  }
  
  if (feedsQuery.isError) {
    return (
      <div className="py-2 text-red-500">
        エラーが発生しました: {feedsQuery.error.message}
      </div>
    );
  }
  
  const feeds = feedsQuery.data || [];
  
  if (feeds.length === 0) {
    return (
      <div className="py-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          フィードが登録されていません。
        </p>
      </div>
    );
  }
  
  // フィードを削除する処理
  const handleDelete = (feedId: string) => {
    if (confirm('このフィードを削除してもよろしいですか？')) {
      deleteFeedMutation.mutate({ feedId });
    }
  };

  // フィードを更新する処理
  const handleUpdate = (feedId: string) => {
    updateFeedMutation.mutate({ feedId });
  };
  
  return (
    <ul className="space-y-3">
      {feeds.map((feed) => (
        <li key={feed.id} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
          <div className="flex justify-between items-start">
            <div>
              <a 
                href={`/rss/feed/${feed.id}`}
                className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
              >
                {feed.title}
              </a>
              {feed.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                  {feed.description}
                </p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {feed.feedType === 'PUBLIC' ? '公開' : 'プライベート'}
              </div>
            </div>
            
            {isLoggedIn && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUpdate(feed.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  disabled={updateFeedMutation.isLoading}
                >
                  更新
                </button>
                <button
                  onClick={() => handleDelete(feed.id)}
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  disabled={deleteFeedMutation.isLoading}
                >
                  削除
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
