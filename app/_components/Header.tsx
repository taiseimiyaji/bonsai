"use client";

import { type Session } from "next-auth";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

const Header = ({ session }: { session: Session | null }) => {
	return (
		<header className="flex items-center justify-between p-4 shadow-md outline">
			<div className="flex items-center">
				<Link href="/" className="text-4xl font-bold">
					bonsai
				</Link>
			</div>
			<ul className="flex items-center space-x-4">
				{session ? (
					<>
						<li>
							<Image
								src={session.user?.image ?? ""}
								alt={session.user?.name ?? ""}
								width={40}
								height={40}
								className="rounded-full"
							/>
						</li>
						<li>
							<button
								type={"button"}
								onClick={() => signOut()}
								className="rounded-lg bg-blue-500 px-4 py-[7px] text-white hover:bg-gray-600"
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
								className="rounded-lg bg-blue-500 px-4 py-[7px] text-white hover:bg-gray-600"
							>
								ログイン
							</button>
						</Link>
					</li>
				)}
			</ul>
		</header>
	);
};

export default Header;
