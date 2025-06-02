"use client";

import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import { ThemeToggle } from "../components/ThemeToggle";

const Header = ({ session }: { session: Session | null }) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	if (!session) {
		return (
			<header className="shadow-md bg-white dark:bg-gray-900 relative z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center">
							<Link href="/" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
								bonsai
							</Link>
						</div>
					</div>
				</div>
			</header>
		);
	}

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
							<li>
								<Link href="/rss" className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 px-3 py-2 rounded-md text-sm">
									RSS
								</Link>
							</li>
							<li>
								<Link href="/rss/info" className="font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 px-3 py-2 rounded-md text-sm">
									ダッシュボード
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
								<ThemeToggle />
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
						</ul>
					</div>

					{/* モバイルメニューボタン */}
					<div className="md:hidden flex items-center">
						<Image
							src={session.user?.image ?? "/user.svg"}
							alt={session.user?.name ?? "ユーザー"}
							width={32}
							height={32}
							className="rounded-full mr-2"
						/>
						<button
							onClick={toggleMenu}
							className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
						>
							{isMenuOpen ? (
								<XIcon className="h-6 w-6" />
							) : (
								<MenuIcon className="h-6 w-6" />
							)}
						</button>
					</div>

					{/* モバイルメニュー */}
					{isMenuOpen && (
						<div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-900 shadow-lg">
							<ul className="px-2 pt-2 pb-3 space-y-1">
								<li>
									<Link href="/rss" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800">
										RSS
									</Link>
								</li>
								<li>
									<Link href="/rss/info" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800">
										ダッシュボード
									</Link>
								</li>
								<li>
									<Link href="/scrap" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800">
										スクラップ
									</Link>
								</li>
								<li>
									<Link href="/todos" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800">
										TODO
									</Link>
								</li>
								<li>
									<div className="flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300">
										<span>テーマ</span>
										<ThemeToggle />
									</div>
								</li>
								<li>
									<button
										type={"button"}
										onClick={() => signOut()}
										className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800"
									>
										ログアウト
									</button>
								</li>
							</ul>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};

export default Header;
