import React, { ReactNode } from 'react';
import Header from "@/app/scrap/_components/Header";
import Footer from "@/app/scrap/_components/Footer";

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
