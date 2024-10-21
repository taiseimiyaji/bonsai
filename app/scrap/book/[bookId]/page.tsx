// app/scrapbook/[id]/page.tsx
import { notFound } from 'next/navigation';
import ScrapClient from './ScrapClient';
import {createTRPCContext} from "@/app/api/trpc/init";
import {appRouter} from "@/app/api/trpc/routers/_app";
import {trpcCaller} from "@/app/api/trpc/trpc-server";

export default async function ScrapBookPage({ params }: { params: { bookId: string } }) {
    const { bookId: bookId } = params;

    const scrapBook = await trpcCaller(async (caller) => {
        return caller.scrapBook.getScrapBookById({ id: bookId });
    });

    const scraps = await trpcCaller(async (caller) => {
        return caller.scrap.getScraps({ scrapBookId: bookId });
    });

    if (!scraps) {
        // エラーハンドリングまたは404ページを表示
        return notFound();
    }
    return (
        <div className="flex flex-col min-h-[100dvh]">
            <main className="flex-1 bg-gray-100 dark:bg-gray-700 p-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Scrap Threads for Book {scrapBook.title}</h1>
                    <ScrapClient scraps={scraps} bookId={bookId} />
                </div>
            </main>
        </div>
    );
}
