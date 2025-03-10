import Footer from "@/app/scrap/_components/Footer";
import Header from "@/app/scrap/_components/Header";
import React, { type ReactNode } from "react";

interface ScrapLayoutProps {
	children: ReactNode;
}

export default function ScrapLayout({ children }: ScrapLayoutProps) {
	return (
		<div>
			<main>
				<Header />
				{children}
				<Footer />
			</main>
		</div>
	);
}
