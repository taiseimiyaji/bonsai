/**
 * 新しいRSSフィードを追加するフォームコンポーネント
 */
'use client';

import { useState } from 'react';
import { trpc } from '../../trpc-client';

export default function AddFeedForm() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // フィード追加のミューテーション
  const addFeedMutation = trpc.rss.addFeed.useMutation({
    onSuccess: () => {
      // 成功時にフォームをリセット
      setUrl('');
      setError(null);
      // フィード一覧を再取得するためにページをリロード
      window.location.reload();
    },
    onError: (error) => {
      setError(error.message);
    }
  });
  
  // フォーム送信処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 入力値の検証
    if (!url.trim()) {
      setError('URLを入力してください');
      return;
    }
    
    try {
      // URLの形式チェック
      new URL(url);
      
      // フィードを追加
      addFeedMutation.mutate({ url: url.trim() });
    } catch (err) {
      setError('有効なURLを入力してください');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="feed-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          RSSフィードのURL
        </label>
        <input
          id="feed-url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/feed.xml"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={addFeedMutation.isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {addFeedMutation.isLoading ? '追加中...' : 'フィードを追加'}
      </button>
    </form>
  );
}
