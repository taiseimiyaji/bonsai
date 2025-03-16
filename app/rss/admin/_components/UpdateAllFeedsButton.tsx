'use client';

import { useState } from 'react';
import { trpc } from '@/app/api/trpc/trpc-client';

export default function UpdateAllFeedsButton() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const updateAllMutation = trpc.rss.updateAllFeeds.useMutation({
    onSuccess: (data) => {
      setResult({
        success: true,
        message: `${data.newArticlesCount}件の新しい記事を取得しました`
      });
      setIsUpdating(false);
    },
    onError: (error) => {
      setResult({
        success: false,
        message: `エラーが発生しました: ${error.message}`
      });
      setIsUpdating(false);
    }
  });
  
  const handleUpdate = () => {
    setIsUpdating(true);
    setResult(null);
    updateAllMutation.mutate();
  };
  
  return (
    <div>
      <button
        onClick={handleUpdate}
        disabled={isUpdating}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUpdating ? '更新中...' : '全フィードを更新'}
      </button>
      
      {result && (
        <div className={`mt-2 text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
