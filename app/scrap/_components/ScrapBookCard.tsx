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
        <Link href={`/scrap/book/${id}`} className="block bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 p-6 relative">
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
                        <BookOpenIcon className="w-12 h-12 text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400 text-lg mt-2">{title}</span>
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center mt-4">
                <h2 className="text-2xl font-bold">{title}</h2>
                <div className={`flex items-center px-2 py-1 rounded-full ${status === "PUBLIC" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}`}>
                    {status === "PUBLIC" ? (
                        <><GlobeIcon className="w-4 h-4 mr-1" /> 公開</>
                    ) : (
                        <><LockClosedIcon className="w-4 h-4 mr-1" /> 非公開</>
                    )}
                </div>
            </div>
            {description && <p className="text-gray-500 dark:text-gray-400 mb-4 mt-2">{description}</p>}
            <div className="flex items-center gap-2 mb-2">
                <Image
                    src={user.image || "/user.svg"}
                    alt={user.name || "ユーザー"}
                    className="w-8 h-8 object-cover rounded-full"
                    width={32}
                    height={32}
                />
                <span className="text-gray-500 dark:text-gray-400">{user.name || "匿名ユーザー"}</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Created: {new Date(createdAt).toLocaleDateString()}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Updated: {new Date(updatedAt).toLocaleDateString()}</p>
        </Link>
    );
};

export default ScrapBookCard;
