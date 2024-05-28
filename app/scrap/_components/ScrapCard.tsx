import Badge from "@/app/_components/Badge";
import Link from "next/link";
import React from "react";

interface ScrapCardProps {
	title: string;
	description: string;
	imageSrc: string;
	category: string;
	timeAgo: string;
}

export default function ScrapCard({
	title,
	description,
	imageSrc,
	category,
	timeAgo,
}: ScrapCardProps) {
	return (
		<Link
			className="bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105"
			href="#"
		>
			<div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-t-lg overflow-hidden flex items-center justify-center">
				{imageSrc ? (
					<img
						alt={title}
						className="w-full h-full object-cover"
						height={225}
						src={imageSrc}
						style={{
							aspectRatio: "400/225",
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
			<div className="p-4">
				<h2 className="text-xl font-bold mb-2">{title}</h2>
				<p className="text-gray-500 dark:text-gray-400 mb-4">{description}</p>
				<div className="flex items-center justify-between">
					<Badge>{category}</Badge>
					<span className="text-gray-500 dark:text-gray-400 text-sm">
						{timeAgo}
					</span>
				</div>
			</div>
		</Link>
	);
}
