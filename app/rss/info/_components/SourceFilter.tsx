/**
 * ソースフィルターコンポーネント
 */
'use client';

import { useState } from 'react';

export interface SourceFilterProps {
  feeds: any[];
  selectedSources: string[];
  onChange: (sources: string[]) => void;
}

export default function SourceFilter({ feeds, selectedSources, onChange }: SourceFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSourceToggle = (feedId: string) => {
    const newSources = selectedSources.includes(feedId)
      ? selectedSources.filter(id => id !== feedId)
      : [...selectedSources, feedId];
    onChange(newSources);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
      >
        フィルター
        {selectedSources.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            {selectedSources.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 w-64 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          <div className="p-2">
            {feeds.map(feed => (
              <label key={feed.id} className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSources.includes(feed.id)}
                  onChange={() => handleSourceToggle(feed.id)}
                  className="mr-2"
                />
                <span className="text-white">{feed.name || feed.url}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
