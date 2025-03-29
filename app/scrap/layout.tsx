import Footer from "@/app/scrap/_components/Footer";
import ScrapSubNavigation from "@/app/scrap/_components/Header";
import React, { type ReactNode } from "react";

interface ScrapLayoutProps {
	children: ReactNode;
}

export default function ScrapLayout({ children }: ScrapLayoutProps) {
	return (
		<div className="flex flex-col min-h-screen">
			<ScrapSubNavigation />
			<main className="flex-1">
				{children}
			</main>
			<Footer />
		</div>
	);
}
