'use client';

import ScrapBookCard from "@/app/scrap/_components/ScrapBookCard";
import React from "react";
import {trpcCaller} from "@/app/api/trpc/trpc-server";
import ScrapBookClientPage from "./_components/ScrapBookClientPage";

// ビルド時かどうかを判定
const isBuildTime = process.env.NODE_ENV === 'production' && 
                    (process.env.NEXT_PHASE === 'phase-production-build' || 
                     !process.env.DATABASE_URL || 
                     process.env.DATABASE_URL.includes('dummy'));

// モックデータ
const mockScrapBooks = [
  {
    id: "mock-id-1",
    title: "モックスクラップブック1",
    description: "ビルド時に表示されるモックデータです",
    image: null,
    user: {
      id: "mock-user-id-1",
      name: "モックユーザー",
      image: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// サーバーコンポーネントでデータ取得
export default async function ScrapBookList() {
    try {
        // ビルド時はモックデータを使用
        if (isBuildTime) {
            console.log('Using mock data for build time');
            return <ScrapBookClientPage scrapBooks={mockScrapBooks} />;
        }

        // サーバーサイドでデータを取得
        const scrapBooks = await trpcCaller(async (caller) => {
            return caller.scrapBook.getPublicScrapBooks();
        });

        // クライアントコンポーネントにデータを渡す
        return <ScrapBookClientPage scrapBooks={scrapBooks} />;
    } catch (error) {
        console.error('Error fetching ScrapBooks:', error);
        // エラー時はモックデータを表示
        return <ScrapBookClientPage scrapBooks={mockScrapBooks} />;
    }
}
