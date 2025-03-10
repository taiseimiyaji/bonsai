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
		<html lang="en">
			<body className={inter.className}>
				<NextAuthProvider>
					<Header session={session} />
					{children}
				</NextAuthProvider>
			</body>
		</html>
	);
}
