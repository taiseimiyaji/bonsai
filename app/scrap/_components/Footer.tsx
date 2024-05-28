import Link from "next/link";
import React from "react";

export default function Footer() {
	return (
		<footer className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
			<p className="text-sm">© 2024 Link Scraper</p>
			<nav className="flex items-center gap-4">
				<Link className="hover:underline" href="#">
					About
				</Link>
				<Link className="hover:underline" href="#">
					Contact
				</Link>
			</nav>
		</footer>
	);
}
