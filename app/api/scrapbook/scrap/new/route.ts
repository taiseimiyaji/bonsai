import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, scrapBookId, content, link, image, ogpData, categoryId } = body;

        if (!title || !scrapBookId) {
            return NextResponse.json({ error: 'Title and ScrapBook ID are required' }, { status: 400 });
        }

        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized Session' }, { status: 401 });
        }

        const userId = session.userId;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized User' }, { status: 401 });
        }

        const data: any = {
            title,
            scrapBook: { connect: { id: scrapBookId } },
            content: content || '',
            link: link || '',
            image: image || '',
            ogpData: ogpData || {},
            user: { connect: { id: userId } },
        };

        if (categoryId) {
            data.category = { connect: { id: categoryId } };
        }

        const newScrap = await prisma.scrap.create({
            data,
        });

        return NextResponse.json(newScrap, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
