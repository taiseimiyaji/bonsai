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
      <main className="flex-1 bg-gray-100 dark:bg-gray-700 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">公開されたスクラップ</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {scrapBooks.length > 0 ? (
              scrapBooks.map((scrapBook) => (
                <ScrapBookCard
                  key={scrapBook.id}
                  id={scrapBook.id}
                  title={scrapBook.title}
                  description={scrapBook.description || ""}
                  image={scrapBook.image || ""}
                  user={scrapBook.user}
                  createdAt={scrapBook.createdAt}
                  updatedAt={scrapBook.updatedAt}
                  status={scrapBook.status}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">公開されているスクラップはありません</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
