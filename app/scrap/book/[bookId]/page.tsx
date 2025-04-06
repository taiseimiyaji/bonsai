import { notFound } from 'next/navigation';
import ScrapClient from './ScrapClient';
import {trpcCaller} from "@/app/api/trpc/trpc-server";
import {getServerSession} from "next-auth/next";
import {nextAuthOptions} from "@/app/_utils/next-auth-options";
import { ScrapWithTimeAgo } from '@/app/types/ScrapWithTimeAgo';

export default async function ScrapBookPage(props: { params: Promise<{ bookId: string }> }) {
    const params = await props.params;
    const { bookId: bookId } = params;

    const scrapBook = await trpcCaller(async (caller) => {
        return caller.scrapBook.getScrapBookById({ id: bookId });
    });

    const scrapsData = await trpcCaller(async (caller) => {
        return caller.scrap.getScraps({ scrapBookId: bookId });
    });

    const session = await getServerSession(nextAuthOptions);
    console.log(session);

    const isOwner = session?.userId === scrapBook.user.id;

    if (!scrapsData) {
        // エラーハンドリングまたは404ページを表示
        return notFound();
    }

    // scrapsデータを適切な形式に変換
    const scraps: ScrapWithTimeAgo[] = scrapsData.map(scrap => ({
        ...scrap,
        createdAt: scrap.createdAt instanceof Date ? scrap.createdAt.toISOString() : scrap.createdAt,
        updatedAt: scrap.updatedAt instanceof Date ? scrap.updatedAt.toISOString() : scrap.updatedAt
    }));

    return (
        <div className="flex flex-col min-h-[100dvh]">
            <main className="flex-1 bg-gray-100 dark:bg-gray-700 p-6">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">{scrapBook.title}</h1>
                    <ScrapClient 
                        scraps={scraps} 
                        bookId={bookId} 
                        isOwner={isOwner} 
                        scrapBook={{
                            id: scrapBook.id,
                            title: scrapBook.title,
                            description: scrapBook.description,
                            status: scrapBook.status
                        }}
                    />
                </div>
            </main>
        </div>
    );
}
