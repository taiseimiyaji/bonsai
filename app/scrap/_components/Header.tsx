import Link from "next/link";
import React from "react";
import {getServerSession} from "next-auth/next";
import { BookOpenIcon, CollectionIcon, PlusCircleIcon } from "@heroicons/react/outline";

export default async function ScrapSubNavigation() {
	const session = await getServerSession();
	const isLoggedIn = session?.user;

	return (
		<nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-4 sm:px-6 lg:px-8 shadow-sm">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
					<div className="flex items-center">
						<Link className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white flex items-center" href="/scrap">
							<BookOpenIcon className="h-5 w-5 mr-2" />
							<span>リンクスクラップ</span>
						</Link>
					</div>
					
					<div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
						<Link 
							className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 py-1 px-2"
							href="/scrap"
						>
							<CollectionIcon className="h-4 w-4 mr-1" />
							<span>カテゴリ一覧</span>
						</Link>
						
						{isLoggedIn && (
							<>
								<Link
									className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 py-1 px-2"
									href="/scrap/book"
								>
									<BookOpenIcon className="h-4 w-4 mr-1" />
									<span>マイスクラップ</span>
								</Link>
								
								<Link
									className="flex items-center bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition-colors"
									href="/scrap/book/new"
								>
									<PlusCircleIcon className="h-4 w-4 mr-1" />
									<span>新規作成</span>
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
