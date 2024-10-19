// app/scrapbook/[id]/page.tsx
import { notFound } from 'next/navigation';
import ScrapClient from './ScrapClient';
import { ScrapWithTimeAgo } from '@/app/api/scrapbook/[id]/route';

export default async function ScrapBookPage({ params }) {
    const { bookId: bookId } = params;

    // サーバー側でデータをフェッチ
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/scrapbook/${bookId}`, {
        cache: 'no-store',
    });

    if (!res) {
        // エラーハンドリングまたは404ページを表示
        return notFound();
    }

    const scrapBook: ScrapWithTimeAgo[] = await res.json();

    return (
        <div className="flex flex-col min-h-[100dvh]">
            <main className="flex-1 bg-gray-100 dark:bg-gray-700 p-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Scrap Threads for Book {bookId}</h1>
                    <ScrapClient scraps={scrapBook} bookId={bookId} />
                </div>
            </main>
        </div>
    );
}
