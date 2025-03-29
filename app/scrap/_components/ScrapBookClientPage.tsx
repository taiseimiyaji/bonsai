'use client';

import React from "react";
import ScrapBookCard from "./ScrapBookCard";

// クライアントコンポーネントの型定義
export interface ScrapBook {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  createdAt: string; 
  updatedAt: string;
  status: "PUBLIC" | "PRIVATE"; // ステータスフィールドを追加
}

export interface ScrapBookClientPageProps {
  scrapBooks: ScrapBook[];
}

// クライアントコンポーネント
export default function ScrapBookClientPage({ scrapBooks }: ScrapBookClientPageProps) {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1 bg-gray-100 dark:bg-gray-700 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">公開されたスクラップ</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scrapBooks.map((scrapBook) => (
              <ScrapBookCard
                key={scrapBook.id}
                id={scrapBook.id}
                title={scrapBook.title}
                description={scrapBook.description || ""}
                image={scrapBook.image || ""}
                user={scrapBook.user}
                createdAt={scrapBook.createdAt}
                updatedAt={scrapBook.updatedAt}
                status={scrapBook.status} // ステータスプロパティを追加
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
