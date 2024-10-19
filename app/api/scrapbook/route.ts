import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/app/_utils/next-auth-options';
import { IncomingMessage } from 'http';
import { prisma } from '@/prisma/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, image } = body;
        // Convert Request to IncomingMessage with cookies
        const headers = Object.fromEntries(request.headers.entries());
        const cookies = Object.fromEntries(request.headers.get('cookie')?.split(';').map(cookie => cookie.trim().split('=')) ?? []);
        const req: IncomingMessage & { cookies: Partial<{ [key: string]: string }> } = {
            headers,
            method: request.method,
            url: request.url,
            cookies,
        } as IncomingMessage & { cookies: Partial<{ [key: string]: string }> };

        const session = await getServerSession(nextAuthOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized Session' }, { status: 401 });
        }

        const userId = session.userId;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized User' }, { status: 401 });
        }

        console.log('userId:', userId)
        const newScrapBook = await prisma.scrapBook.create({
            data: {
                title,
                description,
                userId,
                image: image || '',
            },
        });

        return NextResponse.json(newScrapBook, { status: 201 });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
