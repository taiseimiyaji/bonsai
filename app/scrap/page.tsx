import { Suspense } from 'react';
import { trpcCaller } from '@/app/api/trpc/trpc-server';
import ScrapBookClientPage from '@/app/scrap/_components/ScrapBookClientPage';
import type { ScrapBook } from '@/app/scrap/_components/ScrapBookClientPage';

// ビルド時のモックデータ
const mockScrapBooks: ScrapBook[] = [
  {
    id: "mock-id-1",
    title: "モックスクラップブック1",
    description: "これはビルド時に使用されるモックデータです",
    image: null,
    user: {
      id: "mock-user-1",
      name: "モックユーザー",
      image: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// サーバーコンポーネントでデータを取得
export default async function ScrapPage() {
  // ビルド時はモックデータを使用
  let scrapBooks: ScrapBook[] = [];
  
  try {
    // ビルド時はモックデータを使用し、それ以外の場合はAPIから取得
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('ビルド時のためモックデータを使用します');
      scrapBooks = mockScrapBooks;
    } else {
      // APIからデータを取得し、ScrapBook型に変換
      const apiScrapBooks = await trpcCaller(async (caller) => {
        return caller.scrapBook.getPublicScrapBooks();
      });
      
      // APIから取得したデータをScrapBook型に変換
      scrapBooks = apiScrapBooks.map(book => ({
        id: book.id,
        title: book.title,
        description: book.description,
        image: book.image,
        user: {
          id: book.user.id,
          name: book.user.name,
          image: book.user.image
        },
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString()
      }));
    }
  } catch (error) {
    console.error('スクラップブックの取得に失敗しました:', error);
    // エラー時はモックデータを使用
    scrapBooks = mockScrapBooks;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScrapBookClientPage scrapBooks={scrapBooks} />
    </Suspense>
  );
}
