import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import {getServerSession} from "next-auth";
import NextAuthProvider from "@/app/providers";
import Header from "@/app/_components/Header";
import {nextAuthOptions} from "@/app/_utils/next-auth-options";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
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
  )
}
