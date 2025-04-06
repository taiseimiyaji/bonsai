import Header from "@/app/_components/Header";
import { nextAuthOptions } from "@/app/_utils/next-auth-options";
import NextAuthProvider from "@/app/providers";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Lyricrime Bonsai",
	description: "盆栽",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getServerSession(nextAuthOptions);
	return (
		<html lang="en" className="dark">
			<body className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
				<NextAuthProvider>
					<Header session={session} />
					<main className="min-h-[calc(100vh-4rem)]">
						{children}
					</main>
				</NextAuthProvider>
			</body>
		</html>
	);
}
