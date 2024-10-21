// app/api/trpc/routers/scrap.ts
import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { formatDistanceToNow } from 'date-fns';
import { TRPCError } from '@trpc/server';

import {publicProcedure, router} from "@/app/api/trpc/init";

const OGPDataSchema = z.object({
    image: z.string(),
});
const createScrapInput = z.object({
    title: z.string().min(1),
    scrapBookId: z.string().min(1),
    content: z.string().nullable().optional(),
    link: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    ogpData: z.any().optional(),
    categoryId: z.string().nullable().optional(),
});

export const scrapRouter = router({
    getScraps: publicProcedure
        .input(z.object({ scrapBookId: z.string() }))
        .query(async ({ input, ctx }) => {
            const { session } = ctx;
            if (!session) {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            try {
                const scrapBook = await prisma.scrapBook.findUnique({
                    where: { id: input.scrapBookId },
                });

                const scraps = await prisma.scrap.findMany({
                    where: { scrapBookId: input.scrapBookId },
                    include: { category: true },
                });

                const formattedScraps = scraps.map((scrap) => {
                    const ogpDataValidation = OGPDataSchema.safeParse(scrap.ogpData);
                    return {
                        ...scrap,
                        timeAgo: formatDistanceToNow(new Date(scrap.createdAt), { addSuffix: true }),
                        ogpData: ogpDataValidation.success ? ogpDataValidation.data : null, // バリデーション成功時はデータ、失敗時はnull
                    };
                });
                const result = scrapBook ? formattedScraps : null;
                return result;
            } catch (error) {
                console.error('Error fetching scraps:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
            }
        }),
    addScrap: publicProcedure
        .input(createScrapInput)
        .mutation(async ({ input, ctx }) => {
            const { session } = ctx;

            // セッションがない場合はエラーを投げる
            if (!session || !session.user) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized User' });
            }

            const userId = session.userId;

            // Prisma に渡すデータを準備
            const data: any = {
                title: input.title,
                scrapBook: { connect: { id: input.scrapBookId } },
                content: input.content || '',
                link: input.link || '',
                image: input.image || '',
                ogpData: input.ogpData || {},
                user: { connect: { id: userId } },
            };

            if (input.categoryId) {
                data.category = { connect: { id: input.categoryId } };
            }

            try {
                const newScrap = await prisma.scrap.create({
                    data,
                });

                return newScrap;
            } catch (error) {
                console.error('Error creating scrap:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
            }
        }),
});
