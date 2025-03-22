import { z } from 'zod';
import { prisma } from '@/prisma/prisma';
import { formatDistanceToNow } from 'date-fns';
import { TRPCError } from '@trpc/server';

// ビルド時にNode.jsモジュールの問題を回避するための条件付きインポート
let ogs: any;
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
  // ビルド時にはダミーの実装を使用
  ogs = async () => ({ 
    result: { 
      ogTitle: 'ビルド時のダミータイトル',
      ogDescription: 'ビルド時のダミー説明',
      ogImage: [{ url: '' }]
    } 
  });
} else {
  // 実行時には実際のパッケージを使用
  import('open-graph-scraper').then(ogsModule => {
    ogs = ogsModule.default;
  });
}

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

// ビルド時はモックデータを使用するためのフラグ
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

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
                        ogpData: ogpDataValidation.success ? ogpDataValidation.data : null, 
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

            if (!session || !session.user) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized User' });
            }

            const userId = session.userId;

            function extractFirstLink(content: string): string | null {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const matches = content.match(urlRegex);
                return matches ? matches[0] : null;
            }

            async function fetchOgpData(url: string): Promise<{
                title: string;
                description: string;
                image: string;
            }> {
                if (isBuildTime) {
                    return {
                        title: 'ビルド時のダミータイトル',
                        description: 'ビルド時のダミー説明',
                        image: '',
                    };
                }
                
                try {
                    // ogsがまだロードされていない場合の対応
                    if (typeof ogs !== 'function') {
                        const ogsImport = await import('open-graph-scraper');
                        ogs = ogsImport.default;
                    }
                    
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

            let contentWithoutLink = input.content || '';
            let ogpData = {};

            if (input.content) {
                const link = extractFirstLink(input.content);
                if (link) {
                    contentWithoutLink = input.content.replace(link, '').trim();
                    
                    const ogpResult = await fetchOgpData(link);
                    ogpData = {
                        link,
                        title: ogpResult.title,
                        description: ogpResult.description,
                        image: ogpResult.image,
                    };
                }
            }

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
