/**
 * ビルド時にデータベースアクセスを回避するためのモックプロバイダー
 */

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
  $connect: async () => Promise.resolve(),
  $disconnect: async () => Promise.resolve(),
};

// 実際のPrismaクライアントをインポート
import { PrismaClient } from '@prisma/client';

// ビルド時かどうかに応じて、実際のクライアントかモッククライアントを返す
export function getPrismaClient() {
  if (isBuildTime) {
    console.log('Using mock Prisma client for build time');
    return mockPrismaClient as unknown as PrismaClient;
  }
  
  console.log('Using real Prisma client');
  return new PrismaClient();
}

// シングルトンインスタンス
let prismaInstance: PrismaClient | null = null;

// シングルトンパターンでPrismaクライアントを取得
export function getPrisma() {
  if (!prismaInstance) {
    prismaInstance = getPrismaClient();
  }
  return prismaInstance;
}

export default getPrisma();
