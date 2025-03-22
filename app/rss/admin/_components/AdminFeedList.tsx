/**
 * 管理者用のRSSフィード一覧コンポーネント
 */
'use client';

import { trpc } from '@/app/lib/trpc-client';

export default function AdminFeedList() {
  // 公開フィードを取得
  const feedsQuery = trpc.rss.getPublicFeeds.useQuery();
  
  // 削除ミューテーション
  const deleteFeedMutation = trpc.rss.deleteFeed.useMutation({
    onSuccess: () => {
      // 削除成功時にフィード一覧を再取得
      feedsQuery.refetch();
    }
  });

  // 更新ミューテーション
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
          公開フィードが登録されていません。
        </p>
      </div>
    );
  }
  
  // フィードを削除する処理
  const handleDelete = (feedId: string) => {
    if (confirm('この公開フィードを削除してもよろしいですか？')) {
      deleteFeedMutation.mutate({ feedId });
    }
  };

  // フィードを更新する処理
  const handleUpdate = (feedId: string) => {
    updateFeedMutation.mutate({ feedId });
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              タイトル
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              URL
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              最終更新
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              アクション
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {feeds.map((feed) => (
            <tr key={feed.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium">{feed.title}</div>
                {feed.description && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                    {feed.description}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm truncate max-w-xs">
                  <a 
                    href={feed.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {feed.url}
                  </a>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {feed.lastFetched 
                  ? new Date(feed.lastFetched).toLocaleString('ja-JP')
                  : '未取得'
                }
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleUpdate(feed.id)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    disabled={updateFeedMutation.isLoading}
                  >
                    更新
                  </button>
                  <button
                    onClick={() => handleDelete(feed.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    disabled={deleteFeedMutation.isLoading}
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
