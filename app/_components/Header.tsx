"use client";

import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";

const Header = ({ session }: { session: Session | null }) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	return (
		<header className="shadow-md bg-white dark:bg-gray-900 relative z-10">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<div className="flex items-center">
						<Link href="/" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
							bonsai
						</Link>
					</div>
					
					{/* デスクトップメニュー */}
					<div className="hidden md:block">
						<ul className="flex items-center space-x-4">
							{session ? (
								<>
									<li>
										<Link href="/rss" className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 px-3 py-2 rounded-md text-sm">
											RSS
										</Link>
									</li>
									<li>
										<Link href="/scrap" className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 px-3 py-2 rounded-md text-sm">
											スクラップ
										</Link>
									</li>
									<li>
										<Link href="/todos" className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 px-3 py-2 rounded-md text-sm">
											TODO
										</Link>
									</li>
									<li>
										<Image
											src={session.user?.image ?? "/user.svg"}
											alt={session.user?.name ?? "ユーザー"}
											width={32}
											height={32}
											className="rounded-full"
										/>
									</li>
									<li>
										<button
											type={"button"}
											onClick={() => signOut()}
											className="rounded-lg bg-blue-500 px-3 py-2 text-white text-sm hover:bg-blue-600 transition-colors"
										>
											ログアウト
										</button>
									</li>
								</>
							) : (
								<li>
									<Link href="/login">
										<button
											type={"button"}
											className="rounded-lg bg-blue-500 px-3 py-2 text-white text-sm hover:bg-blue-600 transition-colors"
										>
											ログイン
										</button>
									</Link>
								</li>
							)}
						</ul>
					</div>

					{/* モバイルメニューボタン */}
					<div className="md:hidden flex items-center">
						{session && (
							<Image
								src={session.user?.image ?? "/user.svg"}
								alt={session.user?.name ?? "ユーザー"}
								width={32}
								height={32}
								className="rounded-full mr-2"
							/>
						)}
						<button
							onClick={toggleMenu}
							className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
						>
							{isMenuOpen ? (
								<XIcon className="block h-6 w-6" aria-hidden="true" />
							) : (
								<MenuIcon className="block h-6 w-6" aria-hidden="true" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* モバイルメニュー */}
			{isMenuOpen && (
				<div className="md:hidden bg-white dark:bg-gray-900 shadow-lg absolute w-full">
					<div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
						{session ? (
							<>
								<Link href="/rss" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800">
									RSS
								</Link>
								<Link href="/scrap" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800">
									スクラップ
								</Link>
								<Link href="/todos" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800">
									TODO
								</Link>
								<button
									type={"button"}
									onClick={() => signOut()}
									className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
								>
									ログアウト
								</button>
							</>
						) : (
							<Link href="/login" className="block">
								<button
									type={"button"}
									className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-blue-500 hover:bg-blue-600 transition-colors"
								>
									ログイン
								</button>
							</Link>
						)}
					</div>
				</div>
			)}
		</header>
	);
};

export default Header;
