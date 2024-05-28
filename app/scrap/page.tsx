import { nextAuthOptions } from "@/app/_utils/next-auth-options";
import Footer from "@/app/scrap/_components/Footer";
import Header from "@/app/scrap/_components/Header";
import ScrapCard from "@/app/scrap/_components/ScrapCard";
import { getScrap } from "@/app/scrap/action";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import React from "react";

const prisma = new PrismaClient();

export default async function ScrapList() {
	const session = await getServerSession(nextAuthOptions);
	if (!session) {
		throw new Error("Session is not found");
	}
	const userId = session.userId;
	// const scraps = await getScrap({ userId: userId });

	return (
		<div className="flex flex-col min-h-[100dvh]">
			<main className="flex-1 bg-gray-100 dark:bg-gray-700 p-6">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-3xl font-bold mb-6">All Scraps</h1>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<ScrapCard
							title="Scrap 1"
							description="This is a description of the first scrap."
							imageSrc=""
							category="Design"
							timeAgo="2 days ago"
						/>
						<ScrapCard
							title="Scrap 2"
							description="This is a description of the second scrap."
							imageSrc=""
							category="Development"
							timeAgo="1 week ago"
						/>
						<ScrapCard
							title="Scrap 3"
							description="This is a description of the third scrap."
							imageSrc=""
							category="Marketing"
							timeAgo="3 weeks ago"
						/>
					</div>
				</div>
			</main>
		</div>
	);
}
