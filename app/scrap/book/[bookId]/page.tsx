'use client';
import React, { useState, useEffect } from "react";
import useSWR from 'swr';
import { useParams } from "next/navigation";
import ScrapThread from "@/app/scrap/_components/ScrapThread";
import ScrapForm from "@/app/scrap/_components/ScrapForm";
import { ScrapWithTimeAgo } from "@/app/api/scrapbook/[id]/route";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ScrapBookPage() {
    const [showForm, setShowForm] = useState(false);
    const [localScraps, setLocalScraps] = useState<ScrapWithTimeAgo[]>([]);
    const params = useParams();
    const { bookId } = params;

    const { data: scrapBook, error, mutate } = useSWR<ScrapWithTimeAgo[]>(`/api/scrapbook/${bookId}`, fetcher, {
        onSuccess: (data) => {
            if (Array.isArray(data)) {
                //　dataよりlocalScrapsの方が少ない場合、localScrapsを更新
                if (data.length > localScraps.length) {
                    setLocalScraps(data); // フェッチ成功時にローカル状態を更新
                }
            }
        }
    });

    const handleToggleForm = () => {
        setShowForm(prevShowForm => !prevShowForm);
    };

    const handleScrapAdded = async (newScrap: ScrapWithTimeAgo) => {
        // 即座にローカル状態を更新してクライアント側で表示を更新
        setLocalScraps((prevScraps) => [...prevScraps, newScrap]);

        // 非同期でAPIコールを行い、データを再フェッチ
        await mutate();
    };

    useEffect(() => {
        if (scrapBook && Array.isArray(scrapBook)) {
            setLocalScraps(scrapBook);
        }
    }, [scrapBook]);

    if (error) return <div>Failed to load</div>;
    if (!scrapBook && localScraps.length === 0) return <div>Loading...</div>;

    return (
        <div className="flex flex-col min-h-[100dvh]">
            <main className="flex-1 bg-gray-100 dark:bg-gray-700 p-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Scrap Threads for Book {bookId}</h1>
                    {localScraps.length > 0 && (
                        <ScrapThread scraps={localScraps} />
                    )}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleToggleForm}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            {showForm ? "Cancel" : "Add New Scrap"}
                        </button>
                    </div>
                    {showForm && (
                        <div className="mt-6">
                            {bookId && (
                                <ScrapForm
                                    scrapBookId={bookId as string}
                                    onScrapAdded={handleScrapAdded}
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
