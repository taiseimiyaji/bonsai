import React, { useEffect, useState } from "react";
import UserIcon from "@/app/scrap/_components/UserIcon";
import Link from "next/link";
import { ScrapWithTimeAgo } from "@/app/api/scrapbook/[id]/route";

interface ScrapThreadProps {
    scraps: ScrapWithTimeAgo[];
}

export default function ScrapThread({ scraps }: ScrapThreadProps) {
    const [updatedScraps, setUpdatedScraps] = useState<ScrapWithTimeAgo[]>([]);

    useEffect(() => {
        if (Array.isArray(scraps)) {
            setUpdatedScraps(scraps); // scrapsが配列である場合に状態を更新
        }
    }, [scraps]);

    return (
        <div className="space-y-6">
            {updatedScraps.map((scrap) => (
                <div key={scrap.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between border-b pb-2 mb-2 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-800 w-10 h-10 flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold">{scrap.title}</h2>
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{scrap.timeAgo}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-32 h-24 bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden">
                            {scrap.ogpData?.image && scrap.ogpData.image.trim() !== "" ? (
                                <img
                                    src={scrap.ogpData.image}
                                    alt={`${scrap.title} OGP`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <span className="text-gray-500 dark:text-gray-400 text-lg">{scrap.title}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-500 dark:text-gray-400 line-clamp-2">{scrap.content}</p>
                            <div className="flex items-center justify-between mt-4">
                                <Link href={`/scrap/${scrap.id}`}>
                                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                                        View More
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
