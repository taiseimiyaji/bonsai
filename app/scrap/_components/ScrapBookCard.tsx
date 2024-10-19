import React from "react";
import Link from "next/link";
import { BookOpenIcon } from "@heroicons/react/solid"; // Heroiconsのアイコンを使用

interface ScrapBookCardProps {
    id: string;
    title: string;
    description?: string;
    image?: string;
    createdAt: string;
    updatedAt: string;
}

const ScrapBookCard: React.FC<ScrapBookCardProps> = ({
                                                         id,
                                                         title,
                                                         description,
                                                         image,
                                                         createdAt,
                                                         updatedAt,
                                                     }) => {
    return (
        <Link href={`/scrap/book/${id}`} className="block bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 p-6 relative">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden flex items-center justify-center">
                {image && image.trim() !== "" ? (
                    <img
                        alt={title}
                        className="w-full h-full object-cover"
                        src={image}
                        style={{
                            aspectRatio: "400/225",
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
            <h2 className="text-2xl font-bold mb-4 mt-4">{title}</h2>
            {description && <p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
            <p className="text-gray-500 dark:text-gray-400 text-sm">Created: {new Date(createdAt).toLocaleDateString()}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Updated: {new Date(updatedAt).toLocaleDateString()}</p>
        </Link>
    );
};

export default ScrapBookCard;
