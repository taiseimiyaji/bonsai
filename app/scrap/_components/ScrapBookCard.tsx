import React from "react";
import Link from "next/link";
import { BookOpenIcon, LockClosedIcon, GlobeIcon } from "@heroicons/react/solid";
import Image from "next/image";

interface ScrapBookCardProps {
    id: string;
    title: string;
    description?: string;
    image?: string;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    }
    createdAt: string;
    updatedAt: string;
    status: "PUBLIC" | "PRIVATE"; 
}

const ScrapBookCard: React.FC<ScrapBookCardProps> =
    ({
         id,
         title,
         description,
         image,
         user,
         createdAt,
         updatedAt,
         status, 
}) => {
    return (
        <Link href={`/scrap/book/${id}`} className="block bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 p-4 sm:p-6 relative">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden flex items-center justify-center">
                {image && image.trim() !== "" ? (
                    <Image
                        alt={title}
                        className="w-full h-full object-cover"
                        src={image}
                        width={400}
                        height={225}
                        style={{
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <BookOpenIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-lg mt-2 text-center px-2">{title}</span>
                    </div>
                )}
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 sm:mt-4 gap-2 sm:gap-0">
                <h2 className="text-xl sm:text-2xl font-bold break-words">{title}</h2>
                <div className={`flex items-center px-2 py-1 rounded-full text-sm whitespace-nowrap ${status === "PUBLIC" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}`}>
                    {status === "PUBLIC" ? (
                        <><GlobeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 公開</>
                    ) : (
                        <><LockClosedIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 非公開</>
                    )}
                </div>
            </div>
            {description && <p className="text-gray-500 dark:text-gray-400 mb-3 mt-2 text-sm sm:text-base break-words line-clamp-2">{description}</p>}
            <div className="flex items-center gap-2 mb-2">
                <Image
                    src={user.image || "/user.svg"}
                    alt={user.name || "ユーザー"}
                    className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded-full"
                    width={32}
                    height={32}
                />
                <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm truncate">{user.name || "匿名ユーザー"}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
                <p className="text-gray-500 dark:text-gray-400">作成: {new Date(createdAt).toLocaleDateString()}</p>
                <p className="text-gray-500 dark:text-gray-400">更新: {new Date(updatedAt).toLocaleDateString()}</p>
            </div>
        </Link>
    );
};

export default ScrapBookCard;
