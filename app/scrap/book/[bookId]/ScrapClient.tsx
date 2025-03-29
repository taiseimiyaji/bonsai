'use client';

import React, {useEffect, useState, useCallback} from 'react';
import ScrapThread from '@/app/scrap/_components/ScrapThread';
import ScrapForm from '@/app/scrap/_components/ScrapForm';
import { ScrapWithTimeAgo } from '@/app/types/ScrapWithTimeAgo';
import {trpc} from "@/app/api/trpc/trpc-client";
import { GlobeIcon, LockClosedIcon } from '@heroicons/react/solid';

interface ScrapClientProps {
    scraps: ScrapWithTimeAgo[];
    bookId: string;
    isOwner: boolean;
    scrapBook: {
        id: string;
        title: string;
        description: string | null;
        status: "PUBLIC" | "PRIVATE";
    };
}

export default function ScrapClient(
    {
        scraps: initialScraps,
        bookId,
        isOwner,
        scrapBook,
    }: ScrapClientProps) {
    const [showForm, setShowForm] = useState(false);
    const [status, setStatus] = useState<"PUBLIC" | "PRIVATE">(scrapBook.status);
    const [isUpdating, setIsUpdating] = useState(false);

    const utils = trpc.useContext();

    // **tRPCのuseQueryでデータ取得**
    const { data: scraps = initialScraps, isLoading, isError } = trpc.scrap.getScraps.useQuery(
        { scrapBookId: bookId },
        {
            initialData: initialScraps,
        }
    );

    const addScrapMutation = trpc.scrap.addScrap.useMutation({
        // 成功時にクエリを無効化して再フェッチ
        onSuccess: () => {
            utils.scrap.getScraps.invalidate({ scrapBookId: bookId });
        },
    });

    const updateStatusMutation = trpc.scrapBook.updateScrapBookStatus.useMutation({
        onSuccess: () => {
            utils.scrapBook.getScrapBookById.invalidate({ id: bookId });
        },
    });

    const handleToggleForm = useCallback(() => {
        setShowForm((prevShowForm) => !prevShowForm);
    }, []);

    const handleToggleStatus = async () => {
        const newStatus = status === "PUBLIC" ? "PRIVATE" : "PUBLIC";
        setIsUpdating(true);
        try {
            await updateStatusMutation.mutateAsync({
                id: bookId,
                status: newStatus,
            });
            setStatus(newStatus);
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        if (showForm) {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            // スクロールされ終わったらフォーカス
            setTimeout(() => {
                document.getElementById('content')?.focus();
            }, 200);
        }
    }, [showForm]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!showForm && event.key === 'Enter') {
                handleToggleForm()
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleToggleForm, showForm]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (showForm && event.key === 'Escape') {
                handleToggleForm()
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleToggleForm, showForm]);

    const handleScrapAdded = async (newScrapData: Omit<ScrapWithTimeAgo, 'id' | 'timeAgo' | "createdAt" | "updatedAt" | "user">) => {
        // **楽観的更新**
        await utils.scrap.getScraps.cancel({ scrapBookId: bookId });

        const previousData = utils.scrap.getScraps.getData({ scrapBookId: bookId });

        // 型を明示的に指定して、期待される型と一致させる
        utils.scrap.getScraps.setData({ scrapBookId: bookId }, (oldData) => {
            if (!oldData) return [
                {
                    ...newScrapData,
                    id: 'temp-id', // 一時的なID
                    timeAgo: 'just now',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    user: {
                        id: 'temp-user-id',
                        name: 'You',
                        image: '/user.svg'
                    }
                }
            ];
            
            return [
                ...oldData,
                {
                    ...newScrapData,
                    id: 'temp-id', // 一時的なID
                    timeAgo: 'just now',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    user: {
                        id: 'temp-user-id',
                        name: 'You',
                        image: '/user.svg'
                    }
                }
            ];
        });

        try {
            // contentがnullの場合は空文字列として渡す
            const contentToSend = newScrapData.content === null ? '' : newScrapData.content;
            const { scrapBookId, ...restData } = newScrapData;
            await addScrapMutation.mutateAsync({ 
                scrapBookId: bookId, 
                ...restData,
                content: contentToSend
            });
            // onSuccessで再フェッチが行われます
        } catch (err) {
            // エラー時にロールバック
            utils.scrap.getScraps.setData({ scrapBookId: bookId }, previousData);
            console.error('Failed to add scrap:', err);
        }
        // 追加されたあとに画面を一番下にゆっくりスクロール
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

        // 追加されたあとに次のフォームにフォーカス
        // すでに開いているフォームにフォーカス
        document.getElementById('content')?.focus();

    };

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Failed to load</div>;

    if (!scraps) return <div>Scrap not found</div>;

    return (
        <>
            {isOwner && (
                <div className="mb-6 flex items-center justify-between bg-gray-200 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center">
                        <span className="mr-2">公開設定:</span>
                        <div className={`flex items-center px-2 py-1 rounded-full ${status === "PUBLIC" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}`}>
                            {status === "PUBLIC" ? (
                                <><GlobeIcon className="w-4 h-4 mr-1" /> 公開</>
                            ) : (
                                <><LockClosedIcon className="w-4 h-4 mr-1" /> 非公開</>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleToggleStatus}
                        disabled={isUpdating}
                        className={`px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                            status === "PUBLIC" 
                                ? "bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500" 
                                : "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500"
                        }`}
                    >
                        {isUpdating ? '更新中...' : status === "PUBLIC" ? '非公開にする' : '公開する'}
                    </button>
                </div>
            )}
            {scraps.length > 0 && <ScrapThread scraps={scraps}/>}
            <div className="mt-6 flex justify-end">
                {showForm && isOwner && (
                    <button
                        onClick={handleToggleForm}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                        Cancel
                    </button>
                )}
                {!showForm && isOwner &&(
                    <button
                        onClick={handleToggleForm}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        Add Scrap
                    </button>
                )}
            </div>
            {showForm && (
                <div className="mt-6">
                    <ScrapForm scrapBookId={bookId} onScrapAdded={handleScrapAdded}/>
                </div>
            )}
        </>
    );
}
