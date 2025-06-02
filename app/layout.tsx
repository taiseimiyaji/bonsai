import Header from "@/app/_components/Header";
import { auth } from "@/auth";
import NextAuthProvider from "@/app/providers";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import type { Metadata } from "next";
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
	const session = await auth();
	return (
		<html lang="en">
			<body className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen transition-colors`}>
				<ThemeProvider>
					<NextAuthProvider>
						<Header session={session} />
						<main className="min-h-[calc(100vh-4rem)]">
							{children}
						</main>
					</NextAuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
