import React from "react";
import UserIcon from "@/app/scrap/_components/UserIcon";
import Link from "next/link";
import { ScrapWithTimeAgo } from "@/app/types/ScrapWithTimeAgo";
import Image from "next/image";

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
                                    <Image
                                        src={scrap.user.image}
                                        alt={scrap.user.name}
                                        className="w-full h-full object-cover rounded-full"
                                        width={40}
                                        height={40}
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
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* OGP画像がある場合は画像を表示 */}
                                {scrap.ogpData.image && scrap.ogpData.image.trim() !== "" && (
                                    <div className="flex-shrink-0 w-full sm:w-auto sm:max-w-[200px] bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden">
                                        <Image
                                            src={scrap.ogpData.image}
                                            alt={`${scrap.ogpData.title} OGP`}
                                            className="w-full h-auto object-cover"
                                            width={300}
                                            height={200}
                                        />
                                    </div>
                                )}
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="text-base sm:text-lg font-semibold break-words line-clamp-2">
                                        {scrap.ogpData.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                        {scrap.ogpData.description}
                                    </p>
                                    <a
                                        href={scrap.ogpData.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs sm:text-sm text-blue-500 hover:underline truncate block mt-1"
                                        title={scrap.ogpData.link}
                                    >
                                        {scrap.ogpData.link}
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* View Moreボタン */}
                        {scrap.ogpData && (
                        <div className="flex items-center justify-start mt-2 sm:mt-4">
                            <Link
                                href={scrap.ogpData.link}
                                target="_blank"
                            >
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 text-sm rounded">
                                    詳細を見る
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
