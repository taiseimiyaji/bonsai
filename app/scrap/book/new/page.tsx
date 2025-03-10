import React from "react";
import ScrapBookForm from "@/app/scrap/_components/ScrapBookForm";

export default function NewScrapBookPage() {
    return (
        <div className="flex flex-col min-h-screen bg-gray-900">
            <main className="flex-1 p-6 bg-gray-700">
                <ScrapBookForm />
            </main>
        </div>
    );
}