import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { TRPCError } from '@trpc/server';
import {publicProcedure, router} from "@/app/api/trpc/init";

export const scrapBookRouter = router({
    getScrapBookById: publicProcedure
        .input(
            z.object({
                id: z.string().min(1),
            })
        )
        .query(async ({ input }) => {
            try {
                const scrapBook = await prisma.scrapBook.findUnique({
                    where: {
                        id: input.id,
                    },
                });

                if (!scrapBook) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'ScrapBook not found' });
                }

                return scrapBook;
            } catch (error) {
                console.error('Error fetching ScrapBook:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
            }
        }),

    createScrapBook: publicProcedure
        .input(
            z.object({
                title: z.string().nonempty('Title is required'),
                description: z.string().optional(),
                image: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const { session } = ctx;

            if (!session || !session.user || !session.userId) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized User' });
            }

            const userId = session.userId;

            try {
                const newScrapBook = await prisma.scrapBook.create({
                    data: {
                        title: input.title,
                        description: input.description || '',
                        image: input.image || '',
                        userId,
                    },
                });

                return newScrapBook;
            } catch (error) {
                console.error('Error creating ScrapBook:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
            }
        }),
});
