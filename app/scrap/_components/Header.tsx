import Link from "next/link";
import React from "react";

export default function Header() {
    return (
        <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
            <Link className="text-xl font-bold" href="#">
                Link Scraper
            </Link>
            <nav className="flex items-center gap-4">
                <Link className="hover:underline" href="#">
                    Categories
                </Link>
                <Link className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" href="#">
                    New Scrape
                </Link>
            </nav>
        </header>
    );
}
