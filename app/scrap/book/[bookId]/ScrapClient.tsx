// app/scrapbook/[id]/ScrapClient.tsx
'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import ScrapThread from '@/app/scrap/_components/ScrapThread';
import ScrapForm from '@/app/scrap/_components/ScrapForm';
import { ScrapWithTimeAgo } from '@/app/api/scrapbook/[id]/route';

interface ScrapClientProps {
    scraps: ScrapWithTimeAgo[];
    bookId: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ScrapClient({ scraps: initialScraps, bookId }: ScrapClientProps) {
    const [showForm, setShowForm] = useState(false);

    const { data: scraps, error, mutate } = useSWR<ScrapWithTimeAgo[]>(
        `/api/scrapbook/${bookId}`,
        fetcher,
        {
            fallbackData: initialScraps,
        }
    );

    const handleToggleForm = () => {
        setShowForm((prevShowForm) => !prevShowForm);
    };

    const handleScrapAdded = async (newScrap: ScrapWithTimeAgo) => {
        // ローカル状態を楽観的に更新
        mutate((currentData) => [...(currentData || []), newScrap], false);

        // 新しいスクラップをバックエンドに送信
        try {
            await fetch(`/api/scrapbook/${bookId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newScrap),
            });
            // 成功後にデータを再フェッチ
            mutate();
        } catch (err) {
            // エラーハンドリングやロールバック
            console.error('Failed to add scrap:', err);
            mutate();
        }
    };

    if (error) return <div>Failed to load</div>;
    if (!scraps) return <div>Loading...</div>;

    return (
        <>
            {scraps.length > 0 && <ScrapThread scraps={scraps} />}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleToggleForm}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    {showForm ? 'Cancel' : 'Add New Scrap'}
                </button>
            </div>
            {showForm && (
                <div className="mt-6">
                    <ScrapForm scrapBookId={bookId} onScrapAdded={handleScrapAdded} />
                </div>
            )}
        </>
    );
}
