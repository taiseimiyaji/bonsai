import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/app/_utils/next-auth-options";
import { formatDistanceToNow } from 'date-fns';
import { prisma } from "@/prisma/prisma";

export interface ScrapWithTimeAgo {
    id: string;
    userId: string;
    title: string;
    content: string | null;
    link: string | null;
    image: string | null;
    ogpData: {
        image: string;
    } | null;
    scrapBookId: string;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date;
    timeAgo: string;
    category: {
        id: string;
        name: string;
    } | null;
}

export async function GET(request: Request) {
    const { pathname } = new URL(request.url);
    const id = pathname.split('/').pop(); // URLの最後のパスセグメントからIDを取得

    if (!id) {
        return NextResponse.json({ error: 'Invalid ScrapBook ID' }, { status: 400 });
    }

    const session = await getServerSession(nextAuthOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const scraps = await prisma.scrap.findMany({
            where: { scrapBookId: id },
            include: { category: true },
        });

        const formattedScraps: ScrapWithTimeAgo[] = scraps.map(scrap => ({
            ...scrap,
            timeAgo: formatDistanceToNow(new Date(scrap.createdAt), { addSuffix: true })
        }));

        return NextResponse.json(formattedScraps, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
