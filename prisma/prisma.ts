import { PrismaClient } from '@prisma/client';

// 環境変数がビルド時かどうかを判定
const isBuildTime = process.env.NODE_ENV === 'production' && 
                    (process.env.NEXT_PHASE === 'phase-production-build' || 
                     !process.env.DATABASE_URL || 
                     process.env.DATABASE_URL.includes('dummy'));

// モックデータ
const mockData = {
  scrapBook: [],
  scrap: [],
  user: [],
  feed: [],
  article: [],
  userFeed: [],
  publicFeed: [],
  rssFeed: [],
  rssArticle: [],
  rssReadStatus: [],
  cronExecutionLog: [],
};

// モックPrismaクライアント
const mockPrismaClient = {
  scrapBook: {
    findMany: async () => Promise.resolve(mockData.scrapBook),
    findUnique: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
  },
  scrap: {
    findMany: async () => Promise.resolve(mockData.scrap),
    findUnique: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
  },
  user: {
    findMany: async () => Promise.resolve(mockData.user),
    findUnique: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
  },
  feed: {
    findMany: async () => Promise.resolve(mockData.feed),
    findUnique: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
  },
  article: {
    findMany: async () => Promise.resolve(mockData.article),
    findUnique: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
  },
  userFeed: {
    findMany: async () => Promise.resolve(mockData.userFeed),
    findUnique: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
  },
  publicFeed: {
    findMany: async () => Promise.resolve(mockData.publicFeed),
    findUnique: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
  },
  // RSSフィード関連のモックを追加
  rssFeed: {
    findMany: async () => Promise.resolve(mockData.rssFeed),
    findUnique: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
  },
  rssArticle: {
    findMany: async () => Promise.resolve(mockData.rssArticle),
    findUnique: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
    createMany: async () => Promise.resolve({ count: 0 }),
  },
  rssReadStatus: {
    findMany: async () => Promise.resolve(mockData.rssReadStatus),
    findUnique: async () => Promise.resolve(null),
    create: async () => Promise.resolve({}),
    update: async () => Promise.resolve({}),
    delete: async () => Promise.resolve({}),
    upsert: async () => Promise.resolve({}),
  },
  cronExecutionLog: {
    create: async () => Promise.resolve({}),
    findMany: async () => Promise.resolve(mockData.cronExecutionLog),
  },
  $connect: async () => Promise.resolve(),
  $disconnect: async () => Promise.resolve(),
};

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// ビルド時かどうかに応じて、実際のクライアントかモッククライアントを返す
export const prisma = globalForPrisma.prisma || 
  (isBuildTime 
    ? (mockPrismaClient as unknown as PrismaClient)
    : new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      })
  );

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ビルド時にはログを出力
if (isBuildTime) {
  console.log('Using mock Prisma client for build time');
} else {
  console.log('Using real Prisma client');
}
