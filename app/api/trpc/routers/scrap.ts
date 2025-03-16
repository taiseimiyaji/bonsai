import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { formatDistanceToNow } from 'date-fns';
import { TRPCError } from '@trpc/server';
import ogs from 'open-graph-scraper'; // OGPデータを取得するライブラリ

import { publicProcedure, router } from "@/app/api/trpc/init";

// OGPデータのスキーマ定義
const OGPDataSchema = z.object({
    link: z.string(),
    image: z.string().nullable(),
    title: z.string().nullable(),
    description: z.string().nullable(),
});

const createScrapInput = z.object({
    scrapBookId: z.string().min(1),
    content: z.string().min(1).nullable(),
    categoryId: z.string().nullable().optional(),
});

export const scrapRouter = router({
    getScraps: publicProcedure
        .input(z.object({ scrapBookId: z.string() }))
        .query(async ({ input, ctx }) => {
            const { session } = ctx;

            try {
                const scrapBook = await prisma.scrapBook.findUnique({
                    where: { id: input.scrapBookId },
                });

                if (!session && scrapBook?.status === 'PRIVATE') {
                    throw new TRPCError({ code: 'UNAUTHORIZED' });
                }

                const scraps = await prisma.scrap.findMany({
                    where: { scrapBookId: input.scrapBookId },
                    include: {
                        category: true,
                        user: true,
                    },
                });

                const formattedScraps = scraps.map((scrap) => {
                    const ogpDataValidation = OGPDataSchema.safeParse(scrap.ogpData);
                    return {
                        ...scrap,
                        timeAgo: formatDistanceToNow(new Date(scrap.createdAt), { addSuffix: true }),
                        ogpData: ogpDataValidation.success ? ogpDataValidation.data : null, // バリデーション成功時はデータ、失敗時はnull
                        user: {
                            id: scrap.user.id,
                            name: scrap.user.name || '',
                            image: scrap.user.image || '',
                        }
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

            // セッションがない場合、エラーを投げる
            if (!session || !session.user) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized User' });
            }

            const userId = session.userId;

            // contentから最初のリンクを抽出する関数
            function extractFirstLink(content: string): string | null {
                const urlRegex = /(https?:\/\/[^\s]+)/;
                const match = content.match(urlRegex);
                return match ? match[0] : null;
            }

            // OGPデータを取得する関数
            async function fetchOgpData(url: string): Promise<{
                title: string;
                description: string;
                image: string;
            }> {
                try {
                    const { result } = await ogs({ url });
                    return {
                        title: result.ogTitle || '',
                        description: result.ogDescription || '',
                        image: result.ogImage?.at(0)?.url || '',
                    };
                } catch (error) {
                    console.error('OGPデータの取得エラー:', error);
                    return {
                        title: '',
                        description: '',
                        image: '',
                    };
                }
            }

            // contentとogpDataの初期化
            let contentWithoutLink = input.content || '';
            let ogpData = {};

            // contentがnullの場合は空文字列として扱う
            if (input.content === null) {
                contentWithoutLink = '';
            }

            // contentから最初のリンクを抽出
            const firstLink = extractFirstLink(contentWithoutLink);

            if (firstLink) {
                // 抽出したリンクのOGPデータを取得
                const fetchedOgpData = await fetchOgpData(firstLink);

                // OGPデータを設定し、リンクをogpDataに保存
                ogpData = {
                    link: firstLink,
                    ...fetchedOgpData,
                };

                // contentからリンクを削除
                contentWithoutLink = contentWithoutLink.replace(firstLink, '').trim();
            }

            // Prismaに渡すデータを準備
            const data: any = {
                scrapBook: { connect: { id: input.scrapBookId } },
                content: contentWithoutLink,
                ogpData: ogpData,
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
                console.error('Scrap作成エラー:', error);
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
            }
        }),
});
