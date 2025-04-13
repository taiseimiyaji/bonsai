import { notFound } from 'next/navigation';
import ScrapClient from './ScrapClient';
import {trpcCaller} from "@/app/api/trpc/trpc-server";
import {auth} from "@/auth";
import {redirect} from "next/navigation";
import { ScrapWithTimeAgo } from '@/app/types/ScrapWithTimeAgo';

export default async function ScrapBookPage({params}: { params: { bookId: string } }) {
    const bookId = params.bookId;

    const scrapBook = await trpcCaller(async (caller) => {
        return caller.scrapBook.getScrapBookById({ id: bookId });
    });

    const scrapsData = await trpcCaller(async (caller) => {
        return caller.scrap.getScraps({ scrapBookId: bookId });
    });

    const session = await auth();
    
    if (!session) {
        redirect('/auth/signin');
    }

    const isOwner = session.user?.id === scrapBook.user.id;

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
