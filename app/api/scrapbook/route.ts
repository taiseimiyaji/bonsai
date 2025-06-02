import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, image } = body;

        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized Session' }, { status: 401 });
        }

        const userId = session.userId;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized User' }, { status: 401 });
        }

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
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
