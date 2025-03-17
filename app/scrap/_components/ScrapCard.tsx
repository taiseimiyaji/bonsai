import Badge from "@/app/_components/Badge";
import Link from "next/link";
import React from "react";
import Image from "next/image";

interface ScrapCardProps {
	title: string;
	description: string;
	imageSrc: string;
	category: string;
	timeAgo: string;
}

const ScrapCard: React.FC<ScrapCardProps> = ({
	title,
	description,
	imageSrc,
	category,
	timeAgo,
}: ScrapCardProps) => {
	return (
		<Link
			className="bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105"
			href="#"
		>
			<div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-t-lg overflow-hidden flex items-center justify-center">
				{imageSrc ? (
					<Image
						alt={title}
						className="w-full h-full object-cover"
						height={225}
						src={imageSrc}
						style={{
							objectFit: "cover",
						}}
						width={400}
					/>
				) : (
					<span className="text-gray-500 dark:text-gray-400 text-lg">
						{title}
					</span>
				)}
			</div>
			<div className="p-6">
				<div className="flex justify-between items-center mb-2">
					<Badge text={category} />
					<span className="text-gray-500 dark:text-gray-400 text-sm">
						{timeAgo}
					</span>
				</div>
				<h3 className="text-xl font-bold mb-2">{title}</h3>
				<p className="text-gray-500 dark:text-gray-400 line-clamp-2">
					{description}
				</p>
			</div>
		</Link>
	);
};

export default ScrapCard;
