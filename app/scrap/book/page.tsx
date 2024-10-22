import ScrapBookCard from "@/app/scrap/_components/ScrapBookCard";
import React from "react";
import {trpcCaller} from "@/app/api/trpc/trpc-server";
import {getServerSession} from "next-auth/next";
import {redirect} from "next/navigation";
import {nextAuthOptions} from "@/app/_utils/next-auth-options";

export default async function ScrapBookList() {
	const session = await getServerSession(nextAuthOptions);
	if (!session?.user) {
		redirect('/login');
	}
	const scrapBooks = await trpcCaller(async (caller) => {
		return caller.scrapBook.getScrapBooks();
	});

	return (
		<div className="flex flex-col min-h-[100dvh]">
			<main className="flex-1 bg-gray-100 dark:bg-gray-700 p-6">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-3xl font-bold mb-6">{session.user.name}のScrap</h1>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{scrapBooks.map((scrapBook) => (
							<ScrapBookCard
								key={scrapBook.id}
								id={scrapBook.id}
								title={scrapBook.title}
								description={scrapBook.description || ""}
								image={scrapBook.image || ""}
								user={scrapBook.user}
								createdAt={scrapBook.createdAt.toISOString()}
								updatedAt={scrapBook.updatedAt.toISOString()}
							/>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
