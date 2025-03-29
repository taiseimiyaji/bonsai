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
        .query(async ({ input, ctx }) => {
            try {
                const scrapBook = await prisma.scrapBook.findUnique({
                    where: {
                        id: input.id,
                    },
                    include: {
                        user: true,
                    },
                });

                if (!scrapBook) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'ScrapBook not found' });
                }

                if (scrapBook.status === 'PRIVATE') {
                    const { session } = ctx;

                    if (!session || !session.user || !session.userId) {
                        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized User' });
                    }

                    if (session.userId !== scrapBook.userId) {
                        throw new TRPCError({ code: 'FORBIDDEN', message: 'Forbidden' });
                    }
                }

                return {
                    ...scrapBook,
                    user: {
                        id: scrapBook.user.id,
                        name: scrapBook.user.name || '',
                        image: scrapBook.user.image || '',
                    },
                }
                    ;
            } catch (error) {
                console.error('Error fetching ScrapBook:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
            }
        }),

    createScrapBook: publicProcedure
        .input(
            z.object({
                title: z.string().min(1),
                description: z.string().optional(),
                image: z.string().optional(),
                status: z.enum(['PUBLIC', 'PRIVATE']),
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
                        status: input.status,
                        userId,
                    },
                });

                return newScrapBook;
            } catch (error) {
                console.error('Error creating ScrapBook:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
            }
        }),
    getScrapBooks: publicProcedure
        .query(async ({ ctx }) => {
            const { session } = ctx;

            // ユーザーがログインしているか確認
            if (!session || !session.user || !session.userId) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized User' });
            }

            const userId = session.userId;

            try {
                // ログインユーザーの ScrapBook の一覧を取得
                const scrapBooks = await prisma.scrapBook.findMany({
                    where: {
                        userId,
                    },
                    include: {
                        user: true,
                    },
                    orderBy: {
                        createdAt: 'desc', // 作成日順に並べる場合
                    },
                });

                return scrapBooks;
            } catch (error) {
                console.error('Error fetching ScrapBooks:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
            }
        }),
    getPublicScrapBooks: publicProcedure
        .query(async () => {
            try {
                // ログインユーザーの ScrapBook の一覧を取得
                const scrapBooks = await prisma.scrapBook.findMany({
                    where: {
                        status: 'PUBLIC',
                    },
                    include: {
                        user: true,
                    },
                    orderBy: {
                        createdAt: 'desc', // 作成日順に並べる場合
                    },
                });

                const formattedScrapBooks = scrapBooks.map((scrapBook) => {
                    return {
                        ...scrapBook,
                        user: {
                            id: scrapBook.user.id,
                            name: scrapBook.user.name || '',
                            image: scrapBook.user.image || '',
                        },
                    };
                });
                return formattedScrapBooks || [];
            } catch (error) {
                console.error('Error fetching ScrapBooks:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
            }
        }),
    updateScrapBookStatus: publicProcedure
        .input(
            z.object({
                id: z.string().min(1),
                status: z.enum(['PUBLIC', 'PRIVATE']),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const { session } = ctx;

            if (!session || !session.user || !session.userId) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized User' });
            }

            const userId = session.userId;

            try {
                // スクラップブックが存在するか確認
                const scrapBook = await prisma.scrapBook.findUnique({
                    where: {
                        id: input.id,
                    },
                });

                if (!scrapBook) {
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'ScrapBook not found' });
                }

                // 所有者かどうか確認
                if (scrapBook.userId !== userId) {
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to update this ScrapBook' });
                }

                // ステータスを更新
                const updatedScrapBook = await prisma.scrapBook.update({
                    where: {
                        id: input.id,
                    },
                    data: {
                        status: input.status,
                    },
                });

                return updatedScrapBook;
            } catch (error) {
                console.error('Error updating ScrapBook status:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
            }
        }),
});
