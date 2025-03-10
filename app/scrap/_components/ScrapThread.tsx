import React from "react";
import UserIcon from "@/app/scrap/_components/UserIcon";
import Link from "next/link";
import { ScrapWithTimeAgo } from "@/app/types/ScrapWithTimeAgo";

interface ScrapThreadProps {
    scraps: ScrapWithTimeAgo[];
}

export default function ScrapThread({ scraps }: ScrapThreadProps) {
    return (
        <div className="space-y-6">
            {scraps.map((scrap) => (
                <div
                    key={scrap.id}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4"
                >
                    <div className="flex items-center justify-between border-b pb-2 mb-2 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-800 w-10 h-10 flex items-center justify-center">
                                {scrap?.user?.image ? (
                                    <img
                                        src={scrap.user.image}
                                        alt={scrap.user.name}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                {/* タイトルは表示しない */}
                                {/* <h2 className="text-xl font-bold">{scrap.title}</h2> */}
                                <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {scrap?.user?.name} - {scrap.timeAgo}
                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        {/* contentを表示 */}
                        <p className="text-gray-500 dark:text-gray-400">{scrap.content}</p>

                        {/* ogpDataが存在する場合はOGP情報を表示 */}
                        {scrap.ogpData && (
                            <div className="flex gap-4">
                                {/* OGP画像がある場合は画像を表示 */}
                                {scrap.ogpData.image && scrap.ogpData.image.trim() !== "" && (
                                    <div className="flex-shrink-0 w-full max-w-sm bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden">
                                        <img
                                            src={scrap.ogpData.image}
                                            alt={`${scrap.ogpData.title} OGP`}
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">
                                        {scrap.ogpData.title}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {scrap.ogpData.description}
                                    </p>
                                    <a
                                        href={scrap.ogpData.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline"
                                    >
                                        {scrap.ogpData.link}
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* View Moreボタン */}
                        {scrap.ogpData && (
                        <div className="flex items-center justify-between mt-4">
                            <Link
                                href={scrap.ogpData.link}
                                target="_blank"
                            >
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                                    View More
                                </button>
                            </Link>
                        </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
