/**
 * ソースフィルターコンポーネント
 */
'use client';

import { useState } from 'react';

interface Feed {
  id: string;
  title: string;
  feedType: 'PUBLIC' | 'PRIVATE';
}

interface SourceFilterProps {
  feeds: Feed[];
  selectedSources: string[];
  onChange: (sources: string[]) => void;
}

export default function SourceFilter({ feeds, selectedSources, onChange }: SourceFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // すべて選択/解除
  const handleSelectAll = (select: boolean) => {
    if (select) {
      onChange(feeds.map(feed => feed.id));
    } else {
      onChange([]);
    }
  };
  
  // 個別のソース選択/解除
  const handleSourceChange = (feedId: string) => {
    if (selectedSources.includes(feedId)) {
      onChange(selectedSources.filter(id => id !== feedId));
    } else {
      onChange([...selectedSources, feedId]);
    }
  };
  
  // 公開/プライベートフィードでグループ化
  const publicFeeds = feeds.filter(feed => feed.feedType === 'PUBLIC');
  const privateFeeds = feeds.filter(feed => feed.feedType === 'PRIVATE');
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">情報ソース</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 dark:text-blue-400"
        >
          {isExpanded ? '折りたたむ' : '展開する'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-4">
            <div className="flex space-x-4">
              <button
                onClick={() => handleSelectAll(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                すべて選択
              </button>
              <button
                onClick={() => handleSelectAll(false)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                すべて解除
              </button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedSources.length === 0 
                ? 'すべて表示' 
                : `${selectedSources.length}/${feeds.length} 選択中`}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 公開フィード */}
            {publicFeeds.length > 0 && (
              <div className="col-span-full mb-2">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">公開フィード</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {publicFeeds.map(feed => (
                    <div key={feed.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`feed-${feed.id}`}
                        checked={selectedSources.includes(feed.id)}
                        onChange={() => handleSourceChange(feed.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`feed-${feed.id}`} className="text-sm truncate">
                        {feed.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* プライベートフィード */}
            {privateFeeds.length > 0 && (
              <div className="col-span-full">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">プライベートフィード</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {privateFeeds.map(feed => (
                    <div key={feed.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`feed-${feed.id}`}
                        checked={selectedSources.includes(feed.id)}
                        onChange={() => handleSourceChange(feed.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`feed-${feed.id}`} className="text-sm truncate">
                        {feed.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
